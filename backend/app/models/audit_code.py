"""
AuditCode Model - Short-lived audit codes that auto-expire
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.core.database import Base
import random
import string


class AuditCode(Base):
    """
    Auto-expiring audit codes for secure Manager data access
    Codes expire after 90 seconds
    """
    __tablename__ = "audit_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    auto_generated = Column(Boolean, default=False)
    used = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", backref="audit_codes_history")

    @staticmethod
    def generate_code() -> str:
        """Generate a random 6-character alphanumeric code"""
        return ''.join(random.choices(string.digits, k=6))
    
    @staticmethod
    def calculate_expiry() -> datetime:
        """Calculate expiry time (90 seconds from now)"""
        return datetime.utcnow() + timedelta(seconds=90)
    
    def is_valid(self) -> bool:
        """Check if code is still valid (not expired, not used)"""
        return not self.used and datetime.utcnow() < self.expires_at
    
    def time_remaining(self) -> float:
        """Get seconds remaining before expiry"""
        if not self.is_valid():
            return 0.0
        delta = self.expires_at - datetime.utcnow()
        return max(0.0, delta.total_seconds())

    def __repr__(self):
        return f"<AuditCode(id={self.id}, user_id={self.user_id}, code={self.code}, expires_at={self.expires_at})>"

