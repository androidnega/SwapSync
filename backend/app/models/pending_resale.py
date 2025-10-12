"""
Pending Resale Model - Comprehensive tracking for phone resales and swaps
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum
from app.core.database import Base


class TransactionType(PyEnum):
    """Type of resale transaction"""
    SWAP = "swap"
    DIRECT_SALE = "direct_sale"


class PhoneSaleStatus(PyEnum):
    """Status of phone in resale process"""
    AVAILABLE = "available"
    SOLD = "sold"
    LOST = "lost"


class ProfitStatus(PyEnum):
    """Profit status for the transaction"""
    PENDING = "pending"
    PROFIT_MADE = "profit_made"
    LOSS = "loss"


class PendingResale(Base):
    """
    Comprehensive resale tracking model
    Tracks both the sold phone and incoming phone in swap/sale transactions
    """
    __tablename__ = "pending_resales"

    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(20), unique=True, nullable=True, index=True)  # PRSL-0001
    
    # Sold Phone Details (phone given to customer)
    sold_phone_id = Column(Integer, ForeignKey("phones.id"), nullable=False)
    sold_phone_brand = Column(String, nullable=False)
    sold_phone_model = Column(String, nullable=False)
    sold_phone_value = Column(Float, nullable=False)
    sold_phone_status = Column(String, default="sold", nullable=False)  # Sold/Swapped/Paid Fully
    
    # Incoming Phone Details (phone received from customer in swap)
    incoming_phone_id = Column(Integer, ForeignKey("phones.id"), nullable=True)  # Null for direct sales
    incoming_phone_brand = Column(String, nullable=True)
    incoming_phone_model = Column(String, nullable=True)
    incoming_phone_condition = Column(String, nullable=True)
    incoming_phone_value = Column(Float, nullable=True)
    incoming_phone_status = Column(SQLEnum(PhoneSaleStatus), default=PhoneSaleStatus.AVAILABLE)
    
    # Transaction Info
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    attending_staff_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Financial Tracking
    balance_paid = Column(Float, default=0.0)  # Money paid by customer
    discount_amount = Column(Float, default=0.0)
    final_price = Column(Float, nullable=False)  # Final transaction price
    
    # Profit Tracking
    profit_status = Column(SQLEnum(ProfitStatus), default=ProfitStatus.PENDING)
    profit_amount = Column(Float, default=0.0)
    resale_value = Column(Float, default=0.0)  # Value when incoming phone is resold
    
    # Links to original transactions
    swap_id = Column(Integer, ForeignKey("swaps.id"), nullable=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sold_phone = relationship("Phone", foreign_keys=[sold_phone_id])
    incoming_phone = relationship("Phone", foreign_keys=[incoming_phone_id])
    customer = relationship("Customer", backref="pending_resales")
    attending_staff = relationship("User", foreign_keys=[attending_staff_id])
    swap = relationship("Swap", foreign_keys=[swap_id])
    sale = relationship("Sale", foreign_keys=[sale_id])

    def generate_unique_id(self, db_session):
        """Generate unique resale ID in format PRSL-0001"""
        from sqlalchemy import func
        max_id = db_session.query(func.count(PendingResale.id)).scalar() or 0
        self.unique_id = f"PRSL-{str(max_id + 1).zfill(4)}"
        return self.unique_id

    def __repr__(self):
        return f"<PendingResale({self.unique_id or f'#{self.id}'}, {self.transaction_type})>"

