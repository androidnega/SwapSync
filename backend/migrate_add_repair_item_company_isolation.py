#!/usr/bin/env python3
"""
Migration: Add company isolation to repair items
Adds created_by_user_id field to repair_items table and assigns existing items to super admin
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.database import get_db
from app.models.repair_item import RepairItem
from app.models.user import User, UserRole

def migrate_repair_items_company_isolation():
    """Add company isolation to repair items"""
    
    # Get database URL from environment or use default
    database_url = os.getenv("DATABASE_URL", "sqlite:///./swapsync.db")
    
    # Create engine and session
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("🔄 Starting repair items company isolation migration...")
        
        # Check if created_by_user_id column exists
        result = db.execute(text("""
            SELECT COUNT(*) as count 
            FROM pragma_table_info('repair_items') 
            WHERE name = 'created_by_user_id'
        """)).fetchone()
        
        if result.count == 0:
            print("📝 Adding created_by_user_id column to repair_items table...")
            db.execute(text("""
                ALTER TABLE repair_items 
                ADD COLUMN created_by_user_id INTEGER REFERENCES users(id)
            """))
            db.commit()
            print("✅ Column added successfully")
        else:
            print("✅ Column already exists")
        
        # Get super admin user (first admin found)
        super_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        
        if not super_admin:
            print("❌ No super admin found. Creating one...")
            # Create a default super admin
            super_admin = User(
                username="admin",
                email="admin@swapsync.com",
                full_name="System Administrator",
                hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K8K8K8",  # password: admin123
                role=UserRole.SUPER_ADMIN,
                is_active=1
            )
            db.add(super_admin)
            db.commit()
            db.refresh(super_admin)
            print(f"✅ Created super admin: {super_admin.username}")
        
        # Update all repair items without created_by_user_id
        items_updated = db.execute(text("""
            UPDATE repair_items 
            SET created_by_user_id = :admin_id 
            WHERE created_by_user_id IS NULL
        """), {"admin_id": super_admin.id}).rowcount
        
        print(f"✅ Updated {items_updated} repair items with company isolation")
        
        # Verify the migration
        total_items = db.query(RepairItem).count()
        items_with_company = db.query(RepairItem).filter(RepairItem.created_by_user_id.isnot(None)).count()
        
        print(f"📊 Migration Summary:")
        print(f"   Total repair items: {total_items}")
        print(f"   Items with company isolation: {items_with_company}")
        
        if total_items == items_with_company:
            print("✅ Migration completed successfully!")
        else:
            print("⚠️  Some items still need company isolation")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_repair_items_company_isolation()
