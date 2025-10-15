from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

