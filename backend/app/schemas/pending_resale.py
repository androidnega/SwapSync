"""
Pydantic schemas for Pending Resale model
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PendingResaleCreate(BaseModel):
    """Schema for creating a pending resale record"""
    sold_phone_id: int = Field(..., gt=0)
    sold_phone_brand: str
    sold_phone_model: str
    sold_phone_value: float = Field(..., ge=0)
    sold_phone_status: str = "sold"
    
    incoming_phone_id: Optional[int] = None
    incoming_phone_brand: Optional[str] = None
    incoming_phone_model: Optional[str] = None
    incoming_phone_condition: Optional[str] = None
    incoming_phone_value: Optional[float] = None
    incoming_phone_status: str = "available"
    
    transaction_type: str
    customer_id: int = Field(..., gt=0)
    attending_staff_id: int = Field(..., gt=0)
    
    balance_paid: float = Field(default=0.0, ge=0)
    discount_amount: float = Field(default=0.0, ge=0)
    final_price: float = Field(..., ge=0)
    
    swap_id: Optional[int] = None
    sale_id: Optional[int] = None


class PendingResaleUpdate(BaseModel):
    """Schema for updating pending resale (e.g., marking incoming phone as sold)"""
    incoming_phone_status: Optional[str] = None
    resale_value: Optional[float] = None
    profit_status: Optional[str] = None
    profit_amount: Optional[float] = None


class PendingResaleResponse(BaseModel):
    """Schema for pending resale response"""
    id: int
    unique_id: Optional[str] = None
    
    sold_phone_id: int
    sold_phone_brand: str
    sold_phone_model: str
    sold_phone_value: float
    sold_phone_status: str
    
    incoming_phone_id: Optional[int] = None
    incoming_phone_brand: Optional[str] = None
    incoming_phone_model: Optional[str] = None
    incoming_phone_condition: Optional[str] = None
    incoming_phone_value: Optional[float] = None
    incoming_phone_status: str
    
    transaction_type: str
    customer_id: int
    attending_staff_id: int
    transaction_date: datetime
    
    balance_paid: float
    discount_amount: float
    final_price: float
    
    profit_status: str
    profit_amount: float
    resale_value: float
    
    swap_id: Optional[int] = None
    sale_id: Optional[int] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

