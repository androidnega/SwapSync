"""
Admin Routes - Special administrative functions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.pos_sale import POSSale, POSSaleItem
from app.models.product_sale import ProductSale
from app.models.product import StockMovement

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/clear-pos-sales")
def clear_all_pos_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clear ALL POS sales data from the system
    ⚠️ WARNING: This permanently deletes all sales history!
    Only SUPER_ADMIN can perform this action
    """
    # Only super admins can clear all data
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN can clear all POS sales data"
        )
    
    try:
        # Count before deletion
        pos_sales_count = db.query(POSSale).count()
        pos_items_count = db.query(POSSaleItem).count()
        product_sales_count = db.query(ProductSale).count()
        stock_movements_count = db.query(StockMovement).filter(
            StockMovement.reference_type == "pos_sale"
        ).count()
        
        # Delete in correct order (due to foreign keys)
        # 1. Delete POS sale items first
        db.query(POSSaleItem).delete()
        
        # 2. Delete POS sales
        db.query(POSSale).delete()
        
        # 3. Delete product sales
        db.query(ProductSale).delete()
        
        # 4. Delete stock movements related to POS sales
        db.query(StockMovement).filter(
            StockMovement.reference_type == "pos_sale"
        ).delete()
        
        db.commit()
        
        return {
            "success": True,
            "message": "All POS sales data cleared successfully",
            "deleted": {
                "pos_sales": pos_sales_count,
                "pos_sale_items": pos_items_count,
                "product_sales": product_sales_count,
                "stock_movements": stock_movements_count
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear POS sales: {str(e)}"
        )

