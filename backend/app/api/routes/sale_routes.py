"""
Sale Transaction API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_manage_swaps  # Sales use same permission as swaps
from app.core.invoice_generator import create_sale_invoice
from app.core.activity_logger import log_activity
from app.core.sms import send_sale_completion_sms
from app.models.user import User
from app.models.sale import Sale
from app.models.customer import Customer
from app.models.phone import Phone, PhoneStatus, PhoneOwnershipHistory
from app.schemas.sale import SaleCreate, SaleResponse

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale: SaleCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a new sale transaction (Shopkeeper ONLY, Admin with authorization)"""
    from app.core.permissions import require_shopkeeper
    
    # Enforce shopkeeper-only permission (Manager CANNOT record sales)
    require_shopkeeper(current_user)
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Verify phone exists and is available
    phone = db.query(Phone).filter(Phone.id == sale.phone_id).first()
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    if not phone.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone is not available for sale"
        )
    
    # Calculate final amount after discount
    final_amount = sale.original_price - sale.discount_amount
    
    if final_amount < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount cannot be greater than original price"
        )
    
    # Create sale
    new_sale = Sale(
        customer_id=sale.customer_id,
        phone_id=sale.phone_id,
        original_price=sale.original_price,
        discount_amount=sale.discount_amount,
        amount_paid=final_amount,
        customer_phone=sale.customer_phone,
        customer_email=sale.customer_email,
        created_by_user_id=current_user.id,  # Track which shop keeper made the sale
        created_at=datetime.utcnow()
    )
    db.add(new_sale)
    db.flush()  # Get the sale ID before generating invoice
    
    # Mark phone as unavailable and update status
    phone.is_available = False
    phone.status = PhoneStatus.SOLD
    
    # Update phone ownership
    phone.current_owner_id = customer.id
    phone.current_owner_type = "customer"
    
    # Record ownership history
    ownership_change = PhoneOwnershipHistory(
        phone_id=phone.id,
        owner_id=customer.id,
        owner_type="customer",
        change_reason="sale",
        transaction_id=new_sale.id,
        change_date=datetime.utcnow()
    )
    db.add(ownership_change)
    
    # Generate invoice
    invoice = create_sale_invoice(db, new_sale, customer, phone, current_user)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created sale for {customer.full_name}",
        module="sales",
        target_id=new_sale.id,
        details=f"Phone: {phone.brand} {phone.model}, Price: ₵{sale.original_price}, Discount: ₵{sale.discount_amount}, Final: ₵{final_amount}"
    )
    
    db.commit()
    db.refresh(new_sale)
    
    # Send SMS receipt to customer
    if sale.customer_phone:
        try:
            from app.core.sms import get_sms_service
            sms_service = get_sms_service()
            
            # Get manager for SMS branding
            from app.core.sms import get_sms_sender_name
            manager_id = None
            company_name = "SwapSync"
            
            if current_user.parent_user_id:
                # Staff member - get their manager
                manager = db.query(User).filter(User.id == current_user.parent_user_id).first()
                if manager:
                    manager_id = manager.id
                    company_name = manager.company_name or "SwapSync"
            elif current_user.role.value in ['manager', 'ceo']:
                # Manager directly
                manager_id = current_user.id
                company_name = current_user.company_name or "SwapSync"
            
            # Determine SMS sender using helper function
            sms_sender = get_sms_sender_name(manager_id, company_name)
            
            # Create receipt message
            phone_model = f"{phone.brand} {phone.model}"
            receipt_message = f"""
{sms_sender} - Purchase Receipt

Phone: {phone_model}
Condition: {phone.condition}
Original Price: ₵{sale.original_price:.2f}
Discount: ₵{sale.discount_amount:.2f}
Total Paid: ₵{final_amount:.2f}

Thank you for your purchase!
            """.strip()
            
            # Send SMS
            result = sms_service.send_sms(
                phone_number=sale.customer_phone,
                message=receipt_message,
                company_name=sms_sender
            )
            
            success = result.get('success', False)
            
            if success:
                new_sale.sms_sent = 1
                db.commit()
                
        except Exception as e:
            print(f"Failed to send SMS receipt: {e}")
            # Don't fail the sale if SMS fails
    
    return new_sale


@router.get("/", response_model=List[SaleResponse])
def list_sales(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sales with pagination (Shop Keeper, CEO, Admin only)"""
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view sales"
        )
    sales = db.query(Sale).order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    return sales


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific sale by ID (Shop Keeper, CEO, Admin only)"""
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view sales"
        )
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )
    return sale


@router.get("/customer/{customer_id}", response_model=List[SaleResponse])
def get_customer_sales(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sales for a specific customer (Shop Keeper, CEO, Admin only)"""
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view sales"
        )
    sales = db.query(Sale).filter(Sale.customer_id == customer_id).order_by(Sale.created_at.desc()).all()
    return sales

