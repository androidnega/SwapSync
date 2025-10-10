"""
Migration: Add deletion codes to customers, tracking codes to repairs, and profile features to users
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    print("🔄 Starting migration...")
    
    # Add deletion code fields to customers
    try:
        cursor.execute("ALTER TABLE customers ADD COLUMN deletion_code VARCHAR(20)")
        print("✅ Added deletion_code to customers")
    except Exception as e:
        print(f"⚠️ deletion_code might already exist: {e}")
    
    try:
        cursor.execute("ALTER TABLE customers ADD COLUMN code_generated_at TIMESTAMP")
        print("✅ Added code_generated_at to customers")
    except Exception as e:
        print(f"⚠️ code_generated_at might already exist: {e}")
    
    # Add tracking code to repairs
    try:
        cursor.execute("ALTER TABLE repairs ADD COLUMN tracking_code VARCHAR(20)")
        print("✅ Added tracking_code to repairs")
    except Exception as e:
        print(f"⚠️ tracking_code might already exist: {e}")
    
    # Add profile fields to users
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN display_name VARCHAR(255)")
        print("✅ Added display_name to users")
    except Exception as e:
        print(f"⚠️ display_name might already exist: {e}")
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN profile_picture TEXT")
        print("✅ Added profile_picture to users")
    except Exception as e:
        print(f"⚠️ profile_picture might already exist: {e}")
    
    # Add IMEI to swaps
    try:
        cursor.execute("ALTER TABLE swaps ADD COLUMN given_phone_imei VARCHAR(50)")
        print("✅ Added given_phone_imei to swaps")
    except Exception as e:
        print(f"⚠️ given_phone_imei might already exist: {e}")
    
    conn.commit()
    conn.close()
    print("✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
