"""
Migration: Add created_by_user_id to sales table for shop keeper tracking
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    print("🔄 Adding shop keeper tracking to sales...")
    
    try:
        cursor.execute("ALTER TABLE sales ADD COLUMN created_by_user_id INTEGER")
        print("✅ Added created_by_user_id to sales table")
    except Exception as e:
        print(f"⚠️ Column might already exist: {e}")
    
    conn.commit()
    conn.close()
    print("✅ Migration completed!")

if __name__ == "__main__":
    migrate()

