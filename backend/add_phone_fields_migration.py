"""
Simple migration to add phone fields to products table
This can be run on the live database to add the new phone-specific fields
"""
import sqlite3
import os

def add_phone_fields():
    """Add phone-specific fields to the products table"""
    db_path = 'swapsync.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔄 Adding phone fields to products table...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(products)")
        columns = [column[1] for column in cursor.fetchall()]
        
        phone_fields = [
            ("imei", "VARCHAR UNIQUE"),
            ("is_phone", "BOOLEAN DEFAULT 0"),
            ("phone_condition", "VARCHAR"),
            ("phone_specs", "JSON"),
            ("is_swappable", "BOOLEAN DEFAULT 0"),
            ("phone_status", "VARCHAR DEFAULT 'AVAILABLE'"),
            ("swapped_from_id", "INTEGER"),
            ("current_owner_id", "INTEGER"),
            ("current_owner_type", "VARCHAR DEFAULT 'shop'")
        ]
        
        for field_name, field_type in phone_fields:
            if field_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE products ADD COLUMN {field_name} {field_type}")
                    print(f"✅ Added column: {field_name}")
                except sqlite3.Error as e:
                    print(f"⚠️ Could not add {field_name}: {e}")
            else:
                print(f"ℹ️ Column {field_name} already exists")
        
        # Create indexes for phone fields
        print("📝 Creating indexes for phone fields...")
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
            except sqlite3.Error as e:
                print(f"⚠️ Could not create index: {e}")
        
        conn.commit()
        print("🎉 Phone fields migration completed successfully!")
        
        # Show summary
        cursor.execute("SELECT COUNT(*) FROM products")
        product_count = cursor.fetchone()[0]
        print(f"📊 Total products in database: {product_count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = add_phone_fields()
    if success:
        print("\n✅ Migration completed! The products API should now work correctly.")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
