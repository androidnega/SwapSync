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
from app.models.phone import Phone
from app.models.swap import Swap
from app.models.sale import Sale
from app.models.repair import Repair
from app.models.activity_log import ActivityLog
from app.models.invoice import Invoice
from app.models.product import Product
from app.models.product_sale import ProductSale
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
        # User counts
        total_users = db.query(User).count()
        total_managers = db.query(User).filter(User.role.in_([UserRole.MANAGER, UserRole.CEO])).count()
        total_staff = db.query(User).filter(User.role.in_([UserRole.SHOP_KEEPER, UserRole.REPAIRER])).count()
        active_users = db.query(User).filter(User.is_active == 1).count()
        
        # Data counts
        total_customers = db.query(Customer).count()
        total_phones = db.query(Phone).count()
        total_swaps = db.query(Swap).count()
        total_sales = db.query(Sale).count()
        total_repairs = db.query(Repair).count()
        total_activities = db.query(ActivityLog).count()
        
        return {
            "total_users": total_users,
            "total_managers": total_managers,
            "total_staff": total_staff,
            "active_users": active_users,
            "total_customers": total_customers,
            "total_phones": total_phones,
            "total_swaps": total_swaps,
            "total_sales": total_sales,
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
        # Clear all business data in order (respecting foreign key constraints)
        db.query(ProductSale).delete()
        db.query(Invoice).delete()
        db.query(Repair).delete()
        db.query(Sale).delete()
        db.query(Swap).delete()
        db.query(Product).delete()
        db.query(Phone).delete()
        db.query(Customer).delete()
        
        # Clear activity logs
        db.query(ActivityLog).delete()
        
        db.commit()
        
        return {
            "success": True,
            "message": "All business data cleared successfully",
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
    """Clear all customer data"""
    try:
        count = db.query(Customer).count()
        db.query(Customer).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} customers successfully",
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
    """Clear all phone records"""
    try:
        count = db.query(Phone).count()
        db.query(Phone).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Cleared {count} phone records successfully",
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
    """Clear all swap transactions"""
    try:
        count = db.query(Swap).count()
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
    """Clear all sales records"""
    try:
        count = db.query(Sale).count()
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
    """Clear all repair records"""
    try:
        count = db.query(Repair).count()
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

