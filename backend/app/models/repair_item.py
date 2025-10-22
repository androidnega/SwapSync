from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class RepairItem(Base):
    __tablename__ = "repair_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # e.g., "Screen", "Battery", "Charger Port", etc.
    cost_price = Column(Float, nullable=False)  # What admin paid for it
    selling_price = Column(Float, nullable=False)  # What repairer charges customer
    stock_quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=5)  # Alert when stock is low
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who added this item
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_user_id])

