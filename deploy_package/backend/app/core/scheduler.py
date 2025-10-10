"""
Background Scheduler - Checks for upcoming repair due dates and sends notifications
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.repair import Repair
from app.models.user import User
import logging
import asyncio

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None


def check_repair_due_dates():
    """
    Check for repairs approaching their due date and send notifications
    Runs every minute (configurable)
    """
    db: Session = SessionLocal()
    
    try:
        now = datetime.utcnow()
        notify_threshold = now + timedelta(hours=24)  # Notify 24h before due
        
        # Find repairs that need notification
        repairs_to_notify = db.query(Repair).filter(
            Repair.notify_sent == False,
            Repair.due_date.isnot(None),
            Repair.due_date <= notify_threshold,
            Repair.status.in_(['Pending', 'In Progress'])
        ).all()
        
        if repairs_to_notify:
            logger.info(f"🔔 Found {len(repairs_to_notify)} repair(s) approaching due date")
            
            for repair in repairs_to_notify:
                try:
                    # Get Manager and Repairer IDs
                    manager_id = None
                    repairer_id = repair.staff_id
                    
                    # Find the Manager (owner of the repairer)
                    if repair.created_by_user_id:
                        created_by = db.query(User).filter(User.id == repair.created_by_user_id).first()
                        if created_by:
                            # If created by shopkeeper/repairer, find their manager
                            if created_by.parent_user_id:
                                manager_id = created_by.parent_user_id
                            # If created by manager
                            elif created_by.is_manager:
                                manager_id = created_by.id
                    
                    # Send WebSocket notification
                    from app.core.websocket import manager as ws_manager
                    
                    repair_info = {
                        "repair_id": repair.id,
                        "customer_name": repair.customer_name,
                        "phone_description": repair.phone_description,
                        "due_date": repair.due_date.isoformat() if repair.due_date else None,
                        "cost": float(repair.cost)
                    }
                    
                    # Send notification asynchronously
                    if manager_id:
                        asyncio.create_task(
                            ws_manager.send_personal_message({
                                "type": "repair_due",
                                "message": f"Repair #{repair.id} is due soon!",
                                "data": repair_info
                            }, manager_id)
                        )
                    
                    if repairer_id:
                        asyncio.create_task(
                            ws_manager.send_personal_message({
                                "type": "repair_due",
                                "message": f"Your repair #{repair.id} is due soon!",
                                "data": repair_info
                            }, repairer_id)
                        )
                    
                    # Mark as notified
                    repair.notify_sent = True
                    repair.notify_at = now
                    
                    logger.info(f"  ✅ Notified for Repair ID:{repair.id} (Due: {repair.due_date})")
                    
                except Exception as e:
                    logger.error(f"  ❌ Failed to notify for Repair ID:{repair.id}: {e}")
            
            db.commit()
            logger.info(f"✅ Notification check complete - {len(repairs_to_notify)} processed")
        else:
            logger.debug("ℹ️ No repairs need notification at this time")
        
    except Exception as e:
        logger.error(f"❌ Error in check_repair_due_dates: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """
    Initialize and start the background scheduler
    """
    global scheduler
    
    if scheduler is not None:
        logger.warning("Scheduler already running")
        return
    
    scheduler = BackgroundScheduler()
    
    # Add job: check repairs every minute
    scheduler.add_job(
        func=check_repair_due_dates,
        trigger=IntervalTrigger(minutes=1),  # Check every 1 minute (configurable)
        id='check_repair_due_dates',
        name='Check repair due dates and notify',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("✅ Background scheduler started - checking repairs every 1 minute")


def stop_scheduler():
    """
    Gracefully shut down the scheduler
    """
    global scheduler
    
    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
        logger.info("✅ Background scheduler stopped")

