"""
Sale Model - For direct phone purchases (no swap involved)
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Sale(Base):
    """
    Direct sale transaction model
    Customer purchases a phone without trading in an old one
    """
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    phone_id = Column(Integer, ForeignKey("phones.id"), nullable=False)
    
    # Pricing details
    original_price = Column(Float, nullable=False)  # Original phone price
    discount_amount = Column(Float, default=0.0, nullable=False)  # Discount applied
    amount_paid = Column(Float, nullable=False)  # Final amount customer paid (original_price - discount)
    
    # Invoice tracking
    invoice_number = Column(String, nullable=True, unique=True)  # Unique invoice number
    
    # Customer Contact (for receipts)
    customer_phone = Column(String, nullable=True)  # Customer phone for SMS receipt
    customer_email = Column(String, nullable=True)  # Customer email for email receipt
    
    # Receipt Tracking
    sms_sent = Column(Integer, default=0)  # 0 = not sent, 1 = sent
    email_sent = Column(Integer, default=0)  # 0 = not sent, 1 = sent
    
    # Tracking who made the sale
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", backref="sales")
    phone = relationship("Phone", backref="sales")
    created_by = relationship("User", foreign_keys=[created_by_user_id])

    def __repr__(self):
        return f"<Sale(id={self.id}, customer_id={self.customer_id}, phone_id={self.phone_id}, amount={self.amount_paid})>"

