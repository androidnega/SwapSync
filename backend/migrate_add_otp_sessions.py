"""
Migration: Add OTP Sessions table for SMS-based authentication
"""
import sys
from sqlalchemy import create_engine
from app.core.database import Base
from app.models.otp_session import OTPSession
from app.core.config import settings

def migrate():
    """Create otp_sessions table"""
    print("🔧 Creating OTP Sessions table...")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL, echo=True)
    
    # Create the table
    OTPSession.__table__.create(engine, checkfirst=True)
    
    print("✅ OTP Sessions table created successfully!")
    print(f"📋 Table: {OTPSession.__tablename__}")
    print(f"📋 Columns: id, phone_number, otp_code, user_id, status, created_at, expires_at, verified_at, attempts, max_attempts, ip_address")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

