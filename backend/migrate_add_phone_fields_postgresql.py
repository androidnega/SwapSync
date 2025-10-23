"""
PostgreSQL migration to add phone fields to products table
Run this on Railway PostgreSQL database
"""
import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    """Add phone-specific fields to the products table"""
    try:
        # Get database URL from environment or settings
        database_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL
        
        # Fix Railway's postgres:// to postgresql://
        if database_url and database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        print(f"🔄 Connecting to database...")
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            print("🔄 Adding phone fields to products table...")
            
            # Check if columns already exist
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'products'
            """)
            result = conn.execute(check_query)
            existing_columns = [row[0] for row in result]
            
            # Phone fields to add
            fields_to_add = {
                "imei": "VARCHAR(255) UNIQUE",
                "is_phone": "BOOLEAN DEFAULT FALSE",
                "is_swappable": "BOOLEAN DEFAULT FALSE",
                "phone_condition": "VARCHAR(100)",
                "phone_specs": "JSONB",
                "phone_status": "VARCHAR(50) DEFAULT 'AVAILABLE'",
                "swapped_from_id": "INTEGER",
                "current_owner_id": "INTEGER",
                "current_owner_type": "VARCHAR(20) DEFAULT 'shop'"
            }
            
            # Add each field if it doesn't exist
            for field_name, field_type in fields_to_add.items():
                if field_name not in existing_columns:
                    try:
                        alter_sql = text(f"ALTER TABLE products ADD COLUMN {field_name} {field_type}")
                        conn.execute(alter_sql)
                        conn.commit()
                        print(f"✅ Added column: {field_name}")
                    except Exception as e:
                        print(f"⚠️ Could not add {field_name}: {e}")
                        conn.rollback()
                else:
                    print(f"ℹ️ Column {field_name} already exists")
            
            # Create indexes
            print("📝 Creating indexes for phone fields...")
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_products_imei ON products(imei)",
                "CREATE INDEX IF NOT EXISTS idx_products_is_phone ON products(is_phone)",
                "CREATE INDEX IF NOT EXISTS idx_products_is_swappable ON products(is_swappable)"
            ]
            
            for index_sql in indexes:
                try:
                    conn.execute(text(index_sql))
                    conn.commit()
                    print(f"✅ Created index")
                except Exception as e:
                    print(f"⚠️ Could not create index: {e}")
                    conn.rollback()
            
            # Get product count
            count_result = conn.execute(text("SELECT COUNT(*) FROM products"))
            product_count = count_result.fetchone()[0]
            print(f"📊 Total products in database: {product_count}")
            
        print("🎉 Phone fields migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = migrate()
    if success:
        print("\n✅ Migration completed! The products API should now work correctly.")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")

