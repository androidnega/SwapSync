"""
Pydantic schemas for User Session model
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SessionResponse(BaseModel):
    """Schema for session response"""
    id: int
    user_id: int
    login_time: datetime
    logout_time: Optional[datetime] = None
    session_duration: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True


class SessionStats(BaseModel):
    """Schema for user session statistics"""
    total_sessions: int
    total_duration: int  # in seconds
    average_duration: int  # in seconds
    last_login: Optional[datetime] = None
    is_currently_active: bool


