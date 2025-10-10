"""
Pydantic schemas for Category model
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CategoryCreate(BaseModel):
    """Schema for creating a category"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class CategoryResponse(BaseModel):
    """Schema for category response"""
    id: int
    name: str
    description: Optional[str] = None
    created_by_user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

