"""
Repair Sale Schemas - For product items used in repairs
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RepairSaleBase(BaseModel):
    """Base schema for repair sales"""
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    unit_price: Optional[float] = Field(None, gt=0)  # Optional, will use product's selling_price if not provided
    notes: Optional[str] = Field(None, max_length=500)


class RepairSaleCreate(RepairSaleBase):
    """Schema for adding a product to a repair"""
    pass


class RepairSaleUpdate(BaseModel):
    """Schema for updating a repair sale item"""
    quantity: Optional[int] = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=500)


class RepairSaleResponse(BaseModel):
    """Schema for repair sale response"""
    id: int
    repair_id: int
    product_id: int
    repairer_id: int
    quantity: int
    unit_price: float
    cost_price: float
    profit: float
    total_price: float
    total_cost: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related data
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    repairer_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class RepairerSalesStats(BaseModel):
    """Statistics for items sold by a repairer"""
    repairer_id: int
    repairer_name: str
    items_sold_count: int  # Number of distinct sale records
    total_quantity: int  # Total units sold
    gross_sales: float  # Total revenue
    total_cost: float  # Total cost
    profit: float  # Total profit
    
    class Config:
        from_attributes = True


class RepairerSalesDetail(BaseModel):
    """Detailed breakdown of items sold by a repairer"""
    repairer_id: int
    repairer_name: str
    product_id: int
    product_name: str
    product_sku: Optional[str] = None
    total_quantity: int
    gross_sales: float
    total_cost: float
    profit: float
    sales_count: int  # Number of times this product was used
    
    class Config:
        from_attributes = True

