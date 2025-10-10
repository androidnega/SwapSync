"""
Product Schemas - For all inventory items
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ProductBase(BaseModel):
    """Base product schema"""
    name: str = Field(..., min_length=1, max_length=200)
    sku: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    category_id: int
    brand: Optional[str] = Field(None, max_length=100)
    cost_price: float = Field(..., gt=0)
    selling_price: float = Field(..., gt=0)
    discount_price: Optional[float] = Field(None, gt=0)
    quantity: int = Field(default=0, ge=0)
    min_stock_level: int = Field(default=5, ge=0)
    description: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    condition: str = Field(default="New")
    imei: Optional[str] = None  # Only for phones
    is_swappable: bool = Field(default=False)  # True for phones available for swap


class ProductCreate(ProductBase):
    """Schema for creating a new product"""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    sku: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    category_id: Optional[int] = None
    brand: Optional[str] = Field(None, max_length=100)
    cost_price: Optional[float] = Field(None, gt=0)
    selling_price: Optional[float] = Field(None, gt=0)
    discount_price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    condition: Optional[str] = None
    imei: Optional[str] = None
    is_swappable: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    """Schema for product response"""
    id: int
    name: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category_id: int
    brand: Optional[str] = None
    cost_price: float
    selling_price: float
    discount_price: Optional[float] = None
    quantity: int
    min_stock_level: int
    description: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    condition: Optional[str] = "New"
    imei: Optional[str] = None
    is_swappable: Optional[bool] = False
    is_active: bool
    is_available: bool
    created_by_user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    profit_margin: float
    is_low_stock: bool
    is_out_of_stock: bool

    class Config:
        from_attributes = True


class StockAdjustment(BaseModel):
    """Schema for adjusting stock"""
    quantity: int = Field(..., description="Quantity to add (positive) or remove (negative)")
    notes: Optional[str] = Field(None, max_length=500)


class StockMovementBase(BaseModel):
    """Base stock movement schema"""
    product_id: int
    movement_type: str = Field(..., description="purchase, sale, return, adjustment, damage")
    quantity: int
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None


class StockMovementCreate(StockMovementBase):
    """Schema for creating stock movement"""
    pass


class StockMovementResponse(StockMovementBase):
    """Schema for stock movement response"""
    id: int
    created_by_user_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ProductSearchFilters(BaseModel):
    """Schema for product search filters"""
    category_id: Optional[int] = None
    brand: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    condition: Optional[str] = None
    is_swappable: Optional[bool] = None
    in_stock_only: bool = True
    search_query: Optional[str] = None  # Search in name, SKU, brand


class BulkProductUpload(BaseModel):
    """Schema for bulk product upload"""
    products: list[ProductCreate]


class ProductSummary(BaseModel):
    """Summary statistics for products"""
    total_products: int
    total_value: float  # Total inventory value (cost price * quantity)
    total_selling_value: float  # Total value at selling price
    low_stock_count: int
    out_of_stock_count: int
    by_category: Dict[str, int]  # Count by category

