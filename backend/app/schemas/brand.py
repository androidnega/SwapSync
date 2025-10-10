"""
Brand Schemas - For phone brands management
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BrandBase(BaseModel):
    """Base brand schema"""
    name: str = Field(..., min_length=1, max_length=100, description="Brand name (e.g., Samsung, iPhone, Tecno)")
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = Field(None, max_length=500)


class BrandCreate(BrandBase):
    """Schema for creating a new brand"""
    pass


class BrandUpdate(BaseModel):
    """Schema for updating a brand"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = Field(None, max_length=500)


class BrandResponse(BrandBase):
    """Schema for brand response"""
    id: int
    created_by_user_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

