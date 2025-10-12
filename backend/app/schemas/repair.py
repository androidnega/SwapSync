"""
Pydantic schemas for Repair model
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class RepairCreate(BaseModel):
    """Schema for creating a repair record"""
    customer_id: int = Field(..., gt=0)
    phone_id: Optional[int] = Field(None, gt=0)  # Optional link to phone in inventory
    phone_description: str = Field(..., min_length=1, max_length=200)
    issue_description: str = Field(..., min_length=1, max_length=500)
    diagnosis: Optional[str] = Field(None, max_length=500)
    cost: float = Field(..., gt=0)


class RepairUpdate(BaseModel):
    """Schema for updating repair status"""
    status: Optional[str] = Field(None, pattern="^(Pending|In Progress|Completed|Delivered)$")
    diagnosis: Optional[str] = Field(None, max_length=500)
    delivery_notified: Optional[bool] = None
    cost: Optional[float] = Field(None, gt=0)


class RepairResponse(BaseModel):
    """Schema for repair response"""
    id: int
    unique_id: Optional[str] = None  # REP-0001, REP-0002, etc.
    customer_id: int
    phone_id: Optional[int] = None
    phone_description: str
    issue_description: str
    diagnosis: Optional[str] = None
    cost: float
    status: str
    delivery_notified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

