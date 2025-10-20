"""
Migration: Make customer_id nullable in product_sales table
Allows walk-in customers without customer records in POS sales
"""
from app.core.database import get_db_connection

def migrate():
    """Make customer_id nullable in product_sales"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("🔧 Making customer_id nullable in product_sales table...")
        
        # Alter the column to allow NULL values
        cursor.execute("""
            ALTER TABLE product_sales 
            ALTER COLUMN customer_id DROP NOT NULL;
        """)
        
        conn.commit()
        print("✅ Migration completed: customer_id is now nullable in product_sales")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("🚀 Running migration: Make customer_id nullable in product_sales")
    migrate()
    print("✅ Migration complete!")

