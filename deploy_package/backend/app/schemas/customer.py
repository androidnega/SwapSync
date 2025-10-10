"""
Pydantic schemas for Customer model
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CustomerCreate(BaseModel):
    """Schema for creating a new customer"""
    full_name: str = Field(..., min_length=1, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None


class CustomerUpdate(BaseModel):
    """Schema for updating customer information"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[str] = None


class CustomerResponse(BaseModel):
    """Schema for customer response"""
    id: int
    unique_id: Optional[str] = None
    full_name: str
    phone_number: str
    email: Optional[str] = None
    created_at: datetime
    deletion_code: Optional[str] = None
    code_generated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

