"""
Repair Items API Routes
Manages inventory of repair items (screens, batteries, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.repair_item import RepairItem
from app.schemas.repair_item import RepairItemCreate, RepairItemUpdate, RepairItemResponse

router = APIRouter(prefix="/repair-items", tags=["Repair Items"])

@router.get("/", response_model=List[RepairItemResponse])
def get_all_repair_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all repair items in inventory"""
    items = db.query(RepairItem).order_by(RepairItem.name).all()
    return items

@router.get("/low-stock", response_model=List[RepairItemResponse])
def get_low_stock_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get repair items with stock below minimum level"""
    items = db.query(RepairItem).filter(
        RepairItem.stock_quantity <= RepairItem.min_stock_level
    ).all()
    return items

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
    
    # Create new item
    new_item = RepairItem(**item_data.dict())
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

