"""
POS Sale Model - For Point of Sale batch transactions (multiple items in one sale)
"""
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class POSSale(Base):
    """
    POS Sale - main transaction record for multi-item sales
    Acts as a parent record for multiple product_sales
    """
    __tablename__ = "pos_sales"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, nullable=False, index=True)  # e.g., POS-20250120-001
    
    # Customer Info
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)  # Can be null for walk-in
    customer_name = Column(String, nullable=False)  # Store name for walk-ins
    customer_phone = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)
    
    # Transaction Totals
    subtotal = Column(Float, nullable=False)  # Sum of all items before overall discount
    overall_discount = Column(Float, default=0.0)  # Additional discount on entire order
    total_amount = Column(Float, nullable=False)  # Final amount after all discounts
    
    # Transaction Details
    payment_method = Column(String, default="cash")  # cash, card, mobile_money
    items_count = Column(Integer, default=0)  # Number of different products
    total_quantity = Column(Integer, default=0)  # Total quantity of all items
    notes = Column(Text, nullable=True)
    
    # Receipt Tracking
    sms_sent = Column(Integer, default=0)  # 0 = not sent, 1 = sent
    email_sent = Column(Integer, default=0)  # 0 = not sent, 1 = sent
    
    # Tracking
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", backref="pos_sales")
    items = relationship("POSSaleItem", back_populates="pos_sale", cascade="all, delete-orphan")
    created_by = relationship("User", foreign_keys=[created_by_user_id])

    def __repr__(self):
        return f"<POSSale {self.transaction_id}: {self.items_count} items = ₵{self.total_amount}>"
    
    @staticmethod
    def generate_transaction_id(db_session):
        """Generate unique transaction ID in format POS-YYYYMMDD-XXX"""
        from sqlalchemy import func
        today = datetime.utcnow().strftime("%Y%m%d")
        
        # Count transactions today
        today_count = db_session.query(func.count(POSSale.id)).filter(
            POSSale.transaction_id.like(f"POS-{today}-%")
        ).scalar() or 0
        
        return f"POS-{today}-{str(today_count + 1).zfill(3)}"
    
    @property
    def profit(self):
        """Calculate total profit from this POS sale"""
        if self.items:
            return sum(item.profit for item in self.items)
        return 0


class POSSaleItem(Base):
    """
    Individual items in a POS sale
    Links to the parent POS sale and creates corresponding product_sale records
    """
    __tablename__ = "pos_sale_items"

    id = Column(Integer, primary_key=True, index=True)
    pos_sale_id = Column(Integer, ForeignKey("pos_sales.id"), nullable=False)
    product_sale_id = Column(Integer, ForeignKey("product_sales.id"), nullable=True)  # Link to actual sale record
    
    # Product Info (denormalized for quick access)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String, nullable=False)
    product_brand = Column(String, nullable=True)
    
    # Item Details
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    subtotal = Column(Float, nullable=False)  # (unit_price * quantity) - discount_amount
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    pos_sale = relationship("POSSale", back_populates="items")
    product = relationship("Product")
    product_sale = relationship("ProductSale")

    def __repr__(self):
        return f"<POSSaleItem {self.product_name} x{self.quantity} = ₵{self.subtotal}>"
    
    @property
    def profit(self):
        """Calculate profit for this item"""
        if self.product:
            cost = self.product.cost_price * self.quantity
            return self.subtotal - cost
        return 0

