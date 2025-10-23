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

@router.get("/{item_id}")
def get_repair_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific repair item by ID - Uses unified Product model"""
    # Get product that is NOT a phone (repair item)
    product = db.query(Product).filter(
        Product.id == item_id,
        Product.is_active == True,
        Product.is_phone == False
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Repair item not found")
    
    # Convert to repair item format for backward compatibility
    return {
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
    }

@router.post("/")
def create_repair_item(
    item_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new repair item (Manager/Repairer) - Redirects to Product API"""
    from app.models.user import UserRole
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.REPAIRER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and repairers can add repair items"
        )
    
    # Redirect to Product API for creating repair items
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Repair items are now managed through the Product API. Use POST /api/products/ with is_phone=false"
    )

@router.put("/{item_id}")
def update_repair_item(
    item_id: int,
    item_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a repair item (Manager/Repairer) - Redirects to Product API"""
    from app.models.user import UserRole
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.REPAIRER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and repairers can update repair items"
        )
    
    # Redirect to Product API for updating repair items
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Repair items are now managed through the Product API. Use PUT /api/products/{id}"
    )

@router.delete("/{item_id}")
def delete_repair_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a repair item (Manager/Repairer) - Redirects to Product API"""
    from app.models.user import UserRole
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.REPAIRER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and repairers can delete repair items"
        )
    
    # Redirect to Product API for deleting repair items
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Repair items are now managed through the Product API. Use DELETE /api/products/{id}"
    )

@router.patch("/{item_id}/adjust-stock")
def adjust_stock(
    item_id: int,
    adjustment: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adjust stock quantity (positive = add, negative = remove) - Redirects to Product API"""
    if current_user.role not in ["manager", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can adjust stock"
        )
    
    # Redirect to Product API for stock adjustments
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Repair items are now managed through the Product API. Use PATCH /api/products/{id}/adjust-stock"
    )

