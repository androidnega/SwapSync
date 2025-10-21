"""
Database Cleanup Utilities for Railway $5 Plan Optimization
Keeps disk usage low by cleaning old logs and temporary data
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.activity_log import ActivityLog
from app.models.sms_log import SMSLog
from app.models.user_session import UserSession
import logging

logger = logging.getLogger(__name__)


def clean_old_activity_logs(db: Session, days: int = 90):
    """
    Delete activity logs older than specified days
    Default: 90 days (3 months)
    
    Keeps disk usage low and queries fast
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted_count = db.query(ActivityLog).filter(
            ActivityLog.created_at < cutoff_date
        ).delete()
        
        db.commit()
        
        logger.info(f"✅ Cleaned {deleted_count} old activity logs (older than {days} days)")
        return {"deleted": deleted_count, "cutoff_date": cutoff_date.isoformat()}
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error cleaning activity logs: {e}")
        raise


def clean_old_sms_logs(db: Session, days: int = 60):
    """
    Delete SMS logs older than specified days
    Default: 60 days (2 months)
    
    SMS logs can accumulate quickly
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted_count = db.query(SMSLog).filter(
            SMSLog.sent_at < cutoff_date
        ).delete()
        
        db.commit()
        
        logger.info(f"✅ Cleaned {deleted_count} old SMS logs (older than {days} days)")
        return {"deleted": deleted_count, "cutoff_date": cutoff_date.isoformat()}
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error cleaning SMS logs: {e}")
        raise


def clean_old_sessions(db: Session, days: int = 30):
    """
    Delete user sessions older than specified days
    Default: 30 days (1 month)
    
    Keeps session table small
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted_count = db.query(UserSession).filter(
            UserSession.login_time < cutoff_date
        ).delete()
        
        db.commit()
        
        logger.info(f"✅ Cleaned {deleted_count} old sessions (older than {days} days)")
        return {"deleted": deleted_count, "cutoff_date": cutoff_date.isoformat()}
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error cleaning sessions: {e}")
        raise


def run_full_cleanup(db: Session):
    """
    Run all cleanup tasks
    
    Recommended: Run once per week
    """
    results = {
        "activity_logs": clean_old_activity_logs(db, days=90),
        "sms_logs": clean_old_sms_logs(db, days=60),
        "sessions": clean_old_sessions(db, days=30),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    total_deleted = sum(r["deleted"] for r in results.values() if isinstance(r, dict))
    
    logger.info(f"✅ Full cleanup completed - {total_deleted} records deleted")
    
    return results

