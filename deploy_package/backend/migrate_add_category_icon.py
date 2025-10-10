"""
Migration: Add icon column to categories table
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        print("🔄 Adding icon column to categories table...")
        
        # Add icon column
        try:
            cursor.execute("""
                ALTER TABLE categories ADD COLUMN icon VARCHAR
            """)
            print("  ✅ Added icon column to categories")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("  ⚠️ icon column already exists in categories")
            else:
                raise
        
        conn.commit()
        print(f"\n✅ Migration successful!")
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

