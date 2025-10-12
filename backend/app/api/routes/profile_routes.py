"""
Profile Management API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.activity_logger import log_activity
from app.models.user import User

router = APIRouter(prefix="/profile", tags=["Profile"])


class ProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    display_name: Optional[str] = None
    profile_picture: Optional[str] = None  # Base64 encoded image


class AccountUpdate(BaseModel):
    """Schema for updating full account details (Manager only)"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    company_name: Optional[str] = None


class PasswordChange(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str
    confirm_password: str


class ProfileResponse(BaseModel):
    """Schema for profile response"""
    id: int
    username: str
    email: str
    phone_number: Optional[str]
    full_name: str
    display_name: Optional[str]
    profile_picture: Optional[str]
    role: str
    company_name: Optional[str]
    
    class Config:
        from_attributes = True


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile"""
    return current_user


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    profile_update: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update current user's profile
    Users can update: display_name, profile_picture
    Users CANNOT update: email, password, phone_number (security)
    """
    # Update only allowed fields
    if profile_update.display_name is not None:
        current_user.display_name = profile_update.display_name.strip()
    
    if profile_update.profile_picture is not None:
        current_user.profile_picture = profile_update.profile_picture
    
    db.commit()
    db.refresh(current_user)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action="updated profile",
        module="profile",
        target_id=current_user.id,
        details=f"Updated display name: {current_user.display_name}"
    )
    
    return current_user


@router.put("/account", response_model=ProfileResponse)
def update_my_account(
    account_update: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update current user's full account details
    Managers can update: username, email, phone_number, full_name, company_name
    This is for the manager's account settings page
    """
    # Check if manager role
    if not current_user.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can update full account details. Use /profile/me for profile updates."
        )
    
    changes = []
    
    # Update username
    if account_update.username is not None and account_update.username != current_user.username:
        # Check if username already exists
        existing = db.query(User).filter(
            User.username == account_update.username,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        changes.append(f"username: {current_user.username} → {account_update.username}")
        current_user.username = account_update.username.strip()
    
    # Update email
    if account_update.email is not None and account_update.email != current_user.email:
        # Check if email already exists
        existing = db.query(User).filter(
            User.email == account_update.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        changes.append(f"email: {current_user.email} → {account_update.email}")
        current_user.email = account_update.email
    
    # Update phone number
    if account_update.phone_number is not None and account_update.phone_number != current_user.phone_number:
        changes.append(f"phone: {current_user.phone_number} → {account_update.phone_number}")
        current_user.phone_number = account_update.phone_number.strip()
    
    # Update full name
    if account_update.full_name is not None and account_update.full_name != current_user.full_name:
        changes.append(f"name: {current_user.full_name} → {account_update.full_name}")
        current_user.full_name = account_update.full_name.strip()
    
    # Update company name
    if account_update.company_name is not None and account_update.company_name != current_user.company_name:
        changes.append(f"company: {current_user.company_name} → {account_update.company_name}")
        current_user.company_name = account_update.company_name.strip()
    
    if not changes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes detected"
        )
    
    db.commit()
    db.refresh(current_user)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action="updated account details",
        module="account",
        target_id=current_user.id,
        details=", ".join(changes)
    )
    
    return current_user


@router.post("/change-password")
def change_my_password(
    password_change: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Change current user's password
    Requires current password for security
    """
    # Verify current password
    if not current_user.verify_password(password_change.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_change.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    # Validate password confirmation
    if password_change.new_password != password_change.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Don't allow same password
    if current_user.verify_password(password_change.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.hashed_password = User.hash_password(password_change.new_password)
    
    db.commit()
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action="changed password",
        module="security",
        target_id=current_user.id,
        details="User changed their own password"
    )
    
    return {
        "message": "Password changed successfully",
        "success": True
    }

