"""
Maintenance and system management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os
from datetime import datetime

from app.core.database import get_db
from app.core.backup import (
    create_backup,
    restore_backup,
    list_backups,
    delete_backup,
    export_data_json,
    save_export_to_file
)
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.phone import Phone, PhoneOwnershipHistory
from app.models.swap import Swap
from app.models.sale import Sale
from app.models.repair import Repair
from app.models.activity_log import ActivityLog
from app.models.invoice import Invoice
from app.models.product import Product
from app.models.product_sale import ProductSale
from app.models.pending_resale import PendingResale
from app.core.auth import get_current_active_admin

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

# Simple in-memory maintenance mode flag
# In production, this could be stored in database or config file
MAINTENANCE_MODE = {"enabled": False, "reason": "", "enabled_at": None}


@router.get("/status")
def get_maintenance_status():
    """Get current maintenance mode status"""
    return {
        "maintenance_mode": MAINTENANCE_MODE["enabled"],
        "reason": MAINTENANCE_MODE["reason"],
        "enabled_at": MAINTENANCE_MODE["enabled_at"]
    }


@router.post("/enable")
def enable_maintenance_mode(reason: str = "System maintenance"):
    """Enable maintenance mode"""
    MAINTENANCE_MODE["enabled"] = True
    MAINTENANCE_MODE["reason"] = reason
    MAINTENANCE_MODE["enabled_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": "Maintenance mode enabled",
        "maintenance_mode": MAINTENANCE_MODE
    }


@router.post("/disable")
def disable_maintenance_mode():
    """Disable maintenance mode"""
    MAINTENANCE_MODE["enabled"] = False
    MAINTENANCE_MODE["reason"] = ""
    MAINTENANCE_MODE["enabled_at"] = None
    
    return {
        "success": True,
        "message": "Maintenance mode disabled"
    }


@router.post("/backup/create")
def create_database_backup():
    """
    Create a backup of the database
    Note: PostgreSQL backups are managed by Railway
    """
    try:
        from app.core.config import settings
        
        # Check if using PostgreSQL (Railway production)
        if "postgresql" in settings.DATABASE_URL.lower():
            return {
                "success": False,
                "message": "PostgreSQL backups are managed by Railway",
                "tip": "Railway provides automatic daily backups",
                "instructions": "Go to Railway Dashboard → PostgreSQL service → Backups tab"
            }
        
        # SQLite backup (local development only)
        backup_info = create_backup()
        return {
            "success": True,
            "message": "Backup created successfully",
            **backup_info
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create backup: {str(e)}"
        )


@router.get("/backup/list")
def list_database_backups():
    """
    List all available database backups
    """
    try:
        backups = list_backups()
        return {
            "success": True,
            "count": len(backups),
            "backups": backups
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list backups: {str(e)}"
        )


@router.post("/backup/restore/{backup_filename}")
def restore_database_backup(backup_filename: str):
    """
    Restore database from a backup file
    WARNING: This will overwrite the current database!
    """
    try:
        restore_info = restore_backup(backup_filename)
        return {
            "success": True,
            "message": "Database restored successfully",
            **restore_info
        }
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore backup: {str(e)}"
        )


@router.delete("/backup/delete/{backup_filename}")
def delete_database_backup(backup_filename: str):
    """
    Delete a specific backup file
    """
    try:
        delete_info = delete_backup(backup_filename)
        return {
            "success": True,
            "message": "Backup deleted successfully",
            **delete_info
        }
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete backup: {str(e)}"
        )


@router.get("/export/json")
def export_all_data_json(db: Session = Depends(get_db)):
    """
    Export all data as JSON
    """
    try:
        export_data = export_data_json(db)
        return export_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export data: {str(e)}"
        )


@router.post("/export/save")
def save_export_file(db: Session = Depends(get_db)):
    """
    Export all data and save to file
    """
    try:
        export_data = export_data_json(db)
        file_path = save_export_to_file(export_data)
        
        return {
            "success": True,
            "message": "Data exported successfully",
            "file_path": file_path,
            "exported_at": datetime.now().isoformat(),
            "summary": export_data["summary"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save export: {str(e)}"
        )


@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)):
    """
    Get system-wide statistics for database page
    """
    try:
        # User counts by role
        total_users = db.query(User).count()
        total_super_admins = db.query(User).filter(User.role.in_([UserRole.SUPER_ADMIN, UserRole.ADMIN])).count()
        total_managers = db.query(User).filter(User.role.in_([UserRole.MANAGER, UserRole.CEO])).count()
        total_shop_keepers = db.query(User).filter(User.role == UserRole.SHOP_KEEPER).count()
        total_repairers = db.query(User).filter(User.role == UserRole.REPAIRER).count()
        total_staff = total_shop_keepers + total_repairers
        
        # User status counts
        active_users = db.query(User).filter(User.is_active == 1).count()
        inactive_users = db.query(User).filter(User.is_active == 0).count()
        
        # Data counts
        total_customers = db.query(Customer).count()
        total_phones = db.query(Phone).count()
        total_products = db.query(Product).count()
        total_swaps = db.query(Swap).count()
        total_sales = db.query(Sale).count()
        total_product_sales = db.query(ProductSale).count()
        total_repairs = db.query(Repair).count()
        total_activities = db.query(ActivityLog).count()
        
        return {
            # User statistics
            "total_users": total_users,
            "total_super_admins": total_super_admins,
            "total_managers": total_managers,
            "total_staff": total_staff,
            "total_shop_keepers": total_shop_keepers,
            "total_repairers": total_repairers,
            "active_users": active_users,
            "inactive_users": inactive_users,
            
            # Data statistics
            "total_customers": total_customers,
            "total_phones": total_phones,
            "total_products": total_products,
            "total_swaps": total_swaps,
            "total_sales": total_sales,
            "total_product_sales": total_product_sales,
            "total_repairs": total_repairs,
            "total_activities": total_activities
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system stats: {str(e)}"
        )


@router.get("/health")
def system_health_check(db: Session = Depends(get_db)):
    """
    Check system health
    """
    try:
        # Check database connection
        db.execute("SELECT 1")
        
        # Check if database file exists
        db_exists = os.path.exists("swapsync.db")
        db_size = os.path.getsize("swapsync.db") if db_exists else 0
        
        # Check backup directory
        backups = list_backups()
        
        return {
            "status": "healthy",
            "database": {
                "connected": True,
                "file_exists": db_exists,
                "size_mb": round(db_size / (1024 * 1024), 2)
            },
            "backups": {
                "count": len(backups),
                "latest": backups[0] if backups else None
            },
            "maintenance_mode": MAINTENANCE_MODE["enabled"],
            "checked_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"System health check failed: {str(e)}"
        )


# Data Clearing Endpoints
@router.post("/clear-all-data")
def clear_all_data(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Clear all business data from the system
    WARNING: This will permanently delete all business data!
    """
    try:
        from app.models.repair_item_usage import RepairItemUsage
        from app.models.pos_sale import POSSale, POSSaleItem
        from app.models.product import StockMovement
        from app.models.category import Category
        from app.models.brand import Brand
        
        # Clear all business data in proper order (respecting ALL foreign key constraints)
        # Step 1: Break circular dependencies and clear customer references
        db.query(Phone).update({"swapped_from_id": None, "current_owner_id": None})
        
        # Step 2: Delete child records first
        db.query(RepairItemUsage).delete()  # References repairs
        db.query(PhoneOwnershipHistory).delete()  # References phones
        db.query(Invoice).delete()  # References customers/sales/swaps/repairs
        db.query(POSSaleItem).delete()  # References POS sales
        db.query(StockMovement).delete()  # References products
        
        # Step 3: Delete transaction records
        db.query(POSSale).delete()  # POS sales
        db.query(PendingResale).delete()
        db.query(ProductSale).delete()
        db.query(Repair).delete()
        db.query(Sale).delete()
        db.query(Swap).delete()
        
        # Step 4: Delete master records (delete products first since category_id is NOT NULL)
        db.query(Product).delete()  # Must delete before clearing categories (NOT NULL constraint)
        db.query(Customer).delete()
        
        # Step 5: Clear phone foreign keys that reference categories and brands
        db.query(Phone).update({"category_id": None, "brand_id": None})
        
        # Step 6: Delete phones
        db.query(Phone).delete()
        
        # Step 7: Delete categories and brands (user must recreate them)
        db.query(Category).delete()
        db.query(Brand).delete()
        
        # Step 8: Clear activity logs
        db.query(ActivityLog).delete()
        
        db.commit()
        
        return {
            "success": True,
            "message": "All business data cleared successfully (including categories, brands, and POS sales)",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear all data: {str(e)}"
        )


@router.post("/clear-customers")
def clear_customers(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Clear all customer data (also clears related sales, swaps, repairs, product sales)"""
    try:
        count = db.query(Customer).count()
        
        # Delete all related records first (to avoid foreign key violations)
        # Step 1: Clear phone foreign keys that reference swaps and customers
        db.query(Phone).update({"swapped_from_id": None, "current_owner_id": None})
        
        # Step 2: Delete ownership history (references phones)
        db.query(PhoneOwnershipHistory).delete()
        
        # Step 3: Delete all invoices (references customers)
        db.query(Invoice).delete()
        
        # Step 4: Delete transaction records
        db.query(PendingResale).delete()  # Delete pending resales (references customers)
        db.query(ProductSale).delete()  # Delete product sales referencing customers
        db.query(Sale).delete()  # Delete phone sales
        db.query(Swap).delete()  # Delete swaps (now safe - phones.swapped_from_id cleared)
        db.query(Repair).delete()  # Delete repairs
        
        # Step 5: Delete customers (now safe - phones.current_owner_id cleared)
        db.query(Customer).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} customers and all related transactions successfully",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear customers: {str(e)}"
        )


@router.post("/clear-phones")
def clear_phones(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Clear all phone records (also clears ownership history, sales, swaps, pending resales)"""
    try:
        count = db.query(Phone).count()
        
        # Delete all related records first (to avoid foreign key violations)
        # Step 1: Clear phone foreign keys that reference swaps and customers
        db.query(Phone).update({"swapped_from_id": None, "current_owner_id": None})
        
        # Step 2: Delete records referencing phones
        db.query(PhoneOwnershipHistory).delete()  # Delete ownership history
        db.query(PendingResale).delete()  # Delete pending resales
        db.query(ProductSale).delete()  # Delete product sales
        db.query(Sale).delete()  # Delete phone sales
        db.query(Swap).delete()  # Delete swaps (now safe - swapped_from_id cleared)
        db.query(Repair).delete()  # Delete repairs
        
        # Step 3: Delete phones
        db.query(Phone).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} phones and all related transactions successfully",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear phones: {str(e)}"
        )


@router.post("/clear-swaps")
def clear_swaps(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Clear all swap transactions (also clears phone references and pending resales)"""
    try:
        count = db.query(Swap).count()
        
        # Clear phone foreign keys that reference swaps (circular dependency)
        db.query(Phone).update({"swapped_from_id": None})
        
        # Delete pending resales that reference swaps
        db.query(PendingResale).delete()
        
        # Delete invoices for swaps
        db.query(Invoice).filter(Invoice.transaction_type == 'swap').delete()
        
        # Now delete swaps
        db.query(Swap).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} swap transactions successfully",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear swaps: {str(e)}"
        )


@router.post("/clear-sales")
def clear_sales(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Clear all sales records (also clears related invoices and ownership history)"""
    try:
        count = db.query(Sale).count()
        
        # Delete invoices for sales first
        db.query(Invoice).filter(Invoice.transaction_type == 'sale').delete()
        
        # Delete phone ownership history for sales
        db.query(PhoneOwnershipHistory).filter(PhoneOwnershipHistory.change_reason == 'sale').delete()
        
        # Now delete sales
        db.query(Sale).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} sales records successfully",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear sales: {str(e)}"
        )


@router.post("/clear-repairs")
def clear_repairs(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Clear all repair records (also clears repair item usage and ownership history)"""
    try:
        from app.models.repair_item_usage import RepairItemUsage
        
        count = db.query(Repair).count()
        
        # Delete repair item usage first (references repairs)
        db.query(RepairItemUsage).delete()
        
        # Delete phone ownership history for repairs
        db.query(PhoneOwnershipHistory).filter(PhoneOwnershipHistory.change_reason == 'repair').delete()
        
        # Delete invoices for repairs
        db.query(Invoice).filter(Invoice.transaction_type == 'repair').delete()
        
        # Now delete repairs
        db.query(Repair).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} repair records successfully",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear repairs: {str(e)}"
        )


@router.post("/clear-invoices")
def clear_invoices(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Clear all invoices"""
    try:
        count = db.query(Invoice).count()
        db.query(Invoice).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} invoices successfully",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear invoices: {str(e)}"
        )


@router.post("/clear-activities")
def clear_activities(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Clear all activity logs"""
    try:
        count = db.query(ActivityLog).count()
        db.query(ActivityLog).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} activity logs successfully",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear activities: {str(e)}"
        )


@router.post("/clear-pos-sales")
def clear_pos_sales(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Clear all POS sales data (transactions, items, and related product sales)
    WARNING: This will permanently delete all POS transaction history!
    """
    try:
        from app.models.pos_sale import POSSale, POSSaleItem
        from app.models.product import StockMovement
        
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
        
        # 3. Delete product sales (all of them, not just POS-related)
        db.query(ProductSale).delete()
        
        # 4. Delete stock movements related to POS sales
        db.query(StockMovement).filter(
            StockMovement.reference_type == "pos_sale"
        ).delete()
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {pos_sales_count} POS sales, {pos_items_count} items, {product_sales_count} product sales, and {stock_movements_count} stock movements",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username,
            "details": {
                "pos_sales": pos_sales_count,
                "pos_items": pos_items_count,
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


@router.post("/clear-users")
def clear_users(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Clear all user accounts except super admins
    This will delete all Managers, Shop Keepers, and Repairers
    Super Admin accounts are protected from deletion
    """
    try:
        # Count users to be deleted (exclude super admins)
        users_to_delete = db.query(User).filter(
            User.role.notin_([UserRole.SUPER_ADMIN, UserRole.ADMIN])
        ).all()
        
        count = len(users_to_delete)
        
        if count == 0:
            return {
                "success": True,
                "message": "No users to delete (only super admins exist)",
                "cleared_at": datetime.now().isoformat(),
                "cleared_by": current_user.username,
                "deleted_count": 0
            }
        
        # Delete user sessions first (if they have foreign key references)
        from app.models.user_session import UserSession
        from app.models.otp_session import OTPSession
        
        # Get user IDs to delete
        user_ids = [user.id for user in users_to_delete]
        
        # Clear related data
        db.query(UserSession).filter(UserSession.user_id.in_(user_ids)).delete(synchronize_session=False)
        db.query(OTPSession).filter(OTPSession.user_id.in_(user_ids)).delete(synchronize_session=False)
        
        # Clear activity logs created by these users
        db.query(ActivityLog).filter(ActivityLog.user_id.in_(user_ids)).delete(synchronize_session=False)
        
        # Clear parent_user_id references (users created by deleted users)
        db.query(User).filter(User.parent_user_id.in_(user_ids)).update(
            {User.parent_user_id: None},
            synchronize_session=False
        )
        
        # Clear created_by references in other tables
        db.query(Customer).filter(Customer.created_by_user_id.in_(user_ids)).update(
            {Customer.created_by_user_id: None},
            synchronize_session=False
        )
        db.query(Phone).filter(Phone.created_by_user_id.in_(user_ids)).update(
            {Phone.created_by_user_id: None},
            synchronize_session=False
        )
        db.query(Sale).filter(Sale.created_by_user_id.in_(user_ids)).update(
            {Sale.created_by_user_id: None},
            synchronize_session=False
        )
        db.query(Product).filter(Product.created_by_user_id.in_(user_ids)).update(
            {Product.created_by_user_id: None},
            synchronize_session=False
        )
        db.query(ProductSale).filter(ProductSale.created_by_user_id.in_(user_ids)).update(
            {ProductSale.created_by_user_id: None},
            synchronize_session=False
        )
        
        # Clear created_by references in categories and brands
        from app.models.category import Category
        from app.models.brand import Brand
        from app.models.product import StockMovement
        
        db.query(Category).filter(Category.created_by_user_id.in_(user_ids)).update(
            {Category.created_by_user_id: None},
            synchronize_session=False
        )
        db.query(Brand).filter(Brand.created_by_user_id.in_(user_ids)).update(
            {Brand.created_by_user_id: None},
            synchronize_session=False
        )
        db.query(StockMovement).filter(StockMovement.created_by_user_id.in_(user_ids)).update(
            {StockMovement.created_by_user_id: None},
            synchronize_session=False
        )
        
        # Clear staff assignments in repairs
        db.query(Repair).filter(Repair.staff_id.in_(user_ids)).update(
            {Repair.staff_id: None},
            synchronize_session=False
        )
        # Also clear created_by in repairs
        db.query(Repair).filter(Repair.created_by_user_id.in_(user_ids)).update(
            {Repair.created_by_user_id: None},
            synchronize_session=False
        )
        
        # Clear staff_id in invoices
        db.query(Invoice).filter(Invoice.staff_id.in_(user_ids)).update(
            {Invoice.staff_id: None},
            synchronize_session=False
        )
        
        # Clear attending_staff_id in pending resales
        db.query(PendingResale).filter(PendingResale.attending_staff_id.in_(user_ids)).update(
            {PendingResale.attending_staff_id: None},
            synchronize_session=False
        )
        
        # Clear audit codes for deleted users
        from app.models.audit_code import AuditCode
        db.query(AuditCode).filter(AuditCode.user_id.in_(user_ids)).delete(synchronize_session=False)
        
        # Now delete the users
        db.query(User).filter(
            User.role.notin_([UserRole.SUPER_ADMIN, UserRole.ADMIN])
        ).delete(synchronize_session=False)
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} user accounts successfully (Super admins protected)",
            "cleared_at": datetime.now().isoformat(),
            "cleared_by": current_user.username,
            "deleted_count": count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear users: {str(e)}"
        )