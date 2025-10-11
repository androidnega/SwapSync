"""
Pydantic schemas for Sale model
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class SaleUser(BaseModel):
    """Nested schema for sale creator info"""
    id: int
    username: str
    full_name: str
    display_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class SaleCreate(BaseModel):
    """Schema for creating a sale"""
    customer_id: int = Field(..., gt=0)
    phone_id: int = Field(..., gt=0)
    original_price: float = Field(..., gt=0)  # Original phone price
    discount_amount: float = Field(default=0.0, ge=0)  # Discount applied
    customer_phone: str = Field(..., min_length=10, max_length=15)  # Required for SMS receipt
    customer_email: Optional[EmailStr] = None  # Optional for email receipt


class SaleResponse(BaseModel):
    """Schema for sale response"""
    id: int
    customer_id: int
    phone_id: int
    original_price: float
    discount_amount: float
    amount_paid: float
    invoice_number: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    sms_sent: int = 0
    email_sent: int = 0
    created_by_user_id: Optional[int] = None
    created_by: Optional[SaleUser] = None
    created_at: datetime

    class Config:
        from_attributes = True

