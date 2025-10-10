"""
Profile Management API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
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

