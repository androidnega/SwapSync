"""
Pydantic schemas for Swap model
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SwapCreate(BaseModel):
    """Schema for creating a swap transaction"""
    customer_id: int = Field(..., gt=0)
    given_phone_description: str = Field(..., min_length=1, max_length=200)
    given_phone_value: float = Field(..., ge=0)
    given_phone_imei: Optional[str] = Field(None, max_length=50)  # IMEI for tracking
    new_phone_id: int = Field(..., gt=0)
    balance_paid: float = Field(..., ge=0)
    discount_amount: float = Field(default=0.0, ge=0)  # Discount applied


class SwapResaleUpdate(BaseModel):
    """Schema for updating resale information"""
    resale_value: float = Field(..., gt=0)


class SwapResponse(BaseModel):
    """Schema for swap response"""
    id: int
    customer_id: int
    given_phone_description: str
    given_phone_value: float
    given_phone_imei: Optional[str] = None
    new_phone_id: int
    balance_paid: float
    discount_amount: float
    final_price: float
    resale_status: str
    resale_value: float
    profit_or_loss: float
    linked_to_resale_id: Optional[int] = None
    invoice_number: Optional[str] = None
    created_at: datetime
    total_transaction_value: float

    class Config:
        from_attributes = True

