"""
Migration: Add timeline and notification fields to repairs table
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        print("🔄 Adding timeline fields to repairs table...")
        
        fields_to_add = [
            ('customer_name', 'VARCHAR'),
            ('staff_id', 'INTEGER'),
            ('due_date', 'TIMESTAMP'),
            ('notify_at', 'TIMESTAMP'),
            ('notify_sent', 'BOOLEAN DEFAULT 0')
        ]
        
        for field_name, field_type in fields_to_add:
            try:
                cursor.execute(f"""
                    ALTER TABLE repairs ADD COLUMN {field_name} {field_type}
                """)
                print(f"  ✅ Added {field_name} to repairs")
            except sqlite3.OperationalError as e:
                if "duplicate column" in str(e).lower():
                    print(f"  ⚠️ {field_name} already exists, skipping...")
                else:
                    raise e
        
        conn.commit()
        
        print(f"\n✅ Migration successful!")
        print(f"   - Repair timeline fields added")
        print(f"   - Ready for notification system")
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

