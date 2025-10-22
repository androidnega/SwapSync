"""
EMERGENCY MIGRATION SCRIPT
Run this immediately to fix the 500 error by adding missing phone fields
"""
import os
import sys
import psycopg2
from urllib.parse import urlparse

def get_db_connection():
    """Get database connection from environment"""
    # Try to get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        print("Please set DATABASE_URL or run this script with the database connection details")
        return None
    
    try:
        # Parse the database URL
        parsed = urlparse(database_url)
        
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],  # Remove leading slash
            user=parsed.username,
            password=parsed.password
        )
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return None

def run_emergency_migration():
    """Run the emergency migration to add phone fields"""
    print("🚨 EMERGENCY MIGRATION - Adding Phone Fields")
    print("=" * 50)
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND table_schema = 'public'
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        print(f"📊 Found {len(existing_columns)} existing columns in products table")
        
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
                    print(f"➕ Adding column: {field_name}")
                    cursor.execute(f"ALTER TABLE products ADD COLUMN {field_name} {field_type}")
                    added_fields.append(field_name)
                except Exception as e:
                    print(f"⚠️ Could not add {field_name}: {e}")
            else:
                print(f"ℹ️ Column {field_name} already exists")
        
        # Create indexes
        print("📝 Creating indexes...")
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
                print(f"✅ Created index")
            except Exception as e:
                print(f"⚠️ Could not create index: {e}")
        
        conn.commit()
        
        if added_fields:
            print(f"\n🎉 MIGRATION SUCCESSFUL!")
            print(f"✅ Added {len(added_fields)} new fields: {', '.join(added_fields)}")
        else:
            print(f"\nℹ️ All phone fields already exist. No migration needed.")
        
        # Show summary
        cursor.execute("SELECT COUNT(*) FROM products")
        product_count = cursor.fetchone()[0]
        print(f"📊 Total products in database: {product_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚨 EMERGENCY MIGRATION SCRIPT")
    print("This will add the missing phone fields to fix the 500 error")
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        success = run_emergency_migration()
    else:
        confirm = input("Are you sure you want to run the migration? (yes/no): ").lower()
        if confirm in ['yes', 'y']:
            success = run_emergency_migration()
        else:
            print("❌ Migration cancelled")
            success = False
    
    if success:
        print("\n✅ EMERGENCY MIGRATION COMPLETED!")
        print("The 500 error should now be fixed.")
        print("You can now access the products API and POS system normally.")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
        sys.exit(1)
