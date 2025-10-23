"""
Phone Inventory CRUD API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_create_phones, can_view_phones, can_manage_phones
from app.core.activity_logger import log_activity
from app.core.company_filter import get_company_user_ids
from app.models.user import User, UserRole
from app.models.phone import Phone
from app.schemas.phone import PhoneCreate, PhoneUpdate, PhoneResponse

router = APIRouter(prefix="/phones", tags=["Phones"])


@router.post("/", response_model=PhoneResponse, status_code=status.HTTP_201_CREATED)
def add_phone(
    phone: PhoneCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new phone to inventory (MANAGER ONLY)"""
    if not can_create_phones(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers can add phones to inventory. Shopkeepers can select existing phones."
        )
    
    # Create phone with audit trail
    phone_data = phone.model_dump()
    phone_data['created_by_user_id'] = current_user.id
    
    new_phone = Phone(**phone_data)
    db.add(new_phone)
    db.flush()
    
    # Generate unique ID
    new_phone.generate_unique_id(db)
    db.commit()
    db.refresh(new_phone)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"added phone to inventory",
        module="phones",
        target_id=new_phone.id,
        details=f"{new_phone.brand} {new_phone.model} - IMEI: {new_phone.imei}"
    )
    
    return new_phone


@router.get("/", response_model=List[PhoneResponse])
def list_phones(
    available_only: bool = False,
    category_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all phones with filters (Manager + Shopkeeper)
    Data isolation: Each company only sees their own phones
    """
    if not can_view_phones(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view phone inventory"
        )
    
    # Build query with company filtering
    query = db.query(Phone)
    
    # Filter by company (data isolation)
    company_user_ids = get_company_user_ids(db, current_user)
    if company_user_ids is not None:
        query = query.filter(Phone.created_by_user_id.in_(company_user_ids))
    
    if available_only:
        query = query.filter(Phone.is_available == True)
    
    if category_id:
        query = query.filter(Phone.category_id == category_id)
    
    phones = query.offset(skip).limit(limit).all()
    return phones


@router.get("/{phone_id}", response_model=PhoneResponse)
def get_phone(
    phone_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific phone by ID (Manager + Shopkeeper)"""
    if not can_view_phones(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view phone inventory"
        )
    phone = db.query(Phone).filter(Phone.id == phone_id).first()
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    return phone


@router.get("/search/available", response_model=List[PhoneResponse])
def search_available_phones(
    q: str = "",
    category_id: int = None,
    min_price: float = None,
    max_price: float = None,
    condition: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search available phones with filters (for Shopkeeper phone selection)
    Shopkeepers use this to SELECT phones for swaps/sales
    Data isolation: Only shows company's own phones
    """
    if not can_view_phones(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view phones"
        )
    
    query = db.query(Phone).filter(Phone.is_available == True)
    
    # Filter by company (data isolation)
    company_user_ids = get_company_user_ids(db, current_user)
    if company_user_ids is not None:
        query = query.filter(Phone.created_by_user_id.in_(company_user_ids))
    
    # Text search (brand, model, IMEI)
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            (Phone.brand.like(search_term)) |
            (Phone.model.like(search_term)) |
            (Phone.imei.like(search_term))
        )
    
    # Filter by category
    if category_id:
        query = query.filter(Phone.category_id == category_id)
    
    # Filter by price range
    if min_price is not None:
        query = query.filter(Phone.value >= min_price)
    if max_price is not None:
        query = query.filter(Phone.value <= max_price)
    
    # Filter by condition
    if condition:
        query = query.filter(Phone.condition == condition)
    
    phones = query.limit(50).all()
    return phones


@router.put("/{phone_id}", response_model=PhoneResponse)
def update_phone(
    phone_id: int, 
    phone_update: PhoneUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update phone information (MANAGER ONLY)"""
    if not can_create_phones(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers can edit phone inventory"
        )
    phone = db.query(Phone).filter(Phone.id == phone_id).first()
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    # Update only provided fields
    for field, value in phone_update.model_dump(exclude_unset=True).items():
        setattr(phone, field, value)
    
    db.commit()
    db.refresh(phone)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"updated phone",
        module="phones",
        target_id=phone.id,
        details=f"{phone.brand} {phone.model} - IMEI: {phone.imei}"
    )
    
    return phone


@router.patch("/{phone_id}/availability", response_model=PhoneResponse)
def toggle_availability(
    phone_id: int, 
    is_available: bool, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle phone availability status (Shop Keeper, CEO, Admin only)"""
    if not can_manage_phones(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage phone inventory"
        )
    phone = db.query(Phone).filter(Phone.id == phone_id).first()
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    phone.is_available = is_available
    db.commit()
    db.refresh(phone)
    return phone


@router.delete("/{phone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_phone(
    phone_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a phone from inventory (MANAGER ONLY)"""
    if not can_create_phones(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers can delete phones"
        )
    phone = db.query(Phone).filter(Phone.id == phone_id).first()
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    # ✅ CASCADE DELETE: Remove all related records when deleting phone
    from app.models.sale import Sale
    from app.models.swap import Swap
    from app.models.pending_resale import PendingResale
    from app.models.repair import Repair
    
    # Count related records for logging
    sales_count = db.query(Sale).filter(Sale.phone_id == phone_id).count()
    swaps_count = db.query(Swap).filter(Swap.new_phone_id == phone_id).count()
    pending_resales_count = db.query(PendingResale).filter(
        (PendingResale.sold_phone_id == phone_id) | 
        (PendingResale.incoming_phone_id == phone_id)
    ).count()
    repairs_count = db.query(Repair).filter(Repair.phone_id == phone_id).count()
    phones_from_swaps = db.query(Phone).filter(Phone.swapped_from_id == phone_id).count()
    
    # Log what will be deleted
    deleted_records = []
    if sales_count > 0:
        deleted_records.append(f"{sales_count} sale(s)")
    if swaps_count > 0:
        deleted_records.append(f"{swaps_count} swap(s)")
    if pending_resales_count > 0:
        deleted_records.append(f"{pending_resales_count} pending resale(s)")
    if repairs_count > 0:
        deleted_records.append(f"{repairs_count} repair(s)")
    if phones_from_swaps > 0:
        deleted_records.append(f"{phones_from_swaps} phone(s) created from swaps")
    
    # Delete related records in proper order (respecting foreign key constraints)
    try:
        # 1. Clear swapped_from_id references in other phones FIRST
        db.query(Phone).filter(Phone.swapped_from_id == phone_id).update({"swapped_from_id": None})
        
        # 2. Delete sales
        db.query(Sale).filter(Sale.phone_id == phone_id).delete()
        
        # 3. Delete pending resales
        db.query(PendingResale).filter(
            (PendingResale.sold_phone_id == phone_id) | 
            (PendingResale.incoming_phone_id == phone_id)
        ).delete()
        
        # 4. Delete repairs
        db.query(Repair).filter(Repair.phone_id == phone_id).delete()
        
        # 5. Delete swaps (now safe - no phones reference them)
        db.query(Swap).filter(Swap.new_phone_id == phone_id).delete()
        
        # 6. Finally delete the phone
        db.query(Phone).filter(Phone.id == phone_id).delete()
        
        db.commit()
        
        # Log the cascade deletion
        log_activity(
            db=db,
            user=current_user,
            action=f"deleted phone with cascade",
            module="phones",
            target_id=phone_id,
            details=f"Deleted {phone.brand} {phone.model} and related records: {', '.join(deleted_records) if deleted_records else 'no related records'}"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete phone and related records: {str(e)}"
        )


class BulkDeleteRequest(BaseModel):
    phone_ids: List[int]


@router.post("/bulk-delete")
def bulk_delete_phones(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk delete multiple phones
    - Only Managers and above can bulk delete
    - Deletes phones from inventory
    """
    # Allow managers, admins, and super admins
    allowed_roles = [UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your role ({current_user.role.value}) cannot bulk delete phones."
        )
    
    if not request.phone_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No phone IDs provided"
        )
    
    if len(request.phone_ids) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete more than 100 phones at once"
        )
    
    try:
        from app.models.sale import Sale
        from app.models.swap import Swap
        from app.models.pending_resale import PendingResale
        from app.models.repair import Repair
        
        deleted_phones = []
        skipped_phones = []
        
        for phone_id in request.phone_ids:
            # Get the phone
            phone = db.query(Phone).filter(Phone.id == phone_id).first()
            if not phone:
                skipped_phones.append({"id": phone_id, "reason": "Phone not found"})
                continue
            
            # Check for dependent records
            has_sales = db.query(Sale).filter(Sale.phone_id == phone_id).count() > 0
            has_swaps = db.query(Swap).filter(Swap.new_phone_id == phone_id).count() > 0
            has_resales = db.query(PendingResale).filter(
                (PendingResale.sold_phone_id == phone_id) | 
                (PendingResale.incoming_phone_id == phone_id)
            ).count() > 0
            has_repairs = db.query(Repair).filter(Repair.phone_id == phone_id).count() > 0
            
            if has_sales or has_swaps or has_resales or has_repairs:
                skipped_phones.append({
                    "id": phone_id,
                    "brand": phone.brand,
                    "model": phone.model,
                    "reason": "Has related records (sales, swaps, repairs, or resales)"
                })
                continue
                
            phone_details = f"{phone.brand} {phone.model} - IMEI: {phone.imei}"
            
            # Delete the phone
            db.delete(phone)
            
            deleted_phones.append({
                "id": phone_id,
                "brand": phone.brand,
                "model": phone.model,
                "imei": phone.imei
            })
        
        db.commit()
        
        # Log activity
        phone_names = [f"{p['brand']} {p['model']}" for p in deleted_phones]
        log_activity(
            db=db,
            user=current_user,
            action=f"bulk deleted {len(deleted_phones)} phones",
            module="phones",
            target_id=None,
            details=f"Deleted phones: {phone_names}"
        )
        
        return {
            "message": f"Successfully deleted {len(deleted_phones)} phones",
            "deleted_phones": deleted_phones,
            "skipped_phones": skipped_phones,
            "summary": {
                "total_requested": len(request.phone_ids),
                "deleted": len(deleted_phones),
                "skipped": len(skipped_phones)
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk delete phones: {str(e)}"
        )
