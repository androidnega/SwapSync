"""
Migration: Add created_at column to customers table
"""
import sqlite3
from datetime import datetime

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    print("🔄 Adding created_at column to customers table...")
    
    # Add created_at column (nullable initially)
    try:
        cursor.execute("""
            ALTER TABLE customers 
            ADD COLUMN created_at TIMESTAMP
        """)
        print("✅ Added created_at column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  Column created_at already exists")
        else:
            raise
    
    # Update existing records to have current timestamp
    try:
        cursor.execute("""
            UPDATE customers 
            SET created_at = datetime('now') 
            WHERE created_at IS NULL
        """)
        print(f"✅ Updated {cursor.rowcount} existing customer records with created_at")
    except Exception as e:
        print(f"⚠️ Error updating records: {e}")
    
    conn.commit()
    conn.close()
    print("✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()

