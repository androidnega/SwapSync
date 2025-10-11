"""
OTP Authentication Routes
SMS-based OTP login for all user types
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models.otp_session import OTPSession
from app.models.user import User
from app.core.auth import create_access_token
from app.core.sms import sms_service

router = APIRouter(prefix="/auth/otp", tags=["OTP Authentication"])


class UserIDValidationRequest(BaseModel):
    user_id: str


class UserIDValidationResponse(BaseModel):
    valid: bool
    has_phone: bool
    message: str


class OTPRequestModel(BaseModel):
    username: str


class OTPVerifyModel(BaseModel):
    username: str
    otp_code: str


class OTPRequestResponse(BaseModel):
    success: bool
    message: str
    phone_number_masked: str
    expires_in: int  # seconds
    session_id: Optional[int] = None


class OTPVerifyResponse(BaseModel):
    success: bool
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[dict] = None
    message: Optional[str] = None


@router.post("/validate-userid", response_model=UserIDValidationResponse)
async def validate_user_id(
    validation_data: UserIDValidationRequest,
    db: Session = Depends(get_db)
):
    """
    Validate if user ID exists and has phone number
    Used for real-time validation during OTP login
    """
    # Check by unique_id or username
    user = db.query(User).filter(
        (User.unique_id == validation_data.user_id) | 
        (User.username == validation_data.user_id)
    ).first()
    
    if not user:
        return UserIDValidationResponse(
            valid=False,
            has_phone=False,
            message="User ID not found"
        )
    
    if not user.phone_number:
        return UserIDValidationResponse(
            valid=True,
            has_phone=False,
            message="No phone number registered. Use password login."
        )
    
    return UserIDValidationResponse(
        valid=True,
        has_phone=True,
        message="User ID validated"
    )


@router.post("/request", response_model=OTPRequestResponse)
async def request_otp(
    request_data: OTPRequestModel,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Request OTP code via SMS
    Sends 4-digit code to user's registered phone number
    """
    # Check if OTP login is enabled
    from app.core.sms import sms_service
    if not sms_service or not sms_service.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OTP login is currently disabled. Please use password login."
        )
    
    # Find user by username
    user = db.query(User).filter(User.username == request_data.username).first()
    
    if not user:
        # Don't reveal if user exists for security
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or phone number not registered"
        )
    
    # Check if user has phone number
    if not user.phone_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No phone number registered for this account. Please use password login."
        )
    
    # Check for recent OTP requests (prevent spam)
    recent_otp = db.query(OTPSession).filter(
        OTPSession.user_id == user.id,
        OTPSession.created_at > datetime.utcnow() - timedelta(minutes=1),
        OTPSession.status == "pending"
    ).first()
    
    if recent_otp and not recent_otp.is_expired():
        return OTPRequestResponse(
            success=True,
            message=f"OTP already sent. Please check your phone or wait {recent_otp.time_remaining()} seconds.",
            phone_number_masked=mask_phone_number(user.phone_number),
            expires_in=recent_otp.time_remaining(),
            session_id=recent_otp.id
        )
    
    # Generate new OTP
    otp_code = OTPSession.generate_otp()
    
    # Create OTP session
    otp_session = OTPSession(
        phone_number=user.phone_number,
        otp_code=otp_code,
        user_id=user.id,
        status="pending",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        ip_address=request.client.host if request.client else None
    )
    db.add(otp_session)
    db.commit()
    db.refresh(otp_session)
    
    # Send SMS
    try:
        company_name = user.company_name or "SwapSync"
        message = f"Your {company_name} login code is: {otp_code}\n\nValid for 5 minutes.\n\nDo not share this code with anyone."
        
        if sms_service and sms_service.enabled:
            sms_result = sms_service.send_sms(
                phone_number=user.phone_number,
                message=message,
                company_name=company_name
            )
            
            if not sms_result.get('success'):
                raise Exception("SMS sending failed")
        else:
            # For testing without SMS service
            print(f"📱 OTP Code (Testing): {otp_code} for {user.phone_number}")
    
    except Exception as e:
        print(f"❌ SMS Error: {e}")
        # Don't fail the request, but log the error
        # In production, you might want to handle this differently
    
    return OTPRequestResponse(
        success=True,
        message=f"OTP code sent to {mask_phone_number(user.phone_number)}",
        phone_number_masked=mask_phone_number(user.phone_number),
        expires_in=300,  # 5 minutes in seconds
        session_id=otp_session.id
    )


@router.post("/verify", response_model=OTPVerifyResponse)
async def verify_otp(
    verify_data: OTPVerifyModel,
    db: Session = Depends(get_db)
):
    """
    Verify OTP code and login user
    Returns access token on success
    """
    # Find user
    user = db.query(User).filter(User.username == verify_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Find active OTP session
    otp_session = db.query(OTPSession).filter(
        OTPSession.user_id == user.id,
        OTPSession.status == "pending"
    ).order_by(OTPSession.created_at.desc()).first()
    
    if not otp_session:
        return OTPVerifyResponse(
            success=False,
            message="No active OTP session. Please request a new code."
        )
    
    # Check expiration
    if otp_session.is_expired():
        otp_session.status = "expired"
        db.commit()
        return OTPVerifyResponse(
            success=False,
            message="OTP code has expired. Please request a new code."
        )
    
    # Check if locked
    if otp_session.is_locked():
        otp_session.status = "failed"
        db.commit()
        return OTPVerifyResponse(
            success=False,
            message="Too many failed attempts. Please request a new code."
        )
    
    # Verify OTP code
    if otp_session.otp_code != verify_data.otp_code:
        otp_session.attempts += 1
        db.commit()
        
        remaining_attempts = otp_session.max_attempts - otp_session.attempts
        
        if remaining_attempts > 0:
            return OTPVerifyResponse(
                success=False,
                message=f"Invalid OTP code. {remaining_attempts} attempt(s) remaining."
            )
        else:
            otp_session.status = "failed"
            db.commit()
            return OTPVerifyResponse(
                success=False,
                message="Too many failed attempts. Please request a new code."
            )
    
    # OTP verified successfully
    otp_session.status = "verified"
    otp_session.verified_at = datetime.utcnow()
    db.commit()
    
    # Generate access token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    
    return OTPVerifyResponse(
        success=True,
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "company_name": user.company_name,
            "phone_number": mask_phone_number(user.phone_number)
        },
        message="Login successful!"
    )


def mask_phone_number(phone: str) -> str:
    """Mask phone number for security (show last 4 digits)"""
    if not phone or len(phone) < 4:
        return "****"
    return f"***{phone[-4:]}"

