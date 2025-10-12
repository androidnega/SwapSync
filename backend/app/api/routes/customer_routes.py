"""
Customer CRUD API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_manage_customers
from app.core.activity_logger import log_activity
from app.models.user import User
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new customer (Shop Keeper, CEO, Admin only)"""
    if not can_manage_customers(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage customers"
        )
    # Check if customer with this phone number already exists
    existing = db.query(Customer).filter(Customer.phone_number == customer.phone_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this phone number already exists"
        )
    
    new_customer = Customer(**customer.model_dump())
    new_customer.created_by_user_id = current_user.id  # Track who created this customer
    db.add(new_customer)
    db.flush()
    
    # Generate unique ID
    new_customer.generate_unique_id(db)
    db.commit()
    db.refresh(new_customer)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created customer",
        module="customers",
        target_id=new_customer.id,
        details=f"{new_customer.full_name} - {new_customer.phone_number}"
    )
    
    return new_customer


@router.get("/")
def list_customers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all customers with pagination
    Deletion code privacy:
    - Managers: See ALL deletion codes
    - Shopkeepers: See ONLY their own customer deletion codes
    - Repairers: See ONLY their own customer deletion codes
    """
    if not can_manage_customers(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view customers"
        )
    
    customers = db.query(Customer).offset(skip).limit(limit).all()
    
    # Filter deletion codes based on who created the customer
    result = []
    for customer in customers:
        customer_dict = {
            "id": customer.id,
            "unique_id": customer.unique_id,
            "full_name": customer.full_name,
            "phone_number": customer.phone_number,
            "email": customer.email,
            "created_at": customer.created_at.isoformat() if customer.created_at else None,
            "deletion_code": None,  # Default: hide
            "code_generated_at": None
        }
        
        # Show deletion code based on role and creator
        if current_user.is_manager:
            # Managers see ALL deletion codes
            customer_dict["deletion_code"] = customer.deletion_code
            customer_dict["code_generated_at"] = customer.code_generated_at.isoformat() if customer.code_generated_at else None
        elif hasattr(customer, 'created_by_user_id') and customer.created_by_user_id == current_user.id:
            # Shopkeepers and Repairers ONLY see deletion codes for customers THEY created
            customer_dict["deletion_code"] = customer.deletion_code
            customer_dict["code_generated_at"] = customer.code_generated_at.isoformat() if customer.code_generated_at else None
        # else: deletion_code remains None (hidden)
        
        result.append(customer_dict)
    
    return result


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int, 
    generate_code: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific customer by ID (Shop Keeper, CEO, Admin only)
    If generate_code=True, generates a new deletion code (security feature)
    """
    if not can_manage_customers(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view customers"
        )
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Generate new deletion code if requested (improves security)
    if generate_code:
        customer.generate_deletion_code()
        db.commit()
        db.refresh(customer)
    
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int, 
    customer_update: CustomerUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update customer information (Shop Keeper, CEO, Admin only)"""
    if not can_manage_customers(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage customers"
        )
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Check if phone number is being updated and if it's already taken
    if customer_update.phone_number and customer_update.phone_number != customer.phone_number:
        existing = db.query(Customer).filter(Customer.phone_number == customer_update.phone_number).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already in use by another customer"
            )
    
    # Update only provided fields
    for field, value in customer_update.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"updated customer",
        module="customers",
        target_id=customer.id,
        details=f"{customer.full_name} - {customer.phone_number}"
    )
    
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a customer (Shop Keeper, CEO, Admin only)"""
    if not can_manage_customers(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage customers"
        )
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Store details before deletion
    customer_details = f"{customer.full_name} - {customer.phone_number}"
    
    db.delete(customer)
    db.commit()
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"deleted customer",
        module="customers",
        target_id=customer_id,
        details=customer_details
    )
    
    return None

