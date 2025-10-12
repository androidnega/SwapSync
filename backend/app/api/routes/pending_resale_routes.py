"""
Pending Resale API Routes - Comprehensive resale tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_manage_swaps, can_view_swaps
from app.core.activity_logger import log_activity
from app.models.user import User
from app.models.pending_resale import PendingResale, TransactionType, PhoneSaleStatus, ProfitStatus
from app.models.phone import Phone, PhoneStatus
from app.models.customer import Customer
from app.models.swap import Swap
from app.models.sale import Sale
from app.schemas.pending_resale import PendingResaleCreate, PendingResaleUpdate, PendingResaleResponse

router = APIRouter(prefix="/pending-resales", tags=["Pending Resales"])


@router.post("/", response_model=PendingResaleResponse, status_code=status.HTTP_201_CREATED)
def create_pending_resale(
    resale: PendingResaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a pending resale record (Shop Keeper, Manager, Admin only)
    This is typically called automatically when a swap or sale happens
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage resales"
        )
    
    # Verify sold phone exists
    sold_phone = db.query(Phone).filter(Phone.id == resale.sold_phone_id).first()
    if not sold_phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sold phone not found"
        )
    
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == resale.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Create pending resale record
    new_resale = PendingResale(
        sold_phone_id=resale.sold_phone_id,
        sold_phone_brand=resale.sold_phone_brand,
        sold_phone_model=resale.sold_phone_model,
        sold_phone_value=resale.sold_phone_value,
        sold_phone_status=resale.sold_phone_status,
        incoming_phone_id=resale.incoming_phone_id,
        incoming_phone_brand=resale.incoming_phone_brand,
        incoming_phone_model=resale.incoming_phone_model,
        incoming_phone_condition=resale.incoming_phone_condition,
        incoming_phone_value=resale.incoming_phone_value,
        incoming_phone_status=PhoneSaleStatus.AVAILABLE if resale.incoming_phone_id else None,
        transaction_type=TransactionType.SWAP if resale.transaction_type.lower() == "swap" else TransactionType.DIRECT_SALE,
        customer_id=resale.customer_id,
        attending_staff_id=resale.attending_staff_id,
        balance_paid=resale.balance_paid,
        discount_amount=resale.discount_amount,
        final_price=resale.final_price,
        profit_status=ProfitStatus.PENDING,
        swap_id=resale.swap_id,
        sale_id=resale.sale_id,
        created_at=datetime.utcnow()
    )
    
    db.add(new_resale)
    db.flush()
    
    # Generate unique ID
    new_resale.generate_unique_id(db)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created pending resale for {customer.full_name}",
        module="pending_resales",
        target_id=new_resale.id,
        details=f"Sold: {resale.sold_phone_brand} {resale.sold_phone_model}, Type: {resale.transaction_type}"
    )
    
    db.commit()
    db.refresh(new_resale)
    
    return new_resale


@router.get("/", response_model=List[PendingResaleResponse])
def list_pending_resales(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,  # 'pending', 'sold', 'all'
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all pending resales with optional filtering"""
    if not can_view_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view resales"
        )
    
    query = db.query(PendingResale)
    
    # Filter by status if provided
    if status_filter == 'pending':
        # Show all swaps with incoming phones that haven't been sold yet
        query = query.filter(
            PendingResale.incoming_phone_id.isnot(None),
            PendingResale.incoming_phone_status != PhoneSaleStatus.SOLD
        )
    elif status_filter == 'sold':
        query = query.filter(PendingResale.incoming_phone_status == PhoneSaleStatus.SOLD)
    
    resales = query.order_by(PendingResale.transaction_date.desc()).offset(skip).limit(limit).all()
    return resales


@router.get("/swaps-only", response_model=List[PendingResaleResponse])
def list_swap_resales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all pending resales from swap transactions only"""
    if not can_view_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view resales"
        )
    
    resales = (
        db.query(PendingResale)
        .filter(PendingResale.transaction_type == TransactionType.SWAP)
        .filter(PendingResale.incoming_phone_id.isnot(None))
        .order_by(PendingResale.transaction_date.desc())
        .all()
    )
    return resales


@router.get("/statistics", response_model=dict)
def get_resale_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get statistics for pending resales"""
    if not can_view_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view resales"
        )
    
    total_pending = db.query(PendingResale).filter(
        PendingResale.incoming_phone_status == PhoneSaleStatus.AVAILABLE
    ).count()
    
    total_sold = db.query(PendingResale).filter(
        PendingResale.incoming_phone_status == PhoneSaleStatus.SOLD
    ).count()
    
    total_lost = db.query(PendingResale).filter(
        PendingResale.incoming_phone_status == PhoneSaleStatus.LOST
    ).count()
    
    # Calculate total profit/loss
    from sqlalchemy import func
    profit_data = db.query(
        func.sum(PendingResale.profit_amount)
    ).filter(
        PendingResale.profit_status == ProfitStatus.PROFIT_MADE
    ).scalar() or 0.0
    
    loss_data = db.query(
        func.sum(PendingResale.profit_amount)
    ).filter(
        PendingResale.profit_status == ProfitStatus.LOSS
    ).scalar() or 0.0
    
    return {
        "total_pending": total_pending,
        "total_sold": total_sold,
        "total_lost": total_lost,
        "total_profit": round(profit_data, 2),
        "total_loss": round(abs(loss_data), 2),
        "net_profit": round(profit_data + loss_data, 2)
    }


@router.get("/{resale_id}", response_model=PendingResaleResponse)
def get_pending_resale(
    resale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific pending resale by ID"""
    if not can_view_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view resales"
        )
    
    resale = db.query(PendingResale).filter(PendingResale.id == resale_id).first()
    if not resale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending resale not found"
        )
    
    return resale


@router.put("/{resale_id}/mark-sold", response_model=PendingResaleResponse)
def mark_incoming_phone_sold(
    resale_id: int,
    update: PendingResaleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark the incoming phone as sold and calculate profit/loss
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage resales"
        )
    
    resale = db.query(PendingResale).filter(PendingResale.id == resale_id).first()
    if not resale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending resale not found"
        )
    
    # Check if already sold
    if resale.incoming_phone_status == PhoneSaleStatus.SOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incoming phone has already been marked as sold"
        )
    
    # Update status
    if update.incoming_phone_status:
        if update.incoming_phone_status.lower() == "sold":
            resale.incoming_phone_status = PhoneSaleStatus.SOLD
        elif update.incoming_phone_status.lower() == "lost":
            resale.incoming_phone_status = PhoneSaleStatus.LOST
    
    # Update resale value and calculate profit
    if update.resale_value is not None:
        resale.resale_value = update.resale_value
        
        # Calculate profit/loss
        # Profit = (Resale value + Balance paid) - Original sold phone value
        total_recovered = resale.resale_value + resale.balance_paid
        resale.profit_amount = total_recovered - resale.sold_phone_value
        
        if resale.profit_amount > 0:
            resale.profit_status = ProfitStatus.PROFIT_MADE
        elif resale.profit_amount < 0:
            resale.profit_status = ProfitStatus.LOSS
        else:
            resale.profit_status = ProfitStatus.PENDING
    
    # Update the associated phone status if it exists
    if resale.incoming_phone_id:
        incoming_phone = db.query(Phone).filter(Phone.id == resale.incoming_phone_id).first()
        if incoming_phone:
            incoming_phone.status = PhoneStatus.SOLD
            incoming_phone.is_available = False
    
    resale.updated_at = datetime.utcnow()
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"marked incoming phone as sold",
        module="pending_resales",
        target_id=resale.id,
        details=f"Resale value: ₵{update.resale_value}, Profit: ₵{resale.profit_amount}"
    )
    
    db.commit()
    db.refresh(resale)
    
    return resale


@router.put("/{resale_id}", response_model=PendingResaleResponse)
def update_pending_resale(
    resale_id: int,
    update: PendingResaleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a pending resale record"""
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage resales"
        )
    
    resale = db.query(PendingResale).filter(PendingResale.id == resale_id).first()
    if not resale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending resale not found"
        )
    
    # Update fields if provided
    if update.incoming_phone_status is not None:
        if update.incoming_phone_status.lower() == "available":
            resale.incoming_phone_status = PhoneSaleStatus.AVAILABLE
        elif update.incoming_phone_status.lower() == "sold":
            resale.incoming_phone_status = PhoneSaleStatus.SOLD
        elif update.incoming_phone_status.lower() == "lost":
            resale.incoming_phone_status = PhoneSaleStatus.LOST
    
    if update.resale_value is not None:
        resale.resale_value = update.resale_value
    
    if update.profit_status is not None:
        if update.profit_status.lower() == "profit_made":
            resale.profit_status = ProfitStatus.PROFIT_MADE
        elif update.profit_status.lower() == "loss":
            resale.profit_status = ProfitStatus.LOSS
        elif update.profit_status.lower() == "pending":
            resale.profit_status = ProfitStatus.PENDING
    
    if update.profit_amount is not None:
        resale.profit_amount = update.profit_amount
    
    resale.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(resale)
    
    return resale


@router.delete("/{resale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pending_resale(
    resale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a pending resale record (Admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete resale records"
        )
    
    resale = db.query(PendingResale).filter(PendingResale.id == resale_id).first()
    if not resale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending resale not found"
        )
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"deleted pending resale",
        module="pending_resales",
        target_id=resale.id,
        details=f"Deleted resale record {resale.unique_id}"
    )
    
    db.delete(resale)
    db.commit()
    
    return None

