from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RepairItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    cost_price: float = Field(..., gt=0)
    selling_price: float = Field(..., gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    min_stock_level: int = Field(default=5, ge=0)

class RepairItemCreate(RepairItemBase):
    pass

class RepairItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    cost_price: Optional[float] = Field(None, gt=0)
    selling_price: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)

class RepairItemResponse(RepairItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class RepairItemUsageCreate(BaseModel):
    repair_item_id: int
    quantity: int = Field(default=1, gt=0)

class RepairItemUsageResponse(BaseModel):
    id: int
    repair_id: int
    repair_item_id: int
    quantity: int
    unit_cost: float
    total_cost: float
    created_at: datetime
    
    class Config:
        from_attributes = True

