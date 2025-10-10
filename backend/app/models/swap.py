"""
Swap Model - Handles swap transactions between customer and shop with resale tracking
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum
from app.core.database import Base


class ResaleStatus(PyEnum):
    """Resale status for trade-in phones"""
    PENDING = "pending"
    SOLD = "sold"
    SWAPPED_AGAIN = "swapped_again"


class Swap(Base):
    """
    Swap transaction model
    Customer trades in their old phone + money for a new/different phone
    Tracks resale of trade-in phones and calculates profit/loss
    """
    __tablename__ = "swaps"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    # Details about the phone customer is giving
    given_phone_description = Column(String, nullable=False)  # e.g., "iPhone 12 Pro, Good condition"
    given_phone_value = Column(Float, nullable=False)  # Value of the phone being traded in
    given_phone_imei = Column(String(50), nullable=True, index=True)  # IMEI for tracking trade-ins
    
    # The new phone customer is receiving
    new_phone_id = Column(Integer, ForeignKey("phones.id"), nullable=False)
    
    # Additional payment made by customer (new phone value - given phone value)
    balance_paid = Column(Float, nullable=False, default=0.0)
    
    # Discount and final price
    discount_amount = Column(Float, default=0.0, nullable=False)  # Discount applied to the swap
    final_price = Column(Float, nullable=False)  # Final amount customer pays after discount
    
    # Resale tracking for trade-in phone
    resale_status = Column(SQLEnum(ResaleStatus), default=ResaleStatus.PENDING, nullable=False)
    resale_value = Column(Float, default=0.0)  # Amount received when trade-in is resold
    profit_or_loss = Column(Float, default=0.0)  # Final profit/loss for this swap chain
    linked_to_resale_id = Column(Integer, ForeignKey("swaps.id"), nullable=True)  # Links to swap where this phone was resold
    
    # Invoice tracking
    invoice_number = Column(String, nullable=True, unique=True)  # Unique invoice number
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", backref="swaps")
    new_phone = relationship("Phone", foreign_keys=[new_phone_id])
    # Self-referential relationship for resale tracking
    linked_resale = relationship("Swap", remote_side=[id], foreign_keys=[linked_to_resale_id])

    def __repr__(self):
        return f"<Swap(id={self.id}, customer_id={self.customer_id}, balance_paid={self.balance_paid}, status={self.resale_status})>"

    @property
    def total_transaction_value(self):
        """Total value of the swap transaction"""
        return self.given_phone_value + self.balance_paid
    
    @property
    def is_resale_pending(self):
        """Check if trade-in phone is pending resale"""
        return self.resale_status == ResaleStatus.PENDING
    
    @property
    def is_resale_completed(self):
        """Check if trade-in phone has been resold"""
        return self.resale_status in [ResaleStatus.SOLD, ResaleStatus.SWAPPED_AGAIN]

