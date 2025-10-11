"""
QR Code Authentication Session Model
Handles secure QR-based login sessions
"""
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timedelta
from app.core.database import Base
import secrets
import string

class QRSession(Base):
    __tablename__ = "qr_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True)  # QR token
    verification_code = Column(String(6), index=True)  # 6-char alphanumeric code
    user_id = Column(Integer, nullable=True)  # User who scanned (null until scanned)
    status = Column(String(20), default="pending")  # pending, scanned, verified, expired
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=2))  # 2 min expiry
    scanned_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    @staticmethod
    def generate_code():
        """
        Generate a 6-character alphanumeric code
        Uses characters that are easy to distinguish (removes 0/O, 1/I/l)
        """
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        return ''.join(secrets.choice(chars) for _ in range(6))

