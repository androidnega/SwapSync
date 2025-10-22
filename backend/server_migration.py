#!/usr/bin/env python3
"""
Server Migration Script
This script can be run directly on the production server to add phone fields
"""
import os
import sys

def run_migration():
    """Run the migration using environment variables"""
    print("🚀 AUTOMATIC PHONE FIELDS MIGRATION")
    print("=" * 40)
    
    # Try to import required modules
    try:
        import psycopg2
        from urllib.parse import urlparse
    except ImportError:
        print("❌ Required modules not found. Installing...")
        os.system("pip install psycopg2-binary")
        try:
            import psycopg2
            from urllib.parse import urlparse
        except ImportError:
            print("❌ Failed to install psycopg2. Please install manually: pip install psycopg2-binary")
            return False
    
    # Get database connection
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        print("Please set DATABASE_URL or run this on the production server")
        return False
    
    try:
        parsed = urlparse(database_url)
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],
            user=parsed.username,
            password=parsed.password
        )
        
        cursor = conn.cursor()
        
        # Check existing columns
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
        
        print("\n✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("The 500 error should now be fixed.")
        print("Products API and POS system should work normally.")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
