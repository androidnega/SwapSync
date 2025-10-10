"""
Product Sale Schemas
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class ProductSaleUser(BaseModel):
    """Nested schema for sale creator info"""
    id: int
    username: str
    full_name: str
    display_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProductSaleBase(BaseModel):
    """Base product sale schema"""
    customer_id: Optional[int] = None  # Optional for walk-in customers
    product_id: int
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., gt=0)
    discount_amount: float = Field(default=0.0, ge=0)
    customer_phone: str = Field(..., min_length=10, max_length=15)
    customer_email: Optional[EmailStr] = None


class ProductSaleCreate(ProductSaleBase):
    """Schema for creating a product sale"""
    pass


class ProductSaleResponse(ProductSaleBase):
    """Schema for product sale response"""
    id: int
    total_amount: float
    sms_sent: int
    email_sent: int
    created_by_user_id: Optional[int]
    created_by: Optional[ProductSaleUser] = None
    created_at: datetime
    updated_at: datetime
    profit: float
    product_name: Optional[str] = None
    product_brand: Optional[str] = None

    class Config:
        from_attributes = True


class ProductSaleSummary(BaseModel):
    """Summary of product sales"""
    total_sales: int
    total_revenue: float
    total_profit: float
    sales_by_product: dict
    sales_by_date: dict

