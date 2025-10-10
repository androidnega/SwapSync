"""
Migration: Create products and stock_movements tables
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        # Create products table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR NOT NULL,
                sku VARCHAR UNIQUE,
                barcode VARCHAR UNIQUE,
                category_id INTEGER NOT NULL,
                brand VARCHAR,
                cost_price FLOAT NOT NULL,
                selling_price FLOAT NOT NULL,
                discount_price FLOAT,
                quantity INTEGER DEFAULT 0 NOT NULL,
                min_stock_level INTEGER DEFAULT 5,
                description TEXT,
                specs JSON,
                condition VARCHAR DEFAULT 'New',
                imei VARCHAR UNIQUE,
                is_swappable BOOLEAN DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                is_available BOOLEAN DEFAULT 1,
                created_by_user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id),
                FOREIGN KEY (created_by_user_id) REFERENCES users (id)
            )
        """)
        print("✅ Products table created successfully")
        
        # Create indexes for products
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_products_imei ON products(imei)")
        print("✅ Products indexes created successfully")
        
        # Create stock_movements table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                movement_type VARCHAR NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price FLOAT,
                total_amount FLOAT,
                reference_type VARCHAR,
                reference_id INTEGER,
                notes TEXT,
                created_by_user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products (id),
                FOREIGN KEY (created_by_user_id) REFERENCES users (id)
            )
        """)
        print("✅ Stock movements table created successfully")
        
        # Create indexes for stock_movements
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at)")
        print("✅ Stock movements indexes created successfully")
        
        # Insert some default product categories if they don't exist
        cursor.execute("SELECT COUNT(*) FROM categories WHERE name IN ('Phone Accessories', 'Chargers', 'Earbuds', 'Batteries', 'Cases', 'Screen Protectors')")
        count = cursor.fetchone()[0]
        
        if count == 0:
            default_categories = [
                ('Phone Accessories', 'General phone accessories'),
                ('Chargers', 'Phone chargers and power adapters'),
                ('Earbuds', 'Earphones and earbuds'),
                ('Batteries', 'Phone batteries and power banks'),
                ('Cases', 'Phone cases and covers'),
                ('Screen Protectors', 'Screen protectors and tempered glass')
            ]
            
            for name, desc in default_categories:
                cursor.execute("""
                    INSERT OR IGNORE INTO categories (name, description, created_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                """, (name, desc))
            
            print("✅ Default product categories created")
        
        conn.commit()
        print("\n🎉 Migration completed successfully!")
        print("✅ Products table ready")
        print("✅ Stock movements table ready")
        print("✅ Default categories added")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Running migration: Create products and stock_movements tables...")
    migrate()

