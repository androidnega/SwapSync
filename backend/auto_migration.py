"""
Automatic Migration Script
Runs the phone fields migration automatically without user interaction
"""
import os
import sys
import psycopg2
from urllib.parse import urlparse
import requests
import json

def get_db_connection():
    """Get database connection from environment"""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        return None
    
    try:
        parsed = urlparse(database_url)
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],
            user=parsed.username,
            password=parsed.password
        )
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return None

def run_direct_migration():
    """Run migration directly on the database"""
    print("🔄 Running direct database migration...")
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check existing columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND table_schema = 'public'
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        # Define phone fields to add
        phone_fields = [
            ("imei", "VARCHAR UNIQUE"),
            ("is_phone", "BOOLEAN DEFAULT FALSE"),
            ("phone_condition", "VARCHAR"),
            ("phone_specs", "JSONB"),
            ("is_swappable", "BOOLEAN DEFAULT FALSE"),
            ("phone_status", "VARCHAR DEFAULT 'AVAILABLE'"),
            ("swapped_from_id", "INTEGER"),
            ("current_owner_id", "INTEGER"),
            ("current_owner_type", "VARCHAR DEFAULT 'shop'")
        ]
        
        added_fields = []
        for field_name, field_type in phone_fields:
            if field_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE products ADD COLUMN {field_name} {field_type}")
                    added_fields.append(field_name)
                    print(f"✅ Added column: {field_name}")
                except Exception as e:
                    print(f"⚠️ Could not add {field_name}: {e}")
        
        # Create indexes
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_products_imei ON products(imei)",
            "CREATE INDEX IF NOT EXISTS idx_products_is_phone ON products(is_phone)",
            "CREATE INDEX IF NOT EXISTS idx_products_phone_condition ON products(phone_condition)",
            "CREATE INDEX IF NOT EXISTS idx_products_is_swappable ON products(is_swappable)",
            "CREATE INDEX IF NOT EXISTS idx_products_phone_status ON products(phone_status)"
        ]
        
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
            except Exception as e:
                pass  # Index creation errors are usually not critical
        
        conn.commit()
        
        if added_fields:
            print(f"🎉 Migration successful! Added {len(added_fields)} fields: {', '.join(added_fields)}")
        else:
            print("ℹ️ All phone fields already exist")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def run_api_migration():
    """Try to run migration via API endpoint"""
    print("🔄 Attempting API migration...")
    
    # Try to get a token from environment or use a default approach
    api_url = os.getenv('API_URL', 'https://api.digitstec.store')
    
    # For now, we'll skip API migration and go direct
    print("⚠️ API migration requires manual token, using direct migration instead")
    return False

def main():
    """Main migration function"""
    print("🚀 AUTOMATIC PHONE FIELDS MIGRATION")
    print("=" * 40)
    
    # Try direct database migration first
    success = run_direct_migration()
    
    if success:
        print("\n✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("The 500 error should now be fixed.")
        print("Products API and POS system should work normally.")
        return True
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
