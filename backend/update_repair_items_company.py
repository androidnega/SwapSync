#!/usr/bin/env python3
"""
Simple script to update repair items with company isolation
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import SessionLocal
    from app.models.repair_item import RepairItem
    from app.models.user import User, UserRole
    
    def update_repair_items():
        """Update repair items with company isolation"""
        db = SessionLocal()
        
        try:
            print("🔄 Updating repair items with company isolation...")
            
            # Get super admin user
            super_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
            
            if not super_admin:
                print("❌ No super admin found")
                return
            
            # Update all repair items without created_by_user_id
            items = db.query(RepairItem).filter(RepairItem.created_by_user_id.is_(None)).all()
            
            for item in items:
                item.created_by_user_id = super_admin.id
            
            db.commit()
            print(f"✅ Updated {len(items)} repair items with company isolation")
            
            # Verify
            total_items = db.query(RepairItem).count()
            items_with_company = db.query(RepairItem).filter(RepairItem.created_by_user_id.isnot(None)).count()
            
            print(f"📊 Summary: {items_with_company}/{total_items} items have company isolation")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.rollback()
        finally:
            db.close()
    
    if __name__ == "__main__":
        update_repair_items()
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the backend directory")
