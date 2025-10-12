"""
Pydantic schemas for User model
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=20)  # Required for OTP & password reset
    company_name: Optional[str] = Field(None, max_length=100)  # For Managers
    password: str = Field(..., min_length=6)
    role: str = Field(default="shop_keeper", pattern="^(shop_keeper|repairer|admin|manager|ceo)$")


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, min_length=10, max_length=20)
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    company_name: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = Field(None, pattern="^(shop_keeper|repairer|admin|manager|ceo)$")
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """Schema for user response (no password)"""
    id: int
    unique_id: Optional[str] = None
    username: str
    email: str
    phone_number: Optional[str] = None
    full_name: str
    display_name: Optional[str] = None
    profile_picture: Optional[str] = None
    company_name: Optional[str] = None  # For CEOs
    role: str
    is_active: int
    must_change_password: Optional[int] = None  # For first-login password change
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True  # Convert enums to their values automatically


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    """Schema for token payload"""
    username: Optional[str] = None
    role: Optional[str] = None

