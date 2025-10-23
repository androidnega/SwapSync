"""
Repair Sale Model - Tracks product items used in repairs
Links repairs to product inventory and captures profit per repairer
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class RepairSale(Base):
    """
    Tracks products used/sold during repairs
    When a repairer uses an item, it's recorded here with stock deduction
    """
    __tablename__ = "repair_sales"

    id = Column(Integer, primary_key=True, index=True)
    
    # Links
    repair_id = Column(Integer, ForeignKey("repairs.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    repairer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Quantities and pricing
    quantity = Column(Integer, nullable=False)  # How many units used
    unit_price = Column(Float, nullable=False)  # Selling price per unit
    cost_price = Column(Float, nullable=False)  # Cost price per unit (from product)
    profit = Column(Float, nullable=False)  # (unit_price - cost_price) * quantity
    
    # Optional notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    repair = relationship("Repair", backref="repair_sales")
    product = relationship("Product", backref="repair_sales")
    repairer = relationship("User", foreign_keys=[repairer_id], backref="repair_sales")
    
    def __repr__(self):
        return f"<RepairSale(id={self.id}, repair_id={self.repair_id}, product_id={self.product_id}, qty={self.quantity}, profit={self.profit})>"
    
    @property
    def total_price(self):
        """Total selling price for this line item"""
        return self.unit_price * self.quantity
    
    @property
    def total_cost(self):
        """Total cost for this line item"""
        return self.cost_price * self.quantity

