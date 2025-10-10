"""
Activity logging utilities
"""
from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from app.models.user import User
from datetime import datetime
from typing import Optional


def log_activity(
    db: Session,
    user: User,
    action: str,
    module: str,
    target_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """
    Log a user activity
    
    Args:
        db: Database session
        user: User performing the action
        action: Description of action (e.g., "created swap", "updated phone")
        module: Module name (customers, phones, swaps, sales, repairs)
        target_id: ID of affected record (optional)
        details: Additional details as JSON string (optional)
        ip_address: User's IP address (optional)
    """
    log_entry = ActivityLog(
        user_id=user.id,
        action=action,
        module=module,
        target_id=target_id,
        details=details,
        timestamp=datetime.utcnow(),
        ip_address=ip_address
    )
    
    db.add(log_entry)
    db.commit()
    
    return log_entry


def get_user_activities(db: Session, user_id: int, limit: int = 100):
    """Get activities for a specific user"""
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(limit)
        .all()
    )


def get_staff_activities(db: Session, manager: User, limit: int = 100):
    """
    Get activities for all staff created by this manager (CEO)
    """
    # Get all users created by this manager
    staff_ids = [u.id for u in manager.created_users]
    
    if not staff_ids:
        return []
    
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id.in_(staff_ids))
        .order_by(ActivityLog.timestamp.desc())
        .limit(limit)
        .all()
    )


def get_all_activities(db: Session, limit: int = 100):
    """Get all activities (Super Admin only)"""
    return (
        db.query(ActivityLog)
        .order_by(ActivityLog.timestamp.desc())
        .limit(limit)
        .all()
    )

