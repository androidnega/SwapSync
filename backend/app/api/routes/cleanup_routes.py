"""
Database Cleanup Routes
Endpoints for cleaning old logs and maintaining database health
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_manage_system_settings
from app.core.cleanup import (
    clean_old_activity_logs,
    clean_old_sms_logs,
    clean_old_sessions,
    run_full_cleanup
)
from app.models.user import User

router = APIRouter(prefix="/cleanup", tags=["Database Cleanup"])


@router.post("/activity-logs")
def cleanup_activity_logs(
    days: int = 90,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete activity logs older than specified days
    Admin/Manager only
    """
    if not can_manage_system_settings(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = clean_old_activity_logs(db, days=days)
    return {
        "message": f"Cleaned {result['deleted']} old activity logs",
        "details": result
    }


@router.post("/sms-logs")
def cleanup_sms_logs(
    days: int = 60,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete SMS logs older than specified days
    Admin/Manager only
    """
    if not can_manage_system_settings(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = clean_old_sms_logs(db, days=days)
    return {
        "message": f"Cleaned {result['deleted']} old SMS logs",
        "details": result
    }


@router.post("/sessions")
def cleanup_sessions(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user sessions older than specified days
    Admin only
    """
    if not can_manage_system_settings(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = clean_old_sessions(db, days=days)
    return {
        "message": f"Cleaned {result['deleted']} old sessions",
        "details": result
    }


@router.post("/run-full-cleanup")
def full_cleanup(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run all cleanup tasks at once
    Admin only
    
    Recommended: Run once per week
    """
    if not can_manage_system_settings(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = run_full_cleanup(db)
    
    total_deleted = sum(
        r["deleted"] for r in result.values() 
        if isinstance(r, dict) and "deleted" in r
    )
    
    return {
        "message": f"Full cleanup completed - {total_deleted} total records deleted",
        "details": result
    }

