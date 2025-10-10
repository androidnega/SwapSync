"""
Migration: Add phone_number column to users table
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        # Add phone_number column to users table
        cursor.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR")
        print("✅ Added phone_number to users table")
        
        conn.commit()
        print("\n🎉 Migration completed successfully!")
        
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("ℹ️  phone_number column already exists in users table")
        else:
            print(f"❌ Migration failed: {e}")
            conn.rollback()
            raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Running migration: Add phone_number to users table...")
    migrate()

