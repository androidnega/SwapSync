"""
Swap Transaction API Routes with Business Logic and Resale Tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_manage_swaps
from app.core.invoice_generator import create_swap_invoice
from app.core.activity_logger import log_activity
from app.core.sms import send_swap_completion_sms
from app.models.user import User
from app.models.swap import Swap, ResaleStatus
from app.models.customer import Customer
from app.models.phone import Phone, PhoneStatus, PhoneOwnershipHistory
from app.schemas.swap import SwapCreate, SwapResponse, SwapResaleUpdate

router = APIRouter(prefix="/swaps", tags=["Swaps"])


def send_swap_sms_background(
    customer_name: str,
    phone_number: str,
    customer_id: int,
    phone_model: str,
    final_price: float,
    swap_id: int
):
    """Background task to send swap completion SMS"""
    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            send_swap_completion_sms(
                db=db,
                customer_name=customer_name,
                phone_number=phone_number,
                customer_id=customer_id,
                phone_model=phone_model,
                final_price=final_price,
                swap_id=swap_id
            )
        finally:
            db.close()
    except Exception as e:
        print(f"❌ Failed to send swap SMS in background: {e}")


@router.post("/", response_model=SwapResponse, status_code=status.HTTP_201_CREATED)
def create_swap(
    swap: SwapCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a swap transaction (Shop Keeper, CEO, Admin only)
    Customer trades in their old phone + cash for a new phone
    SMS notification is sent in background
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage swap transactions"
        )
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == swap.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Verify new phone exists and is available
    new_phone = db.query(Phone).filter(Phone.id == swap.new_phone_id).first()
    if not new_phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="New phone not found"
        )
    
    if not new_phone.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New phone is not available for swap"
        )
    
    # Calculate final price after discount
    # Final price = balance_paid - discount_amount
    final_price = swap.balance_paid - swap.discount_amount
    
    if final_price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount cannot be greater than balance paid"
        )
    
    # Validate swap economics
    total_value = swap.given_phone_value + final_price
    if total_value < new_phone.value * 0.5:  # Minimum 50% of phone value
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total swap value ({total_value}) is too low for this phone (value: {new_phone.value})"
        )
    
    # Create swap record
    new_swap = Swap(
        customer_id=swap.customer_id,
        given_phone_description=swap.given_phone_description,
        given_phone_value=swap.given_phone_value,
        given_phone_imei=swap.given_phone_imei,
        new_phone_id=swap.new_phone_id,
        balance_paid=swap.balance_paid,
        discount_amount=swap.discount_amount,
        final_price=final_price,
        resale_status=ResaleStatus.PENDING,
        resale_value=0.0,
        profit_or_loss=0.0,
        created_at=datetime.utcnow()
    )
    db.add(new_swap)
    db.flush()  # Get the swap ID before generating invoice
    
    # Mark the new phone as unavailable and update status
    new_phone.is_available = False
    new_phone.status = PhoneStatus.SWAPPED
    new_phone.swapped_from_id = new_swap.id
    
    # Update phone ownership
    new_phone.current_owner_id = customer.id
    new_phone.current_owner_type = "customer"
    
    # Record ownership history
    ownership_change = PhoneOwnershipHistory(
        phone_id=new_phone.id,
        owner_id=customer.id,
        owner_type="customer",
        change_reason="swap",
        transaction_id=new_swap.id,
        change_date=datetime.utcnow()
    )
    db.add(ownership_change)
    
    # Generate invoice
    invoice = create_swap_invoice(db, new_swap, customer, new_phone, current_user)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created swap for {customer.full_name}",
        module="swaps",
        target_id=new_swap.id,
        details=f"Trade-in: {swap.given_phone_description}, New phone: {new_phone.brand} {new_phone.model}, Discount: ₵{swap.discount_amount}"
    )
    
    db.commit()
    db.refresh(new_swap)
    
    # Schedule SMS notification in background (non-blocking)
    phone_model = f"{new_phone.brand} {new_phone.model}"
    background_tasks.add_task(
        send_swap_sms_background,
        customer_name=customer.full_name,
        phone_number=customer.phone_number,
        customer_id=customer.id,
        phone_model=phone_model,
        final_price=final_price,
        swap_id=new_swap.id
    )
    
    return new_swap


@router.get("/", response_model=List[SwapResponse])
def list_swaps(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all swaps with pagination (Shop Keeper, CEO, Admin only)"""
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view swap transactions"
        )
    swaps = db.query(Swap).order_by(Swap.created_at.desc()).offset(skip).limit(limit).all()
    return swaps


@router.get("/pending-resales", response_model=List[SwapResponse])
def get_pending_resales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all swaps with trade-in phones pending resale (Shop Keeper, CEO, Admin only)
    These are phones the shop received but hasn't sold yet
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view swap transactions"
        )
    pending_swaps = (
        db.query(Swap)
        .filter(Swap.resale_status == ResaleStatus.PENDING)
        .filter(Swap.given_phone_value > 0)  # Only swaps where customer gave a phone
        .order_by(Swap.created_at.desc())
        .all()
    )
    return pending_swaps


@router.get("/sold-resales", response_model=List[SwapResponse])
def get_sold_resales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all swaps where trade-in phones have been resold (Shop Keeper, CEO, Admin only)
    Shows completed swap chains with profit/loss data
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view swap transactions"
        )
    sold_swaps = (
        db.query(Swap)
        .filter(Swap.resale_status == ResaleStatus.SOLD)
        .order_by(Swap.created_at.desc())
        .all()
    )
    return sold_swaps


@router.get("/profit-summary", response_model=dict)
def get_profit_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get profit/loss summary for all swaps (Shop Keeper, CEO, Admin only)
    Returns total profit, average, and breakdown
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view swap transactions"
        )
    # Get all swaps with completed resales
    completed_swaps = (
        db.query(Swap)
        .filter(Swap.resale_status == ResaleStatus.SOLD)
        .all()
    )
    
    if not completed_swaps:
        return {
            "total_swaps": 0,
            "total_profit": 0.0,
            "average_profit": 0.0,
            "profitable_count": 0,
            "loss_count": 0,
            "break_even_count": 0
        }
    
    total_profit = sum(s.profit_or_loss for s in completed_swaps)
    avg_profit = total_profit / len(completed_swaps)
    
    profitable = len([s for s in completed_swaps if s.profit_or_loss > 0])
    losses = len([s for s in completed_swaps if s.profit_or_loss < 0])
    break_even = len([s for s in completed_swaps if s.profit_or_loss == 0])
    
    return {
        "total_swaps": len(completed_swaps),
        "total_profit": round(total_profit, 2),
        "average_profit": round(avg_profit, 2),
        "profitable_count": profitable,
        "loss_count": losses,
        "break_even_count": break_even,
        "swaps": [
            {
                "id": s.id,
                "given_phone": s.given_phone_description,
                "given_value": s.given_phone_value,
                "resale_value": s.resale_value,
                "balance_paid": s.balance_paid,
                "profit_or_loss": round(s.profit_or_loss, 2),
                "created_at": s.created_at.isoformat()
            } for s in completed_swaps
        ]
    }


@router.get("/customer/{customer_id}", response_model=List[SwapResponse])
def get_customer_swaps(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all swaps for a specific customer (Shop Keeper, CEO, Admin only)"""
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view swap transactions"
        )
    swaps = db.query(Swap).filter(Swap.customer_id == customer_id).order_by(Swap.created_at.desc()).all()
    return swaps


@router.get("/phone/{phone_id}/chain", response_model=dict)
def get_phone_swap_chain(
    phone_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the swap chain for a phone (Shop Keeper, CEO, Admin only)
    Shows the history of swaps for this phone
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view swap transactions"
        )
    phone = db.query(Phone).filter(Phone.id == phone_id).first()
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    chain = []
    current_phone = phone
    
    # Trace back through swaps
    while current_phone and current_phone.swapped_from_id:
        swap = db.query(Swap).filter(Swap.id == current_phone.swapped_from_id).first()
        if swap:
            chain.append({
                "swap_id": swap.id,
                "given_phone_description": swap.given_phone_description,
                "given_phone_value": swap.given_phone_value,
                "balance_paid": swap.balance_paid,
                "total_value": swap.total_transaction_value,
                "created_at": swap.created_at
            })
        current_phone = None  # End of chain for now (can be extended to track further)
    
    return {
        "phone_id": phone.id,
        "brand": phone.brand,
        "model": phone.model,
        "current_value": phone.value,
        "swap_chain": chain,
        "chain_length": len(chain)
    }


@router.put("/{swap_id}/resale", response_model=SwapResponse)
def update_resale(
    swap_id: int, 
    resale_update: SwapResaleUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update resale information and calculate profit/loss (Shop Keeper, CEO, Admin only)
    Called when a trade-in phone is finally resold
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage swap transactions"
        )
    swap = db.query(Swap).filter(Swap.id == swap_id).first()
    if not swap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap not found"
        )
    
    # Check if already resold
    if swap.resale_status != ResaleStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This swap has already been marked as resold"
        )
    
    # Update resale information
    swap.resale_value = resale_update.resale_value
    swap.resale_status = ResaleStatus.SOLD
    
    # Calculate profit/loss
    # Profit = (Resale value + Original balance paid) - Original new phone price
    # This shows if the shop made money on the complete transaction
    total_recovered = swap.resale_value + swap.balance_paid
    original_phone_cost = db.query(Phone).filter(Phone.id == swap.new_phone_id).first().value
    swap.profit_or_loss = total_recovered - original_phone_cost
    
    db.commit()
    db.refresh(swap)
    
    return swap


@router.get("/{swap_id}", response_model=SwapResponse)
def get_swap(
    swap_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific swap by ID (Shop Keeper, CEO, Admin only)"""
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view swap transactions"
        )
    swap = db.query(Swap).filter(Swap.id == swap_id).first()
    if not swap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap not found"
        )
    return swap

