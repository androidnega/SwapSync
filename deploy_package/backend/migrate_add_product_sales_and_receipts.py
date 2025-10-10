"""
Migration: Add product_sales table and add customer contact fields to sales
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        # Create product_sales table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1 NOT NULL,
                unit_price FLOAT NOT NULL,
                discount_amount FLOAT DEFAULT 0.0,
                total_amount FLOAT NOT NULL,
                customer_phone VARCHAR NOT NULL,
                customer_email VARCHAR,
                sms_sent INTEGER DEFAULT 0,
                email_sent INTEGER DEFAULT 0,
                created_by_user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers (id),
                FOREIGN KEY (product_id) REFERENCES products (id),
                FOREIGN KEY (created_by_user_id) REFERENCES users (id)
            )
        """)
        print("✅ Product sales table created successfully")
        
        # Add customer_phone and customer_email to sales table (for phone sales)
        try:
            cursor.execute("ALTER TABLE sales ADD COLUMN customer_phone VARCHAR")
            print("✅ Added customer_phone to sales table")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("ℹ️  customer_phone column already exists in sales table")
            else:
                raise
        
        try:
            cursor.execute("ALTER TABLE sales ADD COLUMN customer_email VARCHAR")
            print("✅ Added customer_email to sales table")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("ℹ️  customer_email column already exists in sales table")
            else:
                raise
        
        try:
            cursor.execute("ALTER TABLE sales ADD COLUMN sms_sent INTEGER DEFAULT 0")
            print("✅ Added sms_sent to sales table")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("ℹ️  sms_sent column already exists in sales table")
            else:
                raise
        
        try:
            cursor.execute("ALTER TABLE sales ADD COLUMN email_sent INTEGER DEFAULT 0")
            print("✅ Added email_sent to sales table")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("ℹ️  email_sent column already exists in sales table")
            else:
                raise
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_sales_customer ON product_sales(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_sales_product ON product_sales(product_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_sales_created ON product_sales(created_at)")
        print("✅ Product sales indexes created successfully")
        
        conn.commit()
        print("\n🎉 Migration completed successfully!")
        print("✅ Product sales table ready")
        print("✅ Sales table updated with customer contact fields")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Running migration: Add product sales and receipt fields...")
    migrate()

