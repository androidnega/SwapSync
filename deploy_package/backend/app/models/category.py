"""
Category Model - Product categories (Phones, Earbuds, Chargers, Batteries, etc.)
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Category(Base):
    """
    Category model for organizing all products
    Examples: Phones, Earbuds, Chargers, Batteries, Cases, Screen Protectors
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)  # e.g., "Phones", "Earbuds"
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)  # Icon name for UI
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    phones = relationship("Phone", back_populates="category")  # Backward compatibility
    products = relationship("Product", back_populates="category")  # New products system

    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"

