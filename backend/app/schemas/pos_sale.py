"""
POS Sale Schemas - For Point of Sale batch transactions
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


class POSItemCreate(BaseModel):
    """Individual item in a POS transaction"""
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    discount_amount: float = Field(default=0.0, ge=0)


class POSSaleCreate(BaseModel):
    """Schema for creating a batch POS sale with multiple items"""
    customer_id: Optional[int] = None  # Optional for walk-in customers
    customer_phone: str = Field(..., min_length=10, max_length=15)
    customer_name: str = Field(..., min_length=1)
    customer_email: Optional[EmailStr] = None
    items: List[POSItemCreate] = Field(..., min_items=1)
    overall_discount: float = Field(default=0.0, ge=0)  # Additional discount on entire order
    payment_method: str = Field(default="cash")  # cash, card, mobile_money
    notes: Optional[str] = None


class POSItemResponse(BaseModel):
    """Individual item in POS sale response"""
    product_id: int
    product_name: str
    product_brand: Optional[str]
    quantity: int
    unit_price: float
    discount_amount: float
    subtotal: float
    
    class Config:
        from_attributes = True


class POSSaleResponse(BaseModel):
    """Schema for POS sale response"""
    id: int
    transaction_id: str  # Unique transaction identifier (e.g., POS-20250120-001)
    customer_id: Optional[int]
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    items: List[POSItemResponse]
    subtotal: float  # Sum of all items before overall discount
    overall_discount: float
    total_amount: float  # Final amount after all discounts
    payment_method: str
    notes: Optional[str]
    items_count: int
    total_quantity: int
    sms_sent: int
    email_sent: int
    created_by_user_id: Optional[int]
    created_by: Optional[dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class POSSaleSummary(BaseModel):
    """Summary of POS sales"""
    total_transactions: int
    total_revenue: float
    total_profit: float
    total_items_sold: int
    average_transaction_value: float
    sales_by_payment_method: dict
    top_selling_products: list

