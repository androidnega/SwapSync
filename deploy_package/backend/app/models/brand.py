"""
Brand Model - Phone brands (Samsung, iPhone, Tecno, Huawei, etc.)
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Brand(Base):
    """
    Brand model for phone manufacturers
    Examples: Samsung, Apple, Tecno, Huawei, Infinix, Nokia, etc.
    """
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)  # e.g., "Samsung", "Apple (iPhone)"
    description = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)  # Optional brand logo URL
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    phones = relationship("Phone", back_populates="brand_rel")  # Phones using this brand

    def __repr__(self):
        return f"<Brand(id={self.id}, name={self.name})>"

