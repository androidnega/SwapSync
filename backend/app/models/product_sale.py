"""
Product Sale Model - For tracking product (non-phone) sales
"""
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class ProductSale(Base):
    """
    Product Sale - tracks sales of products (earbuds, chargers, etc.)
    Separate from Phone Sales for clarity
    """
    __tablename__ = "product_sales"

    id = Column(Integer, primary_key=True, index=True)
    
    # Customer & Product Info
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)  # Nullable for walk-in customers
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Sale Details
    quantity = Column(Integer, default=1, nullable=False)  # Number of items sold
    unit_price = Column(Float, nullable=False)  # Price per unit
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)  # (unit_price * quantity) - discount
    
    # Customer Contact (for receipts)
    customer_phone = Column(String, nullable=False)  # Required for SMS
    customer_email = Column(String, nullable=True)  # Optional for email receipt
    
    # Receipt Tracking
    sms_sent = Column(Integer, default=0)  # 0 = not sent, 1 = sent
    email_sent = Column(Integer, default=0)  # 0 = not sent, 1 = sent
    
    # Tracking
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="product_sales")
    product = relationship("Product")
    created_by = relationship("User", foreign_keys=[created_by_user_id])

    def __repr__(self):
        return f"<ProductSale {self.id}: {self.quantity}x Product#{self.product_id} = ₵{self.total_amount}>"
    
    @property
    def profit(self):
        """Calculate profit from this sale"""
        if self.product:
            cost = self.product.cost_price * self.quantity
            return self.total_amount - cost
        return 0
    
    @property
    def product_name(self):
        """Get product name from relationship"""
        return self.product.name if self.product else None
    
    @property
    def product_brand(self):
        """Get product brand from relationship"""
        return self.product.brand if self.product else None

