#!/usr/bin/env python3
"""
Create default admin user for SwapSync
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.auth import create_default_admin

def create_admin_user():
    """Create default admin user"""
    print("🔄 Creating default admin user...")
    
    try:
        db = SessionLocal()
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])).first()
        if existing_admin:
            print(f"✅ Admin user already exists: {existing_admin.username}")
            db.close()
            return True
        
        # Create default admin
        create_default_admin(db)
        
        # Verify admin was created
        admin = db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])).first()
        if admin:
            print(f"✅ Admin user created successfully!")
            print(f"   Username: {admin.username}")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role.value}")
            print(f"   Password: admin123 (Please change on first login)")
        else:
            print("❌ Failed to create admin user")
            return False
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False

if __name__ == "__main__":
    create_admin_user()
