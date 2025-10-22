"""
Migration: Add phone-specific fields to products table for unified product model
This allows phones to be sold as products in the POS system
"""
import sqlite3
import json
from datetime import datetime

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        print("🔄 Starting unified product model migration...")
        
        # Add phone-specific fields to products table
        print("📝 Adding phone fields to products table...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(products)")
        columns = [column[1] for column in cursor.fetchall()]
        
        phone_fields = [
            ("imei", "VARCHAR UNIQUE"),
            ("is_phone", "BOOLEAN DEFAULT 0"),
            ("phone_condition", "VARCHAR DEFAULT 'New'"),
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
                print(f"✅ Created index: {index_sql.split()[-1]}")
            except sqlite3.Error as e:
                print(f"⚠️ Could not create index: {e}")
        
        # Migrate existing phones to products
        print("📝 Migrating existing phones to products table...")
        
        # Get all phones
        cursor.execute("""
            SELECT id, unique_id, imei, brand, model, category_id, condition, 
                   value, cost_price, specs, status, is_available, is_swappable,
                   swapped_from_id, created_by_user_id, created_at, current_owner_id, current_owner_type
            FROM phones
        """)
        phones = cursor.fetchall()
        
        print(f"📱 Found {len(phones)} phones to migrate...")
        
        migrated_count = 0
        for phone in phones:
            phone_id, unique_id, imei, brand, model, category_id, condition, value, cost_price, specs, status, is_available, is_swappable, swapped_from_id, created_by_user_id, created_at, current_owner_id, current_owner_type = phone
            
            # Check if phone already migrated (by IMEI)
            if imei:
                cursor.execute("SELECT id FROM products WHERE imei = ?", (imei,))
                if cursor.fetchone():
                    print(f"⚠️ Phone with IMEI {imei} already migrated, skipping...")
                    continue
            
            # Create product name
            product_name = f"{brand} {model}"
            
            # Handle specs JSON
            specs_json = None
            if specs:
                try:
                    specs_json = json.dumps(json.loads(specs)) if isinstance(specs, str) else json.dumps(specs)
                except:
                    specs_json = json.dumps({"raw_specs": str(specs)})
            
            # Insert into products table
            cursor.execute("""
                INSERT INTO products (
                    name, sku, barcode, category_id, brand, cost_price, selling_price,
                    quantity, min_stock_level, description, specs, condition,
                    imei, is_phone, phone_condition, phone_specs, is_swappable,
                    phone_status, swapped_from_id, current_owner_id, current_owner_type,
                    is_active, is_available, created_by_user_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                product_name,  # name
                unique_id,     # sku (use phone unique_id)
                None,          # barcode
                category_id,   # category_id
                brand,         # brand
                cost_price or 0,  # cost_price
                value,         # selling_price
                1 if is_available else 0,  # quantity (1 for available phones)
                1,             # min_stock_level
                f"Migrated from phone {unique_id}",  # description
                specs_json,    # specs
                condition,     # condition
                imei,          # imei
                1,             # is_phone
                condition,     # phone_condition
                specs_json,    # phone_specs
                1 if is_swappable else 0,  # is_swappable
                status,        # phone_status
                swapped_from_id,  # swapped_from_id
                current_owner_id,  # current_owner_id
                current_owner_type or 'shop',  # current_owner_type
                1,             # is_active
                1 if is_available else 0,  # is_available
                created_by_user_id,  # created_by_user_id
                created_at,    # created_at
                datetime.utcnow()  # updated_at
            ))
            
            migrated_count += 1
            print(f"✅ Migrated phone: {product_name} (IMEI: {imei or 'N/A'})")
        
        print(f"🎉 Successfully migrated {migrated_count} phones to products table")
        
        # Update product unique_ids for migrated phones
        print("📝 Updating unique_ids for migrated phones...")
        cursor.execute("""
            UPDATE products 
            SET unique_id = 'PROD-' || printf('%04d', id)
            WHERE is_phone = 1 AND (unique_id IS NULL OR unique_id LIKE 'PHON-%')
        """)
        updated_count = cursor.rowcount
        print(f"✅ Updated {updated_count} product unique_ids")
        
        # Create a mapping table for phone_id to product_id (for reference)
        print("📝 Creating phone migration mapping...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS phone_migration_mapping (
                phone_id INTEGER,
                product_id INTEGER,
                migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (phone_id, product_id)
            )
        """)
        
        # Populate mapping table
        cursor.execute("""
            INSERT OR IGNORE INTO phone_migration_mapping (phone_id, product_id)
            SELECT p.id, pr.id
            FROM phones p
            JOIN products pr ON pr.imei = p.imei AND pr.is_phone = 1
        """)
        mapping_count = cursor.rowcount
        print(f"✅ Created {mapping_count} phone-to-product mappings")
        
        conn.commit()
        print("🎉 Unified product model migration completed successfully!")
        
        # Show summary
        cursor.execute("SELECT COUNT(*) FROM products WHERE is_phone = 1")
        phone_products = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM products WHERE is_phone = 0 OR is_phone IS NULL")
        regular_products = cursor.fetchone()[0]
        
        print(f"\n📊 Migration Summary:")
        print(f"   📱 Phone products: {phone_products}")
        print(f"   📦 Regular products: {regular_products}")
        print(f"   📋 Total products: {phone_products + regular_products}")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
