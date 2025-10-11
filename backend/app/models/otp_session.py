"""
OTP Session Model for SMS-based authentication
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime, timedelta
from app.core.database import Base
import random

class OTPSession(Base):
    __tablename__ = "otp_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), index=True, nullable=False)
    otp_code = Column(String(4), nullable=False)  # 4-digit OTP
    user_id = Column(Integer, nullable=False)  # User requesting OTP
    status = Column(String(20), default="pending")  # pending, verified, expired, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=5))
    verified_at = Column(DateTime, nullable=True)
    attempts = Column(Integer, default=0)  # Track failed attempts
    max_attempts = Column(Integer, default=3)  # Lock after 3 failures
    ip_address = Column(String(45), nullable=True)  # For security logging
    
    @staticmethod
    def generate_otp():
        """Generate a random 4-digit OTP"""
        return ''.join([str(random.randint(0, 9)) for _ in range(4)])
    
    def is_expired(self):
        """Check if OTP has expired"""
        return datetime.utcnow() > self.expires_at
    
    def is_locked(self):
        """Check if OTP is locked due to too many attempts"""
        return self.attempts >= self.max_attempts
    
    def time_remaining(self):
        """Get seconds remaining before expiration"""
        if self.is_expired():
            return 0
        return int((self.expires_at - datetime.utcnow()).total_seconds())

