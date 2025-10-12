"""
SMS Broadcasting Routes - Admin Personalized Messages
Send SMS to specific managers/companies or all users
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.core.sms import get_sms_service
from app.core.activity_logger import log_activity

router = APIRouter(prefix="/sms-broadcast", tags=["SMS Broadcasting"])


class SMSBroadcastRequest(BaseModel):
    """Schema for sending broadcast SMS"""
    recipient_ids: List[int]  # User IDs to send to
    message: str
    sender_name: Optional[str] = "SwapSync"  # Override sender name


class SMSBroadcastResponse(BaseModel):
    """Response for SMS broadcast"""
    total_recipients: int
    successful: int
    failed: int
    details: List[dict]


@router.get("/recipients")
def get_available_recipients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of all users who can receive SMS
    Admin can see all managers
    Returns users with phone numbers only
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can access SMS broadcasting"
        )
    
    # Get all managers/users with phone numbers
    users = db.query(User).filter(
        User.phone_number.isnot(None),
        User.phone_number != ''
    ).all()
    
    recipients = []
    for user in users:
        recipients.append({
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "company_name": user.company_name,
            "phone_number": user.phone_number,
            "role": user.role.value,
            "is_manager": user.is_manager,
            "use_company_sms_branding": bool(user.use_company_sms_branding) if hasattr(user, 'use_company_sms_branding') else False
        })
    
    return {
        "total_recipients": len(recipients),
        "recipients": recipients,
        "managers": [r for r in recipients if r["is_manager"]],
        "staff": [r for r in recipients if not r["is_manager"]]
    }


@router.post("/send", response_model=SMSBroadcastResponse)
def send_broadcast_sms(
    broadcast: SMSBroadcastRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send personalized SMS to selected users
    Admin can send to any manager or user
    Uses SwapSync branding (system messages)
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can send broadcast SMS"
        )
    
    if not broadcast.recipient_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No recipients selected"
        )
    
    if not broadcast.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )
    
    # Get SMS service
    sms_service = get_sms_service()
    if not sms_service or not sms_service.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMS service is not configured. Please configure in Settings."
        )
    
    # Get recipients
    recipients = db.query(User).filter(User.id.in_(broadcast.recipient_ids)).all()
    
    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid recipients found"
        )
    
    results = []
    successful = 0
    failed = 0
    
    # Send SMS to each recipient
    for recipient in recipients:
        if not recipient.phone_number:
            results.append({
                "user_id": recipient.id,
                "username": recipient.username,
                "success": False,
                "error": "No phone number"
            })
            failed += 1
            continue
        
        try:
            # System messages always use SwapSync branding
            sms_result = sms_service.send_sms(
                phone_number=recipient.phone_number,
                message=broadcast.message,
                company_name=broadcast.sender_name or "SwapSync"
            )
            
            if sms_result.get('success'):
                successful += 1
                results.append({
                    "user_id": recipient.id,
                    "username": recipient.username,
                    "phone": recipient.phone_number,
                    "success": True,
                    "provider": sms_result.get('provider'),
                    "message_id": sms_result.get('message_id')
                })
            else:
                failed += 1
                results.append({
                    "user_id": recipient.id,
                    "username": recipient.username,
                    "success": False,
                    "error": sms_result.get('error', 'Unknown error')
                })
        except Exception as e:
            failed += 1
            results.append({
                "user_id": recipient.id,
                "username": recipient.username,
                "success": False,
                "error": str(e)
            })
    
    # Log the broadcast
    log_activity(
        db=db,
        user=current_user,
        action="sent broadcast SMS",
        module="sms",
        target_id=len(recipients),
        details=f"Sent to {successful} users: {broadcast.message[:50]}..."
    )
    
    return SMSBroadcastResponse(
        total_recipients=len(recipients),
        successful=successful,
        failed=failed,
        details=results
    )


@router.post("/monthly-wishes")
def send_monthly_wishes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send New Month wishes to all managers
    Called automatically by scheduler or manually by admin
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can send monthly wishes"
        )
    
    # Get current month name
    month_name = datetime.now().strftime("%B %Y")
    
    # Get all managers with phone numbers
    managers = db.query(User).filter(
        User.role.in_([UserRole.MANAGER, UserRole.CEO]),
        User.phone_number.isnot(None),
        User.phone_number != '',
        User.is_active == 1
    ).all()
    
    if not managers:
        return {
            "message": "No managers with phone numbers found",
            "sent": 0
        }
    
    sms_service = get_sms_service()
    if not sms_service or not sms_service.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMS service not configured"
        )
    
    successful = 0
    failed = 0
    
    for manager in managers:
        try:
            message = f"Happy New Month, {manager.full_name}!\n\n"
            message += f"🎉 Welcome to {month_name}!\n\n"
            message += f"Wishing you and {manager.company_name or 'your business'} a successful and prosperous month ahead.\n\n"
            message += f"May this month bring growth, success, and great opportunities!\n\n"
            message += "Best wishes,\nSwapSync Team"
            
            result = sms_service.send_sms(
                phone_number=manager.phone_number,
                message=message,
                company_name="SwapSync"  # System message
            )
            
            if result.get('success'):
                successful += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Failed to send monthly wish to {manager.username}: {e}")
            failed += 1
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"sent monthly wishes to {successful} managers",
        module="sms",
        target_id=successful,
        details=f"Month: {month_name}"
    )
    
    return {
        "message": f"Monthly wishes sent to {successful} managers",
        "month": month_name,
        "sent": successful,
        "failed": failed
    }


# Ghana Public Holidays 2024-2025
GHANA_HOLIDAYS = [
    {"month": 1, "day": 1, "name": "New Year's Day"},
    {"month": 3, "day": 6, "name": "Independence Day"},
    {"month": 3, "day": 29, "name": "Good Friday"},
    {"month": 4, "day": 1, "name": "Easter Monday"},
    {"month": 5, "day": 1, "name": "Workers' Day"},
    {"month": 6, "day": 17, "name": "Eid al-Adha"},  # Islamic calendar - varies
    {"month": 8, "day": 4, "name": "Founders' Day"},
    {"month": 9, "day": 21, "name": "Kwame Nkrumah Memorial Day"},
    {"month": 12, "day": 25, "name": "Christmas Day"},
    {"month": 12, "day": 26, "name": "Boxing Day"},
]


@router.post("/holiday-wishes")
def send_holiday_wishes(
    holiday_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send holiday wishes to all active managers
    Called automatically by scheduler on public holidays
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can send holiday wishes"
        )
    
    # Get all managers with phone numbers
    managers = db.query(User).filter(
        User.role.in_([UserRole.MANAGER, UserRole.CEO]),
        User.phone_number.isnot(None),
        User.phone_number != '',
        User.is_active == 1
    ).all()
    
    if not managers:
        return {
            "message": "No managers with phone numbers found",
            "sent": 0
        }
    
    sms_service = get_sms_service()
    if not sms_service or not sms_service.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMS service not configured"
        )
    
    successful = 0
    failed = 0
    
    for manager in managers:
        try:
            message = f"Happy {holiday_name}!\n\n"
            message += f"Dear {manager.full_name},\n\n"
            message += f"On behalf of the SwapSync Team, we wish you and {manager.company_name or 'your business'} a wonderful {holiday_name}!\n\n"
            message += f"May this special day bring joy, peace, and prosperity to you and your loved ones.\n\n"
            message += "Best wishes,\nSwapSync Team"
            
            result = sms_service.send_sms(
                phone_number=manager.phone_number,
                message=message,
                company_name="SwapSync"  # System message
            )
            
            if result.get('success'):
                successful += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Failed to send holiday wish to {manager.username}: {e}")
            failed += 1
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"sent {holiday_name} wishes to {successful} managers",
        module="sms",
        target_id=successful,
        details=f"Holiday: {holiday_name}"
    )
    
    return {
        "message": f"{holiday_name} wishes sent to {successful} managers",
        "holiday": holiday_name,
        "sent": successful,
        "failed": failed
    }


@router.get("/holidays")
def get_ghana_holidays():
    """
    Get list of Ghana public holidays
    Used for scheduling automated wishes
    """
    return {
        "holidays": GHANA_HOLIDAYS,
        "total": len(GHANA_HOLIDAYS)
    }

