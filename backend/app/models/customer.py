"""
Customer Model - Represents shop clients (buyers, swappers, repair customers)
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import random
import string


class Customer(Base):
    """
    Customer model for storing client information
    """
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(20), unique=True, nullable=True, index=True)  # CUST-0001
    full_name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, index=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    created_by_user_id = Column(Integer, nullable=True, server_default=None)  # Who created this customer (for deletion code privacy)
    
    # Security: Dynamic deletion code
    deletion_code = Column(String(20), nullable=True)
    code_generated_at = Column(DateTime, nullable=True)
    
    # Relationships
    product_sales = relationship("ProductSale", back_populates="customer")

    def generate_unique_id(self, db_session):
        """Generate unique customer ID in format CUST-0001"""
        from sqlalchemy import func
        max_id = db_session.query(func.max(Customer.id)).scalar() or 0
        self.unique_id = f"CUST-{str(max_id + 1).zfill(4)}"
        return self.unique_id

    def generate_deletion_code(self):
        """Generate a random 6-character deletion code"""
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        self.deletion_code = f"DEL{code}"
        self.code_generated_at = datetime.utcnow()
        return self.deletion_code

    def __repr__(self):
        return f"<Customer({self.unique_id or f'#{self.id}'}, name={self.full_name})>"

