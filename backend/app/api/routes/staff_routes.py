"""
Staff Management Routes - For CEOs to manage their staff
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_user, get_password_hash
from app.core.activity_logger import get_staff_activities, get_all_activities, get_user_activities
from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog
from app.schemas.user import UserResponse
from pydantic import BaseModel

router = APIRouter(prefix="/staff", tags=["Staff Management"])


# Request Models
class UpdateUserRequest(BaseModel):
    email: str
    full_name: str
    company_name: Optional[str] = None
    is_active: bool


class ResetPasswordRequest(BaseModel):
    new_password: str


@router.get("/list", response_model=List[UserResponse])
def get_staff_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of staff members for filtering/selection
    - Shop Keepers: See only themselves
    - CEO/Admin: See all their staff
    """
    if current_user.role in [UserRole.SHOP_KEEPER, UserRole.REPAIRER]:
        # Staff can only see themselves
        return [current_user]
    elif current_user.role in [UserRole.CEO, UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        # CEO/Admin see all their staff + themselves
        staff = db.query(User).filter(User.parent_user_id == current_user.id).all()
        return [current_user] + staff
    else:
        return [current_user]


@router.get("/my-staff", response_model=List[UserResponse])
def get_my_staff(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all staff members created by this CEO
    """
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers and Admins can view staff"
        )
    
    # Get staff created by this user
    staff = db.query(User).filter(User.parent_user_id == current_user.id).all()
    return staff


@router.get("/activities")
def get_staff_activity_logs(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get activity logs
    - CEO: See logs for their staff only
    - Super Admin: See all logs
    - Staff: See their own logs only
    """
    if current_user.is_super_admin:
        # Super admin sees everything
        activities = get_all_activities(db, limit)
    elif current_user.is_ceo:
        # CEO sees their staff's activities
        activities = get_staff_activities(db, current_user, limit)
    else:
        # Staff see only their own activities
        activities = get_user_activities(db, current_user.id, limit)
    
    return [{
        "id": log.id,
        "user": {
            "id": log.user.id,
            "username": log.user.username,
            "full_name": log.user.full_name,
            "role": log.user.role.value
        },
        "action": log.action,
        "module": log.module,
        "target_id": log.target_id,
        "details": log.details,
        "timestamp": log.timestamp.isoformat(),
        "action_summary": log.action_summary
    } for log in activities]


@router.get("/hierarchy")
def get_user_hierarchy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user hierarchy tree
    Shows who created whom
    """
    if not current_user.is_super_admin and not current_user.is_ceo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only CEOs and Admins can view hierarchy"
        )
    
    # Build hierarchy tree
    if current_user.is_super_admin:
        # Super admin sees full tree
        root_users = db.query(User).filter(User.parent_user_id == None).all()
    else:
        # CEO sees only their branch
        root_users = [current_user]
    
    def build_tree(user):
        return {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_active": bool(user.is_active),
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "staff": [build_tree(staff) for staff in user.created_users] if hasattr(user, 'created_users') else []
        }
    
    hierarchy = [build_tree(user) for user in root_users]
    
    return {
        "hierarchy": hierarchy,
        "total_users": db.query(User).count(),
        "current_user_role": current_user.role.value
    }


@router.get("/stats")
def get_staff_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about staff and their activities
    """
    if not current_user.is_ceo and not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only CEOs and Admins can view staff statistics"
        )
    
    # Get staff
    if current_user.is_super_admin:
        all_users = db.query(User).all()
        staff = all_users
    else:
        staff = db.query(User).filter(User.parent_user_id == current_user.id).all()
    
    # Count by role
    role_counts = {}
    for s in staff:
        role_counts[s.role.value] = role_counts.get(s.role.value, 0) + 1
    
    # Activity counts
    staff_ids = [s.id for s in staff]
    total_activities = db.query(ActivityLog).filter(ActivityLog.user_id.in_(staff_ids)).count() if staff_ids else 0
    
    return {
        "total_staff": len(staff),
        "active_staff": sum(1 for s in staff if s.is_active),
        "inactive_staff": sum(1 for s in staff if not s.is_active),
        "by_role": role_counts,
        "total_activities": total_activities,
        "staff_list": [
            {
                "id": s.id,
                "username": s.username,
                "full_name": s.full_name,
                "role": s.role.value,
                "is_active": bool(s.is_active),
                "last_login": s.last_login.isoformat() if s.last_login else None
            }
            for s in staff
        ]
    }


@router.put("/update/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update_data: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user details (RESTRICTED)
    - System Admin can update all fields for managers
    - Managers CANNOT update email (for transparency)
    - Managers can update full_name, company_name, is_active only
    """
    # Get the user to update
    user_to_update = db.query(User).filter(User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Permission check
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        # System Admin has full update permissions
        if user_to_update.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.SHOP_KEEPER, UserRole.REPAIRER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update other system administrators"
            )
        # Admin can update everything including email
        user_to_update.email = update_data.email
    elif current_user.role in [UserRole.MANAGER, UserRole.CEO]:
        # Manager can only update their own staff
        if user_to_update.parent_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own staff members"
            )
        # Managers CANNOT change email for transparency
        # Only update full_name, company_name, is_active
        # Email update request is ignored for managers
        from app.core.activity_logger import log_activity
        log_activity(
            db=db,
            user=current_user,
            action=f"attempted to update user {user_to_update.username}",
            module="users",
            target_id=user_to_update.id,
            details="Manager can only update name and status, not email. Contact admin to change email."
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Update user (managers cannot change email)
    user_to_update.full_name = update_data.full_name
    if update_data.company_name is not None:
        user_to_update.company_name = update_data.company_name
    user_to_update.is_active = 1 if update_data.is_active else 0
    
    db.commit()
    db.refresh(user_to_update)
    
    return user_to_update


@router.post("/reset-password/{user_id}")
def reset_user_password(
    user_id: int,
    password_data: ResetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reset user password (RESTRICTED)
    - ONLY System Admin can reset passwords
    - Managers CANNOT reset passwords (for transparency)
    - Managers can request admin to reset via /auth/password-reset/admin-generate
    """
    # Get the user to update
    user_to_update = db.query(User).filter(User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # ONLY ADMIN can reset passwords
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can reset passwords. Managers should use /auth/password-reset/admin-generate to request password reset."
        )
    
    # System Admin can reset manager passwords
    if user_to_update.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.SHOP_KEEPER, UserRole.REPAIRER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot reset passwords for other system administrators"
        )
    
    # Validate password length
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Update password
    user_to_update.hashed_password = get_password_hash(password_data.new_password)
    
    db.commit()
    
    # Log the activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action=f"reset password for user {user_to_update.username}",
        module="users",
        target_id=user_to_update.id,
        details=f"Password reset by admin {current_user.username}"
    )
    
    return {
        "message": f"Password for {user_to_update.username} reset successfully",
        "username": user_to_update.username
    }


@router.delete("/delete/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user (ADMIN ONLY)
    - ONLY System Admin can delete users
    - Managers CANNOT delete users (need admin approval)
    WARNING: This will cascade delete all related data!
    """
    # Get the user to delete
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Cannot delete yourself
    if user_to_delete.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete yourself"
        )
    
    # ONLY ADMIN can delete users
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can delete users. Please contact admin for user deletion."
        )
    
    # System Admin can delete managers and their staff
    if user_to_delete.role not in [UserRole.MANAGER, UserRole.CEO, UserRole.SHOP_KEEPER, UserRole.REPAIRER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete other system administrators"
        )
    
    # Store username before deletion
    deleted_username = user_to_delete.username
    
    # Check if user has staff members - admin can delete, but we'll reassign staff to None
    staff_count = db.query(User).filter(User.parent_user_id == user_id).count()
    
    try:
        # Import all models that have user references
        from app.models.user_session import UserSession
        from app.models.otp_session import OTPSession
        from app.models.product import StockMovement, Product
        from app.models.phone import Phone
        from app.models.repair import Repair
        from app.models.sale import Sale
        from app.models.product_sale import ProductSale
        from app.models.category import Category
        from app.models.brand import Brand
        from app.models.audit_code import AuditCode
        from app.models.activity_log import ActivityLog
        from app.models.pending_resale import PendingResale
        from app.models.invoice import Invoice
        
        # Delete user sessions first (to avoid NOT NULL constraint violation)
        db.query(UserSession).filter(UserSession.user_id == user_id).delete()
        
        # Delete OTP sessions
        db.query(OTPSession).filter(OTPSession.user_id == user_id).delete()
        
        # Delete audit codes (they have NOT NULL constraint on user_id)
        db.query(AuditCode).filter(AuditCode.user_id == user_id).delete()
        
        # Delete activity logs (they have NOT NULL constraint on user_id)
        db.query(ActivityLog).filter(ActivityLog.user_id == user_id).delete()
        
        # Set parent_user_id to NULL for staff members created by this user
        db.query(User).filter(User.parent_user_id == user_id).update({"parent_user_id": None})
        
        # Set attending_staff_id to NULL in pending resales
        db.query(PendingResale).filter(PendingResale.attending_staff_id == user_id).update({"attending_staff_id": None})
        
        # Set staff_id to NULL in repairs
        db.query(Repair).filter(Repair.staff_id == user_id).update({"staff_id": None})
        
        # Set staff_id to NULL in invoices
        db.query(Invoice).filter(Invoice.staff_id == user_id).update({"staff_id": None})
        
        # Set created_by_user_id to NULL in all records that reference this user
        # This preserves the records while removing the user reference
        from app.models.customer import Customer
        db.query(Customer).filter(Customer.created_by_user_id == user_id).update({"created_by_user_id": None})
        db.query(StockMovement).filter(StockMovement.created_by_user_id == user_id).update({"created_by_user_id": None})
        db.query(Product).filter(Product.created_by_user_id == user_id).update({"created_by_user_id": None})
        db.query(Phone).filter(Phone.created_by_user_id == user_id).update({"created_by_user_id": None})
        db.query(Repair).filter(Repair.created_by_user_id == user_id).update({"created_by_user_id": None})
        db.query(Sale).filter(Sale.created_by_user_id == user_id).update({"created_by_user_id": None})
        db.query(ProductSale).filter(ProductSale.created_by_user_id == user_id).update({"created_by_user_id": None})
        db.query(Category).filter(Category.created_by_user_id == user_id).update({"created_by_user_id": None})
        db.query(Brand).filter(Brand.created_by_user_id == user_id).update({"created_by_user_id": None})
        
        # Delete user (will cascade to other related records based on model relationships)
        db.delete(user_to_delete)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )
    
    # Log the activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action=f"deleted user {deleted_username}",
        module="users",
        target_id=user_id,
        details=f"User deleted by admin {current_user.username}"
    )
    
    return {
        "message": f"User {deleted_username} deleted successfully",
        "deleted_user_id": user_id,
        "deleted_username": deleted_username
    }


@router.post("/lock-manager/{manager_id}")
def lock_manager(
    manager_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lock Manager account (and all their staff)
    Only System Admin can lock Managers
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can lock Managers"
        )
    
    # Get the Manager
    manager = db.query(User).filter(User.id == manager_id, User.role.in_([UserRole.MANAGER, 'MANAGER'])).first()
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager not found"
        )
    
    # Lock Manager
    manager.is_active = 0
    
    # Lock all staff under this Manager
    staff = db.query(User).filter(User.parent_user_id == manager_id).all()
    for s in staff:
        s.is_active = 0
    
    db.commit()
    
    return {
        "message": f"Manager {manager.username} and {len(staff)} staff members locked",
        "manager_id": manager_id,
        "staff_locked": len(staff)
    }


@router.post("/unlock-manager/{manager_id}")
def unlock_manager(
    manager_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlock Manager account (and all their staff)
    Only System Admin can unlock Managers
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can unlock Managers"
        )
    
    # Get the Manager
    manager = db.query(User).filter(User.id == manager_id, User.role.in_([UserRole.MANAGER, 'MANAGER'])).first()
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager not found"
        )
    
    # Unlock Manager
    manager.is_active = 1
    
    # Unlock all staff under this Manager
    staff = db.query(User).filter(User.parent_user_id == manager_id).all()
    for s in staff:
        s.is_active = 1
    
    db.commit()
    
    return {
        "message": f"Manager {manager.username} and {len(staff)} staff members unlocked",
        "manager_id": manager_id,
        "staff_unlocked": len(staff)
    }


@router.get("/admin/companies")
def get_all_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all companies (managers) and their users
    - Only System Admin can view all companies
    - Shows all managers and the staff under each manager
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can view all companies"
        )
    
    # Get all managers
    managers = db.query(User).filter(User.role.in_([UserRole.MANAGER, UserRole.CEO])).all()
    
    companies = []
    for manager in managers:
        # Get staff under this manager
        staff = db.query(User).filter(User.parent_user_id == manager.id).all()
        
        # Get recent activities for this manager and their staff
        all_user_ids = [manager.id] + [s.id for s in staff]
        recent_activities = db.query(ActivityLog).filter(
            ActivityLog.user_id.in_(all_user_ids)
        ).order_by(ActivityLog.timestamp.desc()).limit(10).all()
        
        companies.append({
            "manager": {
                "id": manager.id,
                "username": manager.username,
                "full_name": manager.full_name,
                "email": manager.email,
                "phone_number": manager.phone_number,
                "company_name": manager.company_name,
                "use_company_sms_branding": bool(manager.use_company_sms_branding) if hasattr(manager, 'use_company_sms_branding') else False,
                "is_active": bool(manager.is_active),
                "created_at": manager.created_at.isoformat() if manager.created_at else None,
                "last_login": manager.last_login.isoformat() if manager.last_login else None
            },
            "staff": [{
                "id": s.id,
                "username": s.username,
                "full_name": s.full_name,
                "email": s.email,
                "phone_number": s.phone_number,
                "role": s.role.value,
                "is_active": bool(s.is_active),
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "last_login": s.last_login.isoformat() if s.last_login else None
            } for s in staff],
            "staff_count": len(staff),
            "recent_activities": [{
                "id": log.id,
                "user_id": log.user_id,
                "username": log.user.username if log.user else "Unknown",
                "action": log.action,
                "module": log.module,
                "timestamp": log.timestamp.isoformat(),
                "details": log.details
            } for log in recent_activities]
        })
    
    return {
        "total_companies": len(companies),
        "companies": companies
    }


@router.get("/admin/company/{manager_id}/details")
def get_company_details(
    manager_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific company (manager)
    - Shows manager info, all staff, and detailed activity logs
    - Only System Admin can view
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can view company details"
        )
    
    # Get the manager
    manager = db.query(User).filter(
        User.id == manager_id,
        User.role.in_([UserRole.MANAGER, UserRole.CEO])
    ).first()
    
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager not found"
        )
    
    # Get staff under this manager
    staff = db.query(User).filter(User.parent_user_id == manager.id).all()
    
    # Get all activities for this manager and their staff
    all_user_ids = [manager.id] + [s.id for s in staff]
    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id.in_(all_user_ids)
    ).order_by(ActivityLog.timestamp.desc()).limit(100).all()
    
    # Get session stats for manager
    from app.models.user_session import UserSession
    manager_sessions = db.query(UserSession).filter(UserSession.user_id == manager.id).all()
    
    return {
        "manager": {
            "id": manager.id,
            "username": manager.username,
            "full_name": manager.full_name,
            "email": manager.email,
            "phone_number": manager.phone_number,
            "company_name": manager.company_name,
            "is_active": bool(manager.is_active),
            "created_at": manager.created_at.isoformat() if manager.created_at else None,
            "last_login": manager.last_login.isoformat() if manager.last_login else None,
            "total_sessions": len(manager_sessions),
            "is_currently_active": manager.current_session_id is not None
        },
        "staff": [{
            "id": s.id,
            "username": s.username,
            "full_name": s.full_name,
            "email": s.email,
            "phone_number": s.phone_number,
            "role": s.role.value,
            "is_active": bool(s.is_active),
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "last_login": s.last_login.isoformat() if s.last_login else None,
            "is_currently_active": s.current_session_id is not None
        } for s in staff],
        "activities": [{
            "id": log.id,
            "user_id": log.user_id,
            "username": log.user.username if log.user else "Unknown",
            "user_role": log.user.role.value if log.user else "Unknown",
            "action": log.action,
            "module": log.module,
            "target_id": log.target_id,
            "timestamp": log.timestamp.isoformat(),
            "details": log.details,
            "action_summary": log.action_summary
        } for log in activities],
        "stats": {
            "total_staff": len(staff),
            "active_staff": sum(1 for s in staff if s.is_active),
            "total_activities": len(activities),
            "staff_by_role": {
                "shop_keeper": sum(1 for s in staff if s.role == UserRole.SHOP_KEEPER),
                "repairer": sum(1 for s in staff if s.role == UserRole.REPAIRER)
            }
        }
    }


@router.get("/admin/activity-changes")
def get_account_changes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """
    Get all account detail changes made by managers/users
    - Shows when users change their account details
    - Admin can see all changes across all companies
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can view account changes"
        )
    
    # Get activities related to user updates
    changes = db.query(ActivityLog).filter(
        ActivityLog.module == "users"
    ).order_by(ActivityLog.timestamp.desc()).limit(limit).all()
    
    return {
        "total_changes": len(changes),
        "changes": [{
            "id": log.id,
            "changed_by_user_id": log.user_id,
            "changed_by_username": log.user.username if log.user else "Unknown",
            "changed_by_role": log.user.role.value if log.user else "Unknown",
            "target_user_id": log.target_id,
            "action": log.action,
            "timestamp": log.timestamp.isoformat(),
            "details": log.details,
            "action_summary": log.action_summary
        } for log in changes]
    }


@router.post("/admin/toggle-sms-branding/{manager_id}")
def toggle_sms_branding(
    manager_id: int,
    enabled: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle SMS branding for a manager
    - When enabled (True): SMS sent with manager's company name
    - When disabled (False): SMS sent with "SwapSync" branding
    - Only System Admin can toggle this
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can toggle SMS branding"
        )
    
    # Get the Manager
    manager = db.query(User).filter(
        User.id == manager_id, 
        User.role.in_([UserRole.MANAGER, UserRole.CEO])
    ).first()
    
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager not found"
        )
    
    # Check if manager has company name
    if enabled and not manager.company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot enable company branding: Manager has no company name set"
        )
    
    # Update SMS branding preference
    old_value = bool(manager.use_company_sms_branding)
    manager.use_company_sms_branding = 1 if enabled else 0
    db.commit()
    
    # Log the activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action=f"{'enabled' if enabled else 'disabled'} company SMS branding for {manager.username}",
        module="users",
        target_id=manager.id,
        details=f"SMS will now be sent as: {'Company (' + manager.company_name + ')' if enabled else 'SwapSync'}"
    )
    
    return {
        "success": True,
        "manager_id": manager_id,
        "manager_username": manager.username,
        "company_name": manager.company_name,
        "use_company_sms_branding": bool(manager.use_company_sms_branding),
        "message": f"SMS branding {'enabled' if enabled else 'disabled'} for {manager.company_name or manager.username}",
        "sms_sender": manager.company_name if enabled else "SwapSync"
    }


@router.get("/admin/company/{manager_id}/business-stats")
def get_manager_business_stats(
    manager_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get business statistics for a specific manager
    - Only System Admin can view (after audit code validation)
    - Returns real-time sales revenue, repair revenue, and other stats
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        from sqlalchemy import func
        from app.models.customer import Customer
        from app.models.phone import Phone
        from app.models.swap import Swap
        from app.models.sale import Sale
        from app.models.repair import Repair
        
        logger.info(f"Business stats request from user {current_user.id} ({current_user.role}) for manager {manager_id}")
        
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            logger.warning(f"Access denied: User {current_user.id} with role {current_user.role} tried to view business stats")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only System Administrators can view business statistics"
            )
        
        # Get the manager
        manager = db.query(User).filter(
            User.id == manager_id,
            User.role.in_([UserRole.MANAGER, UserRole.CEO])
        ).first()
        
        if not manager:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Manager not found"
            )
        
        # Get Manager's staff
        staff = db.query(User).filter(User.parent_user_id == manager_id).all()
        staff_ids = [manager_id] + [s.id for s in staff]
        
        # Get business statistics with error handling
        try:
            total_customers = db.query(Customer).filter(Customer.created_by_id.in_(staff_ids)).count()
        except Exception as e:
            total_customers = 0
            
        try:
            total_phones = db.query(Phone).filter(Phone.created_by_id.in_(staff_ids)).count()
        except Exception as e:
            total_phones = 0
            
        try:
            total_swaps = db.query(Swap).filter(Swap.staff_id.in_(staff_ids)).count()
        except Exception as e:
            total_swaps = 0
            
        try:
            total_sales = db.query(Sale).filter(Sale.created_by_user_id.in_(staff_ids)).count()
        except Exception as e:
            total_sales = 0
            
        try:
            total_repairs = db.query(Repair).filter(Repair.staff_id.in_(staff_ids)).count()
        except Exception as e:
            total_repairs = 0
        
        # Revenue calculations with error handling
        try:
            sales_revenue = db.query(func.sum(Sale.amount_paid)).filter(Sale.created_by_user_id.in_(staff_ids)).scalar() or 0.0
        except Exception as e:
            sales_revenue = 0.0
            
        try:
            repair_revenue = db.query(func.sum(Repair.cost)).filter(
                Repair.staff_id.in_(staff_ids),
                Repair.status.in_(['Completed', 'Delivered'])
            ).scalar() or 0.0
        except Exception as e:
            repair_revenue = 0.0
        
        return {
            "manager_id": manager_id,
            "manager_name": manager.full_name,
            "business_stats": {
                "total_customers": total_customers,
                "total_phones": total_phones,
                "total_swaps": total_swaps,
                "total_sales": total_sales,
                "total_repairs": total_repairs,
                "sales_revenue": float(sales_revenue),
                "repair_revenue": float(repair_revenue),
                "total_revenue": float(sales_revenue + repair_revenue)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching business statistics: {str(e)}"
        )