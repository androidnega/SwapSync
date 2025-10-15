"""
Repair Model - Tracks phone repairs and their progress
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import random
from app.core.database import Base


class Repair(Base):
    """
    Repair tracking model
    Manages customer phone repairs, diagnostics, and delivery notifications
    """
    __tablename__ = "repairs"

    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(20), unique=True, nullable=True, index=True, server_default=None)  # REP-0001, REP-0002, etc.
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    customer_name = Column(String, nullable=True)  # For quick booking without customer record
    phone_id = Column(Integer, ForeignKey("phones.id"), nullable=True)  # Link to phone if in inventory
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Repairer assigned
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who created this repair
    
    # Phone and issue details
    phone_description = Column(String, nullable=False)  # e.g., "Samsung Galaxy S21"
    issue_description = Column(String, nullable=False)  # What needs to be fixed
    diagnosis = Column(String, nullable=True)  # Detailed diagnosis/fault type
    
    # Pricing and status
    service_cost = Column(Float, nullable=False, default=0.0)  # Labor/service cost
    items_cost = Column(Float, nullable=False, default=0.0)  # Cost of repair items used
    cost = Column(Float, nullable=False)  # Total repair cost (service_cost + items_cost)
    status = Column(String, default="Pending")  # Pending, In Progress, Completed, Delivered
    
    # Timeline and notifications
    due_date = Column(DateTime, nullable=True)  # When repair should be completed
    notify_at = Column(DateTime, nullable=True)  # When to send notification (24h before due)
    notify_sent = Column(Boolean, default=False)  # Has notification been sent?
    
    # SMS notification tracking
    delivery_notified = Column(Boolean, default=False)  # Has customer been notified?
    
    # Tracking code for easy customer reference
    tracking_code = Column(String(20), unique=True, nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", backref="repairs")
    staff = relationship("User", foreign_keys=[staff_id])
    created_by = relationship("User", foreign_keys=[created_by_user_id])

    def generate_tracking_code(self) -> str:
        """Generate tracking code in format: REP-YYYYMMDD-XXXX"""
        from datetime import datetime
        date_str = datetime.utcnow().strftime("%Y%m%d")
        random_str = ''.join([str(random.randint(0, 9)) for _ in range(4)])
        self.tracking_code = f"REP-{date_str}-{random_str}"
        return self.tracking_code
    
    def generate_unique_id(self, db_session):
        """Generate unique repair ID (REP-0001, REP-0002, etc.)"""
        from sqlalchemy import func
        
        # Count existing repairs
        count = db_session.query(func.count(Repair.id)).scalar() or 0
        self.unique_id = f"REP-{str(count + 1).zfill(4)}"
        return self.unique_id

    def __repr__(self):
        return f"<Repair(id={self.id}, unique_id={self.unique_id or 'N/A'}, tracking={self.tracking_code}, status={self.status}, cost={self.cost})>"

