"""
Authentication routes - Login, Register, User Management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import (
    create_access_token,
    get_current_user,
    get_current_active_admin
)
from app.models.user import User, UserRole
from app.models.user_session import UserSession
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
    UserResponse,
    Token
)
from app.schemas.session import SessionResponse, SessionStats

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register a new user with hierarchy enforcement
    - Super Admin can create CEOs
    - CEO can create Shop Keepers and Repairers
    - Others cannot create users
    """
    # Check role permission
    target_role = UserRole(user_data.role)
    
    if not current_user.can_create_role(target_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to create {target_role.value} users"
        )
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with parent_user_id
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        phone_number=user_data.phone_number,
        full_name=user_data.full_name,
        company_name=user_data.company_name,  # Store company name for CEOs
        hashed_password=User.hash_password(user_data.password),
        role=target_role,
        parent_user_id=current_user.id,  # Track who created this user
        is_active=1,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.flush()
    
    # Generate unique ID based on role
    new_user.generate_unique_id(db)
    db.commit()
    db.refresh(new_user)
    
    # Log the activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created user {new_user.username}",
        module="users",
        target_id=new_user.id,
        details=f"Created {target_role.value} account"
    )
    
    return new_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None, db: Session = Depends(get_db)):
    """
    Login with username and password
    Returns JWT access token
    """
    # Find user by username
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    
    # Create new session
    new_session = UserSession(
        user_id=user.id,
        login_time=datetime.utcnow(),
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Update user's current session
    user.current_session_id = new_session.id
    db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value, "session_id": new_session.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login-json", response_model=Token)
def login_json(credentials: UserLogin, request: Request = None, db: Session = Depends(get_db)):
    """
    Login with JSON body (for frontend compatibility)
    """
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not user.verify_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    
    # Create new session
    new_session = UserSession(
        user_id=user.id,
        login_time=datetime.utcnow(),
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Update user's current session
    user.current_session_id = new_session.id
    db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value, "session_id": new_session.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current logged-in user information
    Includes manager's company name if user is a shopkeeper/repairer
    """
    # If user is a shopkeeper/repairer with a parent (manager), get manager's company name
    if current_user.parent_user_id and not current_user.company_name:
        parent_user = db.query(User).filter(User.id == current_user.parent_user_id).first()
        if parent_user and parent_user.company_name:
            # Temporarily set company name for response
            current_user.company_name = parent_user.company_name
    
    return current_user


@router.get("/users", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    List all users (Admin only)
    """
    users = db.query(User).all()
    return users


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Update user information (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update only provided fields
    for field, value in user_update.model_dump(exclude_unset=True).items():
        if field == "role":
            setattr(user, field, UserRole(value))
        else:
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Delete user (Admin only)
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return None


@router.post("/change-password")
def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change current user's password
    """
    if not current_user.verify_password(current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    current_user.hashed_password = User.hash_password(new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Logout current user and close session
    """
    if current_user.current_session_id:
        session = db.query(UserSession).filter(UserSession.id == current_user.current_session_id).first()
        if session:
            session.logout_time = datetime.utcnow()
            session.calculate_duration()
            current_user.current_session_id = None
            db.commit()
    
    return {"message": "Logged out successfully"}


@router.get("/sessions/{user_id}", response_model=List[SessionResponse])
def get_user_sessions(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all sessions for a user
    - Admin can see all users' sessions
    - Manager can see their staff's sessions
    - Users can only see their own sessions
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Permission check
    if not (current_user.is_admin or 
            current_user.id == user_id or 
            (current_user.is_manager and target_user.parent_user_id == current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user's sessions"
        )
    
    sessions = db.query(UserSession).filter(UserSession.user_id == user_id).order_by(UserSession.login_time.desc()).all()
    return sessions


@router.get("/sessions/{user_id}/stats", response_model=SessionStats)
def get_user_session_stats(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get session statistics for a user
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Permission check
    if not (current_user.is_admin or 
            current_user.id == user_id or 
            (current_user.is_manager and target_user.parent_user_id == current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user's session stats"
        )
    
    sessions = db.query(UserSession).filter(UserSession.user_id == user_id).all()
    total_sessions = len(sessions)
    total_duration = sum(s.session_duration or 0 for s in sessions)
    average_duration = total_duration // total_sessions if total_sessions > 0 else 0
    is_active = target_user.current_session_id is not None
    
    return {
        "total_sessions": total_sessions,
        "total_duration": total_duration,
        "average_duration": average_duration,
        "last_login": target_user.last_login,
        "is_currently_active": is_active
    }


# Password Reset Endpoints
@router.post("/password-reset/request")
def request_password_reset(
    reset_data: PasswordResetRequestSchema,
    db: Session = Depends(get_db)
):
    """
    Request password reset - requires phone number and email verification
    """
    user = db.query(User).filter(User.username == reset_data.username).first()
    if not user:
        # Don't reveal if user exists
        return {"message": "If the information matches, a reset token has been generated"}
    
    # Verify phone and email match
    if user.phone_number != reset_data.phone_number or user.email != reset_data.email:
        # Don't reveal if info doesn't match
        return {"message": "If the information matches, a reset token has been generated"}
    
    # Create reset request
    reset_token = PasswordResetRequest.generate_reset_token()
    reset_request = PasswordResetRequest(
        user_id=user.id,
        reset_token=reset_token,
        phone_number=reset_data.phone_number,
        email=reset_data.email,
        is_verified=True,  # Auto-verify since phone/email matched
        verified_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(hours=24),
        requested_by_role="self"
    )
    db.add(reset_request)
    db.commit()
    
    # Send reset token via SMS
    try:
        from app.core.sms import SMSService
        sms_service = SMSService()
        
        if sms_service.enabled:
            message = f"Your SwapSync password reset code is: {reset_token}. Valid for 24 hours. Do not share this code."
            sms_result = sms_service.send_sms(
                phone_number=reset_data.phone_number,
                message=message,
                sender_id="SwapSync"
            )
            
            if sms_result.get("success"):
                return {
                    "message": "Password reset code sent via SMS. Check your phone.",
                    "expires_in": "24 hours"
                }
            else:
                return {
                    "message": "Password reset token generated but SMS failed. Contact administrator.",
                    "reset_token": reset_token,  # Fallback for development
                    "expires_in": "24 hours"
                }
        else:
            # SMS service not configured
            return {
                "message": "Password reset token generated. SMS service not configured.",
                "reset_token": reset_token,  # Fallback for development
                "expires_in": "24 hours"
            }
    except Exception as e:
        # Fallback if SMS fails
        return {
            "message": "Password reset token generated. SMS service unavailable.",
            "reset_token": reset_token,  # Fallback for development
            "expires_in": "24 hours"
        }


@router.post("/password-reset/complete")
def complete_password_reset(
    reset_data: PasswordResetComplete,
    db: Session = Depends(get_db)
):
    """
    Complete password reset using token
    """
    reset_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.reset_token == reset_data.reset_token
    ).first()
    
    if not reset_request or not reset_request.can_be_used():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password
    user = db.query(User).filter(User.id == reset_request.user_id).first()
    user.hashed_password = User.hash_password(reset_data.new_password)
    
    # Mark reset request as used
    reset_request.is_used = True
    reset_request.used_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/password-reset/admin-generate")
def admin_generate_password(
    data: AdminPasswordGenerate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admin/Manager generates a new password for a user
    - Admin can generate for managers
    - Manager can request admin to generate for their staff
    """
    target_user = db.query(User).filter(User.id == data.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Permission check
    if current_user.is_admin:
        # Admin can generate for managers
        if not target_user.is_manager:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin can only generate passwords for managers"
            )
    elif current_user.is_manager:
        # Manager can request for their staff
        if target_user.parent_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only request password generation for your staff"
            )
        # Create a request that admin needs to approve (for transparency)
        # For now, generate directly but log it
        from app.core.activity_logger import log_activity
        log_activity(
            db=db,
            user=current_user,
            action=f"requested password reset for user {target_user.username}",
            module="users",
            target_id=target_user.id,
            details="Manager requested admin to generate password"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate passwords"
        )
    
    # Generate random password
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits
    new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
    
    # Update password
    target_user.hashed_password = User.hash_password(new_password)
    db.commit()
    
    # Log the activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action=f"generated new password for user {target_user.username}",
        module="users",
        target_id=target_user.id,
        details=f"Password generated by {current_user.role.value}"
    )
    
    return {
        "message": "Password generated successfully",
        "new_password": new_password,  # Send this securely to the user
        "username": target_user.username
    }


@router.post("/admin/change-user-password")
def admin_change_user_password(
    user_id: int,
    new_password: str,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Admin changes any user's password directly
    """
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Change the password
    target_user.hashed_password = User.hash_password(new_password)
    db.commit()
    
    # Log the activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action=f"changed password for user {target_user.username}",
        module="users",
        target_id=target_user.id,
        details=f"Admin {current_user.username} changed password for {target_user.username}"
    )
    
    return {
        "message": f"Password changed successfully for user {target_user.username}",
        "username": target_user.username
    }

