"""
Background Scheduler - Automated tasks for repairs, monthly wishes, and holiday greetings
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.repair import Repair
from app.models.user import User, UserRole
import logging
import asyncio

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None

# Ghana Public Holidays (Month, Day)
GHANA_HOLIDAYS = [
    (1, 1, "New Year's Day"),
    (3, 6, "Independence Day"),
    (5, 1, "Workers' Day"),
    (8, 4, "Founders' Day"),
    (9, 21, "Kwame Nkrumah Memorial Day"),
    (12, 25, "Christmas Day"),
    (12, 26, "Boxing Day"),
]


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


def send_monthly_wishes_job():
    """
    Send new month wishes to all active managers
    Runs automatically on 1st of every month at 8:00 AM
    """
    db: Session = SessionLocal()
    
    try:
        from app.core.sms import get_sms_service
        
        month_name = datetime.now().strftime("%B %Y")
        logger.info(f"🎉 Sending New Month wishes for {month_name}")
        
        # Get all active managers with phone numbers
        managers = db.query(User).filter(
            User.role.in_([UserRole.MANAGER, UserRole.CEO]),
            User.phone_number.isnot(None),
            User.phone_number != '',
            User.is_active == 1
        ).all()
        
        if not managers:
            logger.info("No managers found for monthly wishes")
            return
        
        sms_service = get_sms_service()
        if not sms_service or not sms_service.enabled:
            logger.warning("SMS service not configured - skipping monthly wishes")
            return
        
        successful = 0
        for manager in managers:
            try:
                company = manager.company_name or "Your Shop"
                message = f"Happy New Month, {manager.full_name}!\n\n"
                message += f"🎉 Welcome to {month_name}!\n\n"
                message += f"Wishing you and {manager.company_name or 'your business'} a successful and prosperous month ahead.\n\n"
                message += f"May this month bring growth, success, and great opportunities!\n\n"
                message += f"Best wishes,\n{company} Team"
                
                result = sms_service.send_sms(
                    phone_number=manager.phone_number,
                    message=message,
                    company_name=company
                )
                
                if result.get('success'):
                    successful += 1
            except Exception as e:
                logger.error(f"Failed to send monthly wish to {manager.username}: {e}")
        
        logger.info(f"✅ Monthly wishes sent to {successful}/{len(managers)} managers")
        
    except Exception as e:
        logger.error(f"❌ Error sending monthly wishes: {e}")
    finally:
        db.close()


def send_holiday_wishes_job():
    """
    Check if today is a Ghana public holiday and send wishes
    Runs daily at 8:00 AM
    """
    db: Session = SessionLocal()
    
    try:
        from app.core.sms import get_sms_service
        
        today = datetime.now()
        current_month = today.month
        current_day = today.day
        
        # Check if today is a holiday
        holiday_name = None
        for month, day, name in GHANA_HOLIDAYS:
            if month == current_month and day == current_day:
                holiday_name = name
                break
        
        if not holiday_name:
            logger.debug("Today is not a public holiday")
            return
        
        logger.info(f"🎊 Today is {holiday_name}! Sending wishes...")
        
        # Get all active managers with phone numbers
        managers = db.query(User).filter(
            User.role.in_([UserRole.MANAGER, UserRole.CEO]),
            User.phone_number.isnot(None),
            User.phone_number != '',
            User.is_active == 1
        ).all()
        
        if not managers:
            logger.info("No managers found for holiday wishes")
            return
        
        sms_service = get_sms_service()
        if not sms_service or not sms_service.enabled:
            logger.warning("SMS service not configured - skipping holiday wishes")
            return
        
        successful = 0
        for manager in managers:
            try:
                company = manager.company_name or "Your Shop"
                message = f"Happy {holiday_name}!\n\n"
                message += f"Dear {manager.full_name},\n\n"
                message += f"On behalf of the {company} Team, we wish you and {manager.company_name or 'your business'} a wonderful {holiday_name}!\n\n"
                message += f"May this special day bring joy, peace, and prosperity to you and your loved ones.\n\n"
                message += f"Best wishes,\n{company} Team"
                
                result = sms_service.send_sms(
                    phone_number=manager.phone_number,
                    message=message,
                    company_name=company
                )
                
                if result.get('success'):
                    successful += 1
            except Exception as e:
                logger.error(f"Failed to send holiday wish to {manager.username}: {e}")
        
        logger.info(f"✅ {holiday_name} wishes sent to {successful}/{len(managers)} managers")
        
    except Exception as e:
        logger.error(f"❌ Error sending holiday wishes: {e}")
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
    
    # Job 1: Check repairs every minute
    scheduler.add_job(
        func=check_repair_due_dates,
        trigger=IntervalTrigger(minutes=1),
        id='check_repair_due_dates',
        name='Check repair due dates and notify',
        replace_existing=True
    )
    
    # Job 2: Send monthly wishes on 1st of every month at 8:00 AM
    scheduler.add_job(
        func=send_monthly_wishes_job,
        trigger=CronTrigger(day=1, hour=8, minute=0),
        id='monthly_wishes',
        name='Send new month wishes to managers',
        replace_existing=True
    )
    
    # Job 3: Check for holidays daily at 8:00 AM
    scheduler.add_job(
        func=send_holiday_wishes_job,
        trigger=CronTrigger(hour=8, minute=0),
        id='holiday_wishes',
        name='Send holiday wishes on public holidays',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("✅ Background scheduler started:")
    logger.info("   - Checking repairs every 1 minute")
    logger.info("   - Sending monthly wishes on 1st of month at 8:00 AM")
    logger.info("   - Checking for holidays daily at 8:00 AM")


def stop_scheduler():
    """
    Gracefully shut down the scheduler
    """
    global scheduler
    
    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
        logger.info("✅ Background scheduler stopped")

