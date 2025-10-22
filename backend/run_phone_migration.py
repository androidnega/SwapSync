"""
Run phone fields migration on the live database
This script adds the new phone-specific fields to the products table
"""
import sqlite3
import os
import sys

def run_migration():
    """Run the phone fields migration"""
    db_path = 'swapsync.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} not found")
        print("Please make sure you're running this from the backend directory")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔄 Starting phone fields migration...")
        
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
        
        added_fields = []
        for field_name, field_type in phone_fields:
            if field_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE products ADD COLUMN {field_name} {field_type}")
                    added_fields.append(field_name)
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
        
        if added_fields:
            print(f"🎉 Migration completed! Added {len(added_fields)} new fields: {', '.join(added_fields)}")
        else:
            print("ℹ️ All phone fields already exist. No migration needed.")
        
        # Show summary
        cursor.execute("SELECT COUNT(*) FROM products")
        product_count = cursor.fetchone()[0]
        print(f"📊 Total products in database: {product_count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Phone Fields Migration Script")
    print("=" * 40)
    
    success = run_migration()
    
    if success:
        print("\n✅ Migration completed successfully!")
        print("The products API should now work correctly.")
        print("You can now create and manage phone products alongside regular products.")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
        sys.exit(1)