"""
Product/Inventory Model - For all items sold (phones, accessories, etc.)
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Product(Base):
    """
    Universal Product/Inventory model
    Handles: Phones, Earbuds, Chargers, Batteries, Cases, Screen Protectors, etc.
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(20), unique=True, nullable=True, index=True)  # PROD-0001
    
    # Product Identification
    name = Column(String, nullable=False, index=True)  # e.g., "iPhone 13 Pro", "AirPods Pro"
    sku = Column(String, unique=True, nullable=True, index=True)  # Stock Keeping Unit
    barcode = Column(String, unique=True, nullable=True, index=True)  # For scanning
    
    # Categorization
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)  # Phone, Earbuds, Charger, etc.
    brand = Column(String, nullable=True, index=True)  # Apple, Samsung, Anker, etc.
    
    # Pricing
    cost_price = Column(Float, nullable=False)  # What you paid
    selling_price = Column(Float, nullable=False)  # What you sell for
    discount_price = Column(Float, nullable=True)  # Optional discount price
    
    # Inventory
    quantity = Column(Integer, default=0, nullable=False)  # Stock quantity
    min_stock_level = Column(Integer, default=5)  # Alert when stock is low
    
    # Product Details
    description = Column(String, nullable=True)  # Product description
    specs = Column(JSON, nullable=True)  # Technical specifications (flexible JSON)
    condition = Column(String, default="New")  # New, Used, Refurbished
    
    # For Phones specifically (swappable items)
    imei = Column(String, unique=True, nullable=True, index=True)  # Only for phones
    is_phone = Column(Boolean, default=False)  # True if this is a phone product
    is_swappable = Column(Boolean, default=False)  # True for phones available for swap
    phone_condition = Column(String, nullable=True)  # New, Used, Refurbished (for phones)
    phone_specs = Column(JSON, nullable=True)  # Phone-specific specs (CPU, RAM, etc.)
    phone_status = Column(String, default="AVAILABLE")  # AVAILABLE, SOLD, UNDER_REPAIR, etc.
    swapped_from_id = Column(Integer, ForeignKey("swaps.id"), nullable=True)  # If phone came from swap
    current_owner_id = Column(Integer, ForeignKey("customers.id"), nullable=True)  # Current owner
    current_owner_type = Column(String, default="shop")  # shop, customer, repair
    
    # Status
    is_active = Column(Boolean, default=True)  # Active/Inactive
    is_available = Column(Boolean, default=True)  # In stock and available
    
    # Tracking
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("Category", back_populates="products")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    
    def generate_unique_id(self, db_session):
        """Generate unique product ID in format PROD-0001"""
        from sqlalchemy import func
        max_id = db_session.query(func.count(Product.id)).scalar() or 0
        self.unique_id = f"PROD-{str(max_id + 1).zfill(4)}"
        return self.unique_id
    
    def __repr__(self):
        return f"<Product {self.name} - {self.brand} (Stock: {self.quantity})>"
    
    @property
    def profit_margin(self):
        """Calculate profit margin"""
        if self.cost_price > 0:
            return ((self.selling_price - self.cost_price) / self.cost_price) * 100
        return 0
    
    @property
    def is_low_stock(self):
        """Check if stock is below minimum level"""
        return self.quantity <= self.min_stock_level
    
    @property
    def is_out_of_stock(self):
        """Check if out of stock"""
        return self.quantity == 0
    
    def reduce_stock(self, quantity: int = 1):
        """Reduce stock by quantity (for sales)"""
        if self.quantity >= quantity:
            self.quantity -= quantity
            if self.quantity == 0:
                self.is_available = False
        else:
            raise ValueError(f"Insufficient stock. Available: {self.quantity}, Requested: {quantity}")
    
    def add_stock(self, quantity: int = 1):
        """Add stock (for restocking)"""
        self.quantity += quantity
        if self.quantity > 0:
            self.is_available = True
    
    @property
    def is_phone_product(self):
        """Check if this product is a phone"""
        return self.is_phone == True
    
    @property
    def phone_display_name(self):
        """Get display name for phone products"""
        if self.is_phone_product:
            return f"{self.brand} {self.name}" if self.brand else self.name
        return self.name
    
    def mark_as_sold(self, customer_id: int = None):
        """Mark phone as sold (for phone products)"""
        if self.is_phone_product:
            self.phone_status = "SOLD"
            self.is_available = False
            self.quantity = 0
            if customer_id:
                self.current_owner_id = customer_id
                self.current_owner_type = "customer"
    
    def mark_as_available(self):
        """Mark phone as available (for phone products)"""
        if self.is_phone_product:
            self.phone_status = "AVAILABLE"
            self.is_available = True
            self.quantity = 1
            self.current_owner_id = None
            self.current_owner_type = "shop"


class StockMovement(Base):
    """
    Track all stock movements (purchases, sales, returns, adjustments)
    """
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Movement details
    movement_type = Column(String, nullable=False)  # purchase, sale, return, adjustment, damage
    quantity = Column(Integer, nullable=False)  # Positive for in, negative for out
    
    # Pricing (if applicable)
    unit_price = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    
    # Reference
    reference_type = Column(String, nullable=True)  # sale, swap, purchase_order, etc.
    reference_id = Column(Integer, nullable=True)  # ID of related transaction
    
    # Notes
    notes = Column(String, nullable=True)
    
    # Tracking
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product")
    created_by = relationship("User", foreign_keys=[created_by_user_id])

