from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class RepairItemUsage(Base):
    __tablename__ = "repair_items_usage"

    id = Column(Integer, primary_key=True, index=True)
    repair_id = Column(Integer, ForeignKey("repairs.id", ondelete="CASCADE"), nullable=False)
    repair_item_id = Column(Integer, ForeignKey("repair_items.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_cost = Column(Float, nullable=False)  # Price at time of use
    total_cost = Column(Float, nullable=False)  # quantity * unit_cost
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    repair = relationship("Repair", backref="items_used")
    repair_item = relationship("RepairItem", backref="usage_history")

