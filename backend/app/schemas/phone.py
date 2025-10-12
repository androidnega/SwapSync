"""
Pydantic schemas for Phone model
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class PhoneCreate(BaseModel):
    """Schema for adding a phone to inventory"""
    imei: Optional[str] = None
    brand: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=100)
    condition: str = Field(..., pattern="^(New|Used|Refurbished)$")
    value: float = Field(..., gt=0)
    cost_price: Optional[float] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    specs: Optional[Dict[str, Any]] = None
    is_swappable: bool = True


class PhoneUpdate(BaseModel):
    """Schema for updating phone information"""
    imei: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    condition: Optional[str] = None
    value: Optional[float] = None
    cost_price: Optional[float] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    specs: Optional[Dict[str, Any]] = None
    is_available: Optional[bool] = None
    is_swappable: Optional[bool] = None
    status: Optional[str] = None  # PhoneStatus enum value


class PhoneResponse(BaseModel):
    """Schema for phone response"""
    id: int
    unique_id: Optional[str] = None
    imei: Optional[str] = None
    brand: str
    model: str
    condition: str
    value: float
    cost_price: Optional[float] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    specs: Optional[Dict[str, Any]] = None
    status: str  # PhoneStatus enum value
    is_available: bool
    is_swappable: bool
    swapped_from_id: Optional[int] = None
    created_by_user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    current_owner_id: Optional[int] = None
    current_owner_type: Optional[str] = None

    class Config:
        from_attributes = True

