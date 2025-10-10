"""
Activity Log Model - Track all user actions for transparency
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class ActivityLog(Base):
    """
    Activity log model - tracks all user actions
    Immutable for transparency and audit trail
    """
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # Description of action
    module = Column(String, nullable=False)  # customers, phones, swaps, sales, repairs
    target_id = Column(Integer, nullable=True)  # ID of affected record
    details = Column(String, nullable=True)  # Additional JSON details
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String, nullable=True)

    # Relationships
    user = relationship("User", backref="activities")

    def __repr__(self):
        return f"<ActivityLog(id={self.id}, user_id={self.user_id}, action={self.action})>"

    @property
    def action_summary(self):
        """Generate human-readable action summary"""
        return f"{self.user.full_name} {self.action} in {self.module}"

