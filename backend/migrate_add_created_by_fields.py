"""
Migration: Add created_by fields to all major models for audit trail
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        print("🔄 Adding created_by columns to tables...")
        
        tables = [
            'phones',
            'swaps',
            'sales',
            'repairs',
            'invoices'
        ]
        
        added = []
        skipped = []
        
        for table in tables:
            try:
                cursor.execute(f"""
                    ALTER TABLE {table} ADD COLUMN created_by_user_id INTEGER
                """)
                added.append(table)
                print(f"  ✅ Added created_by_user_id to {table}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    skipped.append(table)
                    print(f"  ⚠️ {table} already has created_by_user_id, skipping...")
                else:
                    raise e
        
        conn.commit()
        
        print(f"\n✅ Migration successful!")
        print(f"   - Added to {len(added)} tables: {', '.join(added)}")
        if skipped:
            print(f"   - Skipped {len(skipped)} tables (already had column): {', '.join(skipped)}")
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

