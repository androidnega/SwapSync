"""
Invoice Model - For tracking generated invoices/receipts
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Invoice(Base):
    """
    Invoice/Receipt model for swaps and sales
    """
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False, index=True)
    
    # Transaction details
    transaction_type = Column(String, nullable=False)  # 'swap' or 'sale'
    transaction_id = Column(Integer, nullable=False)  # ID of swap or sale
    
    # Customer info
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    
    # Staff info
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    staff_name = Column(String, nullable=True)
    
    # Pricing details
    original_price = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    cash_added = Column(Float, default=0.0)  # For swaps
    final_amount = Column(Float, nullable=False)
    
    # Items
    items_description = Column(Text, nullable=False)  # JSON or text description of items
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", backref="invoices")
    staff = relationship("User", backref="invoices")

    def __repr__(self):
        return f"<Invoice(number={self.invoice_number}, type={self.transaction_type}, amount={self.final_amount})>"
    
    @property
    def formatted_invoice_number(self):
        """Format invoice number for display"""
        return f"INV-{self.invoice_number}"

