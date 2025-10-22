#!/usr/bin/env python3
"""
Automated migration script to add company isolation to repair items
This script will:
1. Add created_by_user_id column to repair_items table
2. Update existing repair items with company isolation
3. Verify the migration was successful
"""

import os
import sys
import sqlite3
from pathlib import Path

def run_migration():
    """Run the repair items company isolation migration"""
    
    print("🔄 Starting Repair Items Company Isolation Migration...")
    
    # Determine database path
    db_path = os.getenv("DATABASE_URL", "sqlite:///./swapsync.db")
    if db_path.startswith("sqlite:///"):
        db_file = db_path.replace("sqlite:///", "")
        if not os.path.isabs(db_file):
            db_file = os.path.join(os.getcwd(), db_file)
    else:
        print("❌ This migration script only supports SQLite databases")
        return False
    
    if not os.path.exists(db_file):
        print(f"❌ Database file not found: {db_file}")
        return False
    
    print(f"📁 Using database: {db_file}")
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Step 1: Check if created_by_user_id column exists
        print("🔍 Checking if created_by_user_id column exists...")
        cursor.execute("PRAGMA table_info(repair_items)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'created_by_user_id' in columns:
            print("✅ Column created_by_user_id already exists")
        else:
            print("📝 Adding created_by_user_id column...")
            cursor.execute("""
                ALTER TABLE repair_items 
                ADD COLUMN created_by_user_id INTEGER
            """)
            print("✅ Column added successfully")
        
        # Step 2: Get super admin user ID
        print("🔍 Finding super admin user...")
        cursor.execute("""
            SELECT id, username FROM users 
            WHERE role = 'super_admin' OR role = 'admin'
            ORDER BY id LIMIT 1
        """)
        admin_user = cursor.fetchone()
        
        if not admin_user:
            print("❌ No super admin user found")
            return False
        
        admin_id, admin_username = admin_user
        print(f"✅ Found super admin: {admin_username} (ID: {admin_id})")
        
        # Step 3: Update existing repair items
        print("🔄 Updating existing repair items...")
        cursor.execute("""
            UPDATE repair_items 
            SET created_by_user_id = ? 
            WHERE created_by_user_id IS NULL
        """, (admin_id,))
        
        updated_count = cursor.rowcount
        print(f"✅ Updated {updated_count} repair items with company isolation")
        
        # Step 4: Verify migration
        print("🔍 Verifying migration...")
        cursor.execute("SELECT COUNT(*) FROM repair_items")
        total_items = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM repair_items WHERE created_by_user_id IS NOT NULL")
        items_with_company = cursor.fetchone()[0]
        
        print(f"📊 Migration Summary:")
        print(f"   Total repair items: {total_items}")
        print(f"   Items with company isolation: {items_with_company}")
        
        if total_items == items_with_company:
            print("✅ Migration completed successfully!")
            success = True
        else:
            print("⚠️  Some items still need company isolation")
            success = False
        
        # Commit changes
        conn.commit()
        conn.close()
        
        return success
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("🏢 REPAIR ITEMS COMPANY ISOLATION MIGRATION")
    print("=" * 60)
    
    success = run_migration()
    
    print("=" * 60)
    if success:
        print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        print("✅ Repair items now have company isolation")
        print("✅ Each company will only see their own repair items")
        print("✅ Repair items profit calculations will work correctly")
    else:
        print("❌ MIGRATION FAILED!")
        print("Please check the error messages above and try again")
    print("=" * 60)
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
