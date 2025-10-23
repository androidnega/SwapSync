"""
Admin Routes - Special administrative functions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.pos_sale import POSSale, POSSaleItem
from app.models.product_sale import ProductSale
from app.models.product import StockMovement
from app.core.permissions import is_manager_or_above
from app.core.activity_logger import log_activity

router = APIRouter(prefix="/admin", tags=["Admin"])


class PasswordVerificationRequest(BaseModel):
    password: str


@router.post("/verify-manager-password")
def verify_manager_password(
    request: PasswordVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify manager password before allowing reset operations"""
    if not is_manager_or_above(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can verify passwords for reset operations"
        )
    
    try:
        # Verify the provided password against the current user's password
        is_valid = current_user.verify_password(request.password)
        
        if is_valid:
            # Log the password verification attempt
            log_activity(
                db=db,
                user=current_user,
                action="verified manager password for reset operation",
                module="admin_reset",
                target_id=None,
                details="Password verification successful"
            )
            
            return {"verified": True, "message": "Password verified successfully"}
        else:
            # Log failed password verification attempt
            log_activity(
                db=db,
                user=current_user,
                action="failed manager password verification for reset operation",
                module="admin_reset",
                target_id=None,
                details="Invalid password provided"
            )
            
            return {"verified": False, "message": "Invalid password"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify password: {str(e)}"
        )


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

