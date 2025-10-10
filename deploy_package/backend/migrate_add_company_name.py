"""
Migration: Add company_name column to users table
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        # Add company_name column
        cursor.execute("""
            ALTER TABLE users ADD COLUMN company_name VARCHAR
        """)
        
        conn.commit()
        print("✅ Migration successful: Added company_name column to users table")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("⚠️ Column company_name already exists, skipping...")
        else:
            print(f"❌ Migration failed: {e}")
            conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

