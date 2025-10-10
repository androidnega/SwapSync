"""
Phone Model - Represents phones in inventory (new or used)
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum as SQLEnum, DateTime, JSON
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from datetime import datetime
from app.core.database import Base


class PhoneStatus(PyEnum):
    """Phone status tracking"""
    AVAILABLE = "AVAILABLE"
    SWAPPED = "SWAPPED"
    SOLD = "SOLD"
    UNDER_REPAIR = "UNDER_REPAIR"


class Phone(Base):
    """
    Phone inventory model
    Tracks phones available for sale or received through swaps
    """
    __tablename__ = "phones"

    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(20), unique=True, nullable=True, index=True)  # PHON-0001
    imei = Column(String, unique=True, nullable=True, index=True)  # Unique IMEI number
    brand = Column(String, nullable=False)  # Brand name (backward compatibility)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)  # Brand FK (new)
    model = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    condition = Column(String, nullable=False)  # e.g., "New", "Used", "Refurbished"
    value = Column(Float, nullable=False)  # Current market value
    cost_price = Column(Float, nullable=True)  # What we paid for it
    specs = Column(JSON, nullable=True)  # JSON: {"cpu": "...", "ram": "...", "storage": "...", "battery": "...", "color": "..."}
    status = Column(SQLEnum(PhoneStatus), default=PhoneStatus.AVAILABLE, nullable=False)
    is_available = Column(Boolean, default=True)  # Legacy field, kept for compatibility
    swapped_from_id = Column(Integer, ForeignKey("swaps.id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who added this phone
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Ownership tracking
    current_owner_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    current_owner_type = Column(String, default="shop")  # 'shop', 'customer', 'repair'

    # Relationships
    category = relationship("Category", back_populates="phones")
    brand_rel = relationship("Brand", back_populates="phones")  # Brand relationship
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    current_owner = relationship("Customer", foreign_keys=[current_owner_id], backref="owned_phones")

    def generate_unique_id(self, db_session):
        """Generate unique phone ID in format PHON-0001"""
        from sqlalchemy import func
        max_id = db_session.query(func.count(Phone.id)).scalar() or 0
        self.unique_id = f"PHON-{str(max_id + 1).zfill(4)}"
        return self.unique_id

    def __repr__(self):
        return f"<Phone({self.unique_id or f'#{self.id}'}, {self.brand} {self.model})>"


class PhoneOwnershipHistory(Base):
    """
    Track phone ownership changes over time
    """
    __tablename__ = "phone_ownership_history"

    id = Column(Integer, primary_key=True, index=True)
    phone_id = Column(Integer, ForeignKey("phones.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    owner_type = Column(String, nullable=False)  # 'shop', 'customer', 'repair'
    change_reason = Column(String, nullable=True)  # 'sale', 'swap', 'repair', 'returned'
    transaction_id = Column(Integer, nullable=True)  # ID of swap/sale/repair
    change_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    phone = relationship("Phone", backref="ownership_history")
    owner = relationship("Customer", foreign_keys=[owner_id])

    def __repr__(self):
        return f"<PhoneOwnershipHistory(phone_id={self.phone_id}, owner_type={self.owner_type}, date={self.change_date})>"

