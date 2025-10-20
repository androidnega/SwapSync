"""
Migration: Add POS (Point of Sale) System Tables
Creates pos_sales and pos_sale_items tables for multi-item transactions
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import SessionLocal, engine

def migrate():
    """Add POS system tables"""
    db = SessionLocal()
    
    try:
        print("🔧 Starting POS system migration...")
        
        # Create pos_sales table
        print("📦 Creating pos_sales table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS pos_sales (
                id SERIAL PRIMARY KEY,
                transaction_id VARCHAR(50) UNIQUE NOT NULL,
                customer_id INTEGER REFERENCES customers(id),
                customer_name VARCHAR NOT NULL,
                customer_phone VARCHAR NOT NULL,
                customer_email VARCHAR,
                subtotal FLOAT NOT NULL,
                overall_discount FLOAT DEFAULT 0.0,
                total_amount FLOAT NOT NULL,
                payment_method VARCHAR DEFAULT 'cash',
                items_count INTEGER DEFAULT 0,
                total_quantity INTEGER DEFAULT 0,
                notes TEXT,
                sms_sent INTEGER DEFAULT 0,
                email_sent INTEGER DEFAULT 0,
                created_by_user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create pos_sale_items table
        print("📦 Creating pos_sale_items table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS pos_sale_items (
                id SERIAL PRIMARY KEY,
                pos_sale_id INTEGER NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
                product_sale_id INTEGER REFERENCES product_sales(id),
                product_id INTEGER NOT NULL REFERENCES products(id),
                product_name VARCHAR NOT NULL,
                product_brand VARCHAR,
                quantity INTEGER NOT NULL,
                unit_price FLOAT NOT NULL,
                discount_amount FLOAT DEFAULT 0.0,
                subtotal FLOAT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create indexes
        print("📇 Creating indexes...")
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pos_sales_transaction_id 
            ON pos_sales(transaction_id)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pos_sales_customer_id 
            ON pos_sales(customer_id)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pos_sales_created_at 
            ON pos_sales(created_at)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pos_sale_items_pos_sale_id 
            ON pos_sale_items(pos_sale_id)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pos_sale_items_product_id 
            ON pos_sale_items(product_id)
        """))
        
        db.commit()
        print("✅ POS system migration completed successfully!")
        print("📊 New tables:")
        print("   - pos_sales (for multi-item transactions)")
        print("   - pos_sale_items (individual items in each transaction)")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)

