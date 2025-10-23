"""
Customer CRUD API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_manage_customers, can_create_customers, can_view_customers, can_delete_customers
from app.core.activity_logger import log_activity
from app.core.company_filter import get_company_user_ids
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new customer (Repairer YES, ShopKeeper YES, Manager NO)"""
    if not can_create_customers(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to create customers. Only Repairers and ShopKeepers can create customers. Your role: {current_user.role.value}"
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
    
    # Generate deletion code automatically
    new_customer.generate_deletion_code()
    
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
    limit: int = 50,  # Reduced from 100 to 50 for Railway optimization
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all customers with pagination
    
    Viewing Rules:
    - Repairer: All customers (own=full details with code, others=read-only no code)
    - ShopKeeper: All customers (own=full details with code, others=read-only no code)
    - Manager: All customers (all visible)
    
    Deletion code visibility:
    - Managers: NO codes visible (they need to request from creator)
    - Shopkeepers: ONLY see codes for customers THEY created
    - Repairers: ONLY see codes for customers THEY created
    """
    if not can_view_customers(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view customers"
        )
    
    # Filter by company (data isolation)
    company_user_ids = get_company_user_ids(db, current_user)
    
    if company_user_ids is None:
        # Super admin sees all
        customers = db.query(Customer).offset(skip).limit(limit).all()
    else:
        # Filter by company
        customers = db.query(Customer).filter(
            Customer.created_by_user_id.in_(company_user_ids)
        ).offset(skip).limit(limit).all()
    
    # Build customer list with proper permissions
    result = []
    for customer in customers:
        # Determine if current user created this customer
        is_creator = (
            hasattr(customer, 'created_by_user_id') and 
            customer.created_by_user_id == current_user.id
        )
        
        # Get creator info
        creator_username = None
        creator_role = None
        if hasattr(customer, 'created_by_user_id') and customer.created_by_user_id:
            creator = db.query(User).filter(User.id == customer.created_by_user_id).first()
            if creator:
                creator_username = creator.username
                creator_role = creator.role.value
        
        customer_dict = {
            "id": customer.id,
            "unique_id": customer.unique_id,
            "full_name": customer.full_name,
            "phone_number": customer.phone_number,
            "email": customer.email,
            "created_at": customer.created_at.isoformat() if customer.created_at else None,
            "created_by_user_id": customer.created_by_user_id if hasattr(customer, 'created_by_user_id') else None,
            "created_by_username": creator_username,
            "created_by_role": creator_role,
            "is_editable": is_creator,  # Only creator can edit
            "deletion_code": None,  # Default: hide
            "code_generated_at": None
        }
        
        # Deletion code visibility:
        # - Managers: NEVER see codes (they request from creator)
        # - Repairer/ShopKeeper: ONLY see codes for customers THEY created
        if not current_user.is_manager and is_creator:
            # Generate deletion code if it doesn't exist (for old customers created before this feature)
            if not customer.deletion_code:
                customer.generate_deletion_code()
                db.commit()
            
            customer_dict["deletion_code"] = customer.deletion_code
            customer_dict["code_generated_at"] = customer.code_generated_at.isoformat() if customer.code_generated_at else None
        
        result.append(customer_dict)
    
    return result


@router.get("/{customer_id}")
def get_customer(
    customer_id: int, 
    generate_code: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific customer by ID with proper deletion code visibility
    
    Deletion code visibility:
    - Managers: NEVER see codes (they need to request from creator)
    - Repairer/ShopKeeper: ONLY see codes for customers THEY created
    """
    if not can_view_customers(current_user):
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
    
    # Determine if current user created this customer
    is_creator = (
        hasattr(customer, 'created_by_user_id') and 
        customer.created_by_user_id == current_user.id
    )
    
    # Get creator info
    creator_username = None
    creator_role = None
    if hasattr(customer, 'created_by_user_id') and customer.created_by_user_id:
        creator = db.query(User).filter(User.id == customer.created_by_user_id).first()
        if creator:
            creator_username = creator.username
            creator_role = creator.role.value
    
    # Build response with proper permissions
    customer_dict = {
        "id": customer.id,
        "unique_id": customer.unique_id,
        "full_name": customer.full_name,
        "phone_number": customer.phone_number,
        "email": customer.email,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
        "created_by_user_id": customer.created_by_user_id if hasattr(customer, 'created_by_user_id') else None,
        "created_by_username": creator_username,
        "created_by_role": creator_role,
        "is_editable": is_creator,  # Only creator can edit
        "deletion_code": None,  # Default: hide
        "code_generated_at": None
    }
    
    # Deletion code visibility:
    # - Managers: NEVER see codes (they request from creator)
    # - Repairer/ShopKeeper: ONLY see codes for customers THEY created
    if not current_user.is_manager and is_creator:
        # Generate deletion code if it doesn't exist (for old customers created before this feature)
        if not customer.deletion_code:
            customer.generate_deletion_code()
            db.commit()
            db.refresh(customer)
        
        customer_dict["deletion_code"] = customer.deletion_code
        customer_dict["code_generated_at"] = customer.code_generated_at.isoformat() if customer.code_generated_at else None
    
    return customer_dict


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int, 
    customer_update: CustomerUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update customer information
    
    Editing Rules:
    - Repairer: Can edit ONLY customers they created
    - ShopKeeper: Can edit ONLY customers they created
    - Manager: CANNOT edit customers
    - Admin: Can edit all customers
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Check editing permission
    is_creator = (
        hasattr(customer, 'created_by_user_id') and 
        customer.created_by_user_id == current_user.id
    )
    
    # Admins can edit anyone's customers
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        pass  # Admins allowed
    # Managers cannot edit customers at all
    elif current_user.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers cannot edit customers. Only Repairers and ShopKeepers can edit customers they created."
        )
    # Repairer/ShopKeeper can only edit their own customers
    elif not is_creator:
        creator_info = ""
        if hasattr(customer, 'created_by_user_id') and customer.created_by_user_id:
            creator = db.query(User).filter(User.id == customer.created_by_user_id).first()
            if creator:
                creator_info = f" (created by {creator.username})"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You can only edit customers you created{creator_info}. This customer was created by someone else."
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
    deletion_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a customer with strict deletion rules
    
    Deletion Rules:
    - Repairer: CANNOT delete any customer
    - ShopKeeper: CANNOT delete any customer
    - Manager: Can delete with CREATOR'S deletion code
      * If customer created by Repairer, need Repairer's code
      * If customer created by ShopKeeper, need ShopKeeper's code
      * Repairer code CANNOT delete ShopKeeper customers (and vice versa)
    - Admin: Can delete without code
    """
    # Check if user has deletion permission
    if not can_delete_customers(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to delete customers. Only Managers can delete customers (with creator's code). Your role: {current_user.role.value}"
        )
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Admins can delete without code
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Manager must provide the CREATOR'S deletion code
        if not deletion_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deletion code is required. Please obtain the deletion code from the user who created this customer."
            )
        
        # Verify the deletion code matches the customer's deletion code
        if not customer.deletion_code or customer.deletion_code != deletion_code:
            # Get creator info for better error message
            creator_info = "the creator"
            if hasattr(customer, 'created_by_user_id') and customer.created_by_user_id:
                creator = db.query(User).filter(User.id == customer.created_by_user_id).first()
                if creator:
                    creator_info = f"{creator.username} ({creator.role.value})"
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid deletion code. You must obtain the correct deletion code from {creator_info}."
            )
        
        print(f"✅ Manager {current_user.username} deleting customer with valid creator's code")
    
    # Store details before deletion
    customer_details = f"{customer.full_name} - {customer.phone_number}"
    creator_info = ""
    if hasattr(customer, 'created_by_user_id') and customer.created_by_user_id:
        creator = db.query(User).filter(User.id == customer.created_by_user_id).first()
        if creator:
            creator_info = f" (created by {creator.username})"
    
    # ✅ CASCADE DELETE: Remove all related records when deleting customer
    try:
        from app.models.sale import Sale
        from app.models.swap import Swap
        from app.models.repair import Repair
        from app.models.invoice import Invoice
        from app.models.pending_resale import PendingResale
        from app.models.phone import Phone, PhoneOwnershipHistory
        from app.models.pos_sale import POSSale, POSSaleItem
        from app.models.product_sale import ProductSale
        
        # Count related records for logging
        sales_count = db.query(Sale).filter(Sale.customer_id == customer_id).count()
        swaps_count = db.query(Swap).filter(Swap.customer_id == customer_id).count()
        repairs_count = db.query(Repair).filter(Repair.customer_id == customer_id).count()
        invoices_count = db.query(Invoice).filter(Invoice.customer_id == customer_id).count()
        phones_owned_count = db.query(Phone).filter(Phone.current_owner_id == customer_id).count()
        ownership_history_count = db.query(PhoneOwnershipHistory).filter(PhoneOwnershipHistory.owner_id == customer_id).count()
        pos_sales_count = db.query(POSSale).filter(POSSale.customer_id == customer_id).count()
        product_sales_count = db.query(ProductSale).filter(ProductSale.customer_id == customer_id).count()
        
        # Log what will be deleted
        deleted_records = []
        if sales_count > 0:
            deleted_records.append(f"{sales_count} sale(s)")
        if swaps_count > 0:
            deleted_records.append(f"{swaps_count} swap(s)")
        if repairs_count > 0:
            deleted_records.append(f"{repairs_count} repair(s)")
        if invoices_count > 0:
            deleted_records.append(f"{invoices_count} invoice(s)")
        if phones_owned_count > 0:
            deleted_records.append(f"{phones_owned_count} phone(s) owned")
        if ownership_history_count > 0:
            deleted_records.append(f"{ownership_history_count} ownership history record(s)")
        if pos_sales_count > 0:
            deleted_records.append(f"{pos_sales_count} POS sale(s)")
        if product_sales_count > 0:
            deleted_records.append(f"{product_sales_count} product sale(s)")
        
        # Delete related records in proper order (respecting foreign key constraints)
        # 1. Clear phone ownership references
        db.query(Phone).filter(Phone.current_owner_id == customer_id).update({"current_owner_id": None})
        
        # 2. Delete phone ownership history
        db.query(PhoneOwnershipHistory).filter(PhoneOwnershipHistory.owner_id == customer_id).delete()
        
        # 3. Delete POS sale items first (child of POSSale)
        pos_sales = db.query(POSSale).filter(POSSale.customer_id == customer_id).all()
        pos_sale_ids = [ps.id for ps in pos_sales]
        if pos_sale_ids:
            db.query(POSSaleItem).filter(POSSaleItem.pos_sale_id.in_(pos_sale_ids)).delete()
        
        # 4. Delete POS sales
        db.query(POSSale).filter(POSSale.customer_id == customer_id).delete()
        
        # 5. Delete product sales
        db.query(ProductSale).filter(ProductSale.customer_id == customer_id).delete()
        
        # 6. Delete invoices
        db.query(Invoice).filter(Invoice.customer_id == customer_id).delete()
        
        # 7. Delete pending resales (if swap references exist)
        swaps = db.query(Swap).filter(Swap.customer_id == customer_id).all()
        swap_ids = [swap.id for swap in swaps]
        if swap_ids:
            db.query(PendingResale).filter(PendingResale.swap_id.in_(swap_ids)).delete()
        
        # 8. Delete repairs
        db.query(Repair).filter(Repair.customer_id == customer_id).delete()
        
        # 9. Delete sales
        db.query(Sale).filter(Sale.customer_id == customer_id).delete()
        
        # 10. Delete swaps
        db.query(Swap).filter(Swap.customer_id == customer_id).delete()
        
        # 11. Finally delete the customer
        db.delete(customer)
        
        db.commit()
        
        print(f"✅ Customer deleted with cascade: {customer_details}")
        if deleted_records:
            print(f"   Deleted related records: {', '.join(deleted_records)}")
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete customer and related records: {str(e)}"
        )
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"deleted customer{creator_info}",
        module="customers",
        target_id=customer_id,
        details=customer_details
    )
    
    print(f"✅ Customer deleted: {customer_details}")
    return None

