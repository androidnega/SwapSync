"""
Repair Items API Routes
Manages inventory of repair items (screens, batteries, etc.)
✅ UPDATED: Now uses unified Product model instead of RepairItem
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.company_filter import get_company_user_ids
from app.models.user import User
from app.models.product import Product

router = APIRouter(prefix="/repair-items", tags=["Repair Items"])

@router.get("/")
def get_all_repair_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all repair items in inventory (filtered by company) - Uses unified Product model"""
    # Filter by company (data isolation)
    company_user_ids = get_company_user_ids(db, current_user)
    
    # Get products that are NOT phones (repair items only)
    query = db.query(Product).filter(
        Product.is_active == True,
        Product.is_phone == False  # Only non-phone products (repair items)
    )
    
    if company_user_ids is not None:
        query = query.filter(Product.created_by_user_id.in_(company_user_ids))
    
    items = query.order_by(Product.name).all()
    
    # Convert to repair item format for backward compatibility
    repair_items = []
    for product in items:
        repair_items.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "category": product.brand,  # Use brand as category for repair items
            "cost_price": product.cost_price,
            "selling_price": product.selling_price,
            "stock_quantity": product.quantity,
            "min_stock_level": product.min_stock_level,
            "created_by_user_id": product.created_by_user_id,
            "created_at": product.created_at,
            "sku": product.sku,
            "barcode": product.barcode
        })
    
    return repair_items

@router.get("/low-stock")
def get_low_stock_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get repair items with stock below minimum level (filtered by company) - Uses unified Product model"""
    # Filter by company (data isolation)
    company_user_ids = get_company_user_ids(db, current_user)
    
    # Get products that are NOT phones and have low stock
    query = db.query(Product).filter(
        Product.is_active == True,
        Product.is_phone == False,  # Only non-phone products (repair items)
        Product.quantity <= Product.min_stock_level
    )
    
    if company_user_ids is not None:
        query = query.filter(Product.created_by_user_id.in_(company_user_ids))
    
    items = query.all()
    
    # Convert to repair item format for backward compatibility
    repair_items = []
    for product in items:
        repair_items.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "category": product.brand,
            "cost_price": product.cost_price,
            "selling_price": product.selling_price,
            "stock_quantity": product.quantity,
            "min_stock_level": product.min_stock_level,
            "created_by_user_id": product.created_by_user_id,
            "created_at": product.created_at,
            "sku": product.sku,
            "barcode": product.barcode
        })
    
    return repair_items

@router.get("/{item_id}", response_model=RepairItemResponse)
def get_repair_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific repair item by ID"""
    item = db.query(RepairItem).filter(RepairItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Repair item not found")
    return item

@router.post("/", response_model=RepairItemResponse)
def create_repair_item(
    item_data: RepairItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new repair item (Manager/Repairer)"""
    from app.models.user import UserRole
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.REPAIRER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and repairers can add repair items"
        )
    
    # Create new item with company tracking
    item_dict = item_data.dict()
    item_dict['created_by_user_id'] = current_user.id
    new_item = RepairItem(**item_dict)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return new_item

@router.put("/{item_id}", response_model=RepairItemResponse)
def update_repair_item(
    item_id: int,
    item_data: RepairItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a repair item (Manager/Repairer)"""
    from app.models.user import UserRole
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.REPAIRER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and repairers can update repair items"
        )
    
    item = db.query(RepairItem).filter(RepairItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Repair item not found")
    
    # Update fields
    update_data = item_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_repair_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a repair item (Manager/Repairer)"""
    from app.models.user import UserRole
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.REPAIRER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and repairers can delete repair items"
        )
    
    item = db.query(RepairItem).filter(RepairItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Repair item not found")
    
    # Check if item is used in any repairs
    if item.usage_history:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete item that has been used in repairs. Consider setting stock to 0 instead."
        )
    
    db.delete(item)
    db.commit()
    return {"message": "Repair item deleted successfully"}

@router.patch("/{item_id}/adjust-stock")
def adjust_stock(
    item_id: int,
    adjustment: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adjust stock quantity (positive = add, negative = remove)"""
    if current_user.role not in ["manager", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can adjust stock"
        )
    
    item = db.query(RepairItem).filter(RepairItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Repair item not found")
    
    new_stock = item.stock_quantity + adjustment
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock for this adjustment"
        )
    
    item.stock_quantity = new_stock
    db.commit()
    db.refresh(item)
    
    return {"message": f"Stock adjusted successfully. New quantity: {new_stock}", "item": item}

