"""
Admin Reset Routes - System Data Reset (Manager/Super Admin Only)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.core.permissions import is_manager_or_above
from app.core.activity_logger import log_activity

router = APIRouter(prefix="/admin/reset", tags=["Admin Reset"])


@router.post("/customers")
def reset_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset all customer data (Manager/Super Admin only)"""
    if not is_manager_or_above(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can reset customer data"
        )
    
    try:
        # Delete customers and related data
        db.execute(text("DELETE FROM customers"))
        db.execute(text("DELETE FROM product_sales WHERE customer_id IS NOT NULL"))
        db.execute(text("DELETE FROM pos_sales WHERE customer_id IS NOT NULL"))
        db.execute(text("DELETE FROM sales WHERE customer_id IS NOT NULL"))
        db.execute(text("DELETE FROM swaps WHERE customer_id IS NOT NULL"))
        db.execute(text("DELETE FROM repairs WHERE customer_id IS NOT NULL"))
        db.execute(text("DELETE FROM pending_resales WHERE customer_id IS NOT NULL"))
        
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action="reset all customer data",
            module="admin_reset",
            target_id=None,
            details="Deleted all customers and related transaction data"
        )
        
        return {"message": "Customer data reset successfully", "reset_by": current_user.username}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset customer data: {str(e)}"
        )


@router.post("/repairs")
def reset_repairs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset all repair data (Manager/Super Admin only)"""
    if not is_manager_or_above(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can reset repair data"
        )
    
    try:
        # Delete repair-related data
        db.execute(text("DELETE FROM repair_sales"))
        db.execute(text("DELETE FROM repair_items_usage"))
        db.execute(text("DELETE FROM repairs"))
        db.execute(text("DELETE FROM repair_items"))
        
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action="reset all repair data",
            module="admin_reset",
            target_id=None,
            details="Deleted all repairs, repair items, and repair sales data"
        )
        
        return {"message": "Repair data reset successfully", "reset_by": current_user.username}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset repair data: {str(e)}"
        )


@router.post("/products")
def reset_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset all product inventory data (Manager/Super Admin only)"""
    if not is_manager_or_above(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can reset product data"
        )
    
    try:
        # Delete product-related data
        db.execute(text("DELETE FROM stock_movements"))
        db.execute(text("DELETE FROM repair_sales"))
        db.execute(text("DELETE FROM product_sales"))
        db.execute(text("DELETE FROM pos_sale_items"))
        db.execute(text("DELETE FROM products"))
        
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action="reset all product data",
            module="admin_reset",
            target_id=None,
            details="Deleted all products, stock movements, and related sales data"
        )
        
        return {"message": "Product data reset successfully", "reset_by": current_user.username}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset product data: {str(e)}"
        )


@router.post("/sales")
def reset_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset all sales and transaction data (Manager/Super Admin only)"""
    if not is_manager_or_above(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can reset sales data"
        )
    
    try:
        # Delete sales-related data
        db.execute(text("DELETE FROM pos_sale_items"))
        db.execute(text("DELETE FROM pos_sales"))
        db.execute(text("DELETE FROM product_sales"))
        db.execute(text("DELETE FROM sales"))
        db.execute(text("DELETE FROM swaps"))
        db.execute(text("DELETE FROM pending_resales"))
        db.execute(text("DELETE FROM repair_sales"))
        
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action="reset all sales data",
            module="admin_reset",
            target_id=None,
            details="Deleted all sales, swaps, POS sales, and transaction data"
        )
        
        return {"message": "Sales data reset successfully", "reset_by": current_user.username}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset sales data: {str(e)}"
        )


@router.post("/users")
def reset_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset all user accounts except super admin (Manager/Super Admin only)"""
    if not is_manager_or_above(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can reset user data"
        )
    
    try:
        # Delete all users except super admin
        db.execute(text("DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'super_admin')"))
        db.execute(text("DELETE FROM activity_logs WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'super_admin')"))
        db.execute(text("DELETE FROM users WHERE role != 'super_admin'"))
        
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action="reset all user accounts",
            module="admin_reset",
            target_id=None,
            details="Deleted all user accounts except super admin"
        )
        
        return {"message": "User data reset successfully", "reset_by": current_user.username}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset user data: {str(e)}"
        )


@router.post("/all")
def reset_all_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset all system data except super admin (Super Admin only)"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admin can perform complete system reset"
        )
    
    try:
        # Delete all data except super admin user
        db.execute(text("DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'super_admin')"))
        db.execute(text("DELETE FROM activity_logs WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'super_admin')"))
        db.execute(text("DELETE FROM sms_logs"))
        db.execute(text("DELETE FROM audit_codes"))
        db.execute(text("DELETE FROM otp_sessions"))
        db.execute(text("DELETE FROM pending_resales"))
        db.execute(text("DELETE FROM pos_sale_items"))
        db.execute(text("DELETE FROM pos_sales"))
        db.execute(text("DELETE FROM product_sales"))
        db.execute(text("DELETE FROM sales"))
        db.execute(text("DELETE FROM swaps"))
        db.execute(text("DELETE FROM repairs"))
        db.execute(text("DELETE FROM repair_sales"))
        db.execute(text("DELETE FROM repair_items_usage"))
        db.execute(text("DELETE FROM repair_items"))
        db.execute(text("DELETE FROM stock_movements"))
        db.execute(text("DELETE FROM products"))
        db.execute(text("DELETE FROM phones"))
        db.execute(text("DELETE FROM customers"))
        db.execute(text("DELETE FROM users WHERE role != 'super_admin'"))
        
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action="complete system reset",
            module="admin_reset",
            target_id=None,
            details="Deleted all system data except super admin account"
        )
        
        return {"message": "Complete system reset successful", "reset_by": current_user.username}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset system data: {str(e)}"
        )
