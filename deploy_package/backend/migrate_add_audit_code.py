"""
Add audit_code column to users table
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "swapsync.db"

def migrate_database():
    """Add audit_code column"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Adding audit_code to users table...")
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'audit_code' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN audit_code VARCHAR")
        conn.commit()
        print("✅ audit_code column added")
        
        # Generate audit codes for existing CEOs
        cursor.execute("SELECT id FROM users WHERE role = 'ceo'")
        ceo_ids = cursor.fetchall()
        
        if ceo_ids:
            import random
            for (ceo_id,) in ceo_ids:
                audit_code = str(random.randint(100000, 999999))
                cursor.execute("UPDATE users SET audit_code = ? WHERE id = ?", (audit_code, ceo_id))
            conn.commit()
            print(f"✅ Generated audit codes for {len(ceo_ids)} CEOs")
    else:
        print("✓ audit_code column already exists")
    
    conn.close()
    print("\n🎉 Migration complete!")

if __name__ == "__main__":
    migrate_database()

