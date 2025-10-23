"""
Migration: Add repair_sales table to track items used in repairs
This unifies repair items with product inventory
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db_url
from datetime import datetime

def run_migration():
    """Add repair_sales table and ensure products.is_swappable exists"""
    
    db_url = get_db_url()
    engine = create_engine(db_url, echo=True)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("\n" + "="*80)
        print("🔧 MIGRATION: Add repair_sales table")
        print("="*80 + "\n")
        
        # Check if repair_sales table already exists
        result = session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'repair_sales'
            );
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            print("✅ Creating repair_sales table...")
            
            # Create repair_sales table
            session.execute(text("""
                CREATE TABLE repair_sales (
                    id SERIAL PRIMARY KEY,
                    repair_id INTEGER NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
                    product_id INTEGER NOT NULL REFERENCES products(id),
                    repairer_id INTEGER NOT NULL REFERENCES users(id),
                    quantity INTEGER NOT NULL CHECK (quantity > 0),
                    unit_price NUMERIC(12, 2) NOT NULL,
                    cost_price NUMERIC(12, 2) NOT NULL,
                    profit NUMERIC(12, 2) NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            """))
            
            # Add indexes for performance
            session.execute(text("""
                CREATE INDEX idx_repair_sales_repair_id ON repair_sales(repair_id);
                CREATE INDEX idx_repair_sales_product_id ON repair_sales(product_id);
                CREATE INDEX idx_repair_sales_repairer_id ON repair_sales(repairer_id);
                CREATE INDEX idx_repair_sales_created_at ON repair_sales(created_at);
            """))
            
            print("✅ repair_sales table created successfully")
        else:
            print("ℹ️  repair_sales table already exists, skipping...")
        
        # Ensure is_swappable column exists on products table
        print("\n✅ Checking products.is_swappable column...")
        
        result = session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'is_swappable'
            );
        """))
        column_exists = result.scalar()
        
        if not column_exists:
            print("✅ Adding is_swappable column to products...")
            session.execute(text("""
                ALTER TABLE products 
                ADD COLUMN is_swappable BOOLEAN DEFAULT FALSE;
            """))
            print("✅ is_swappable column added")
        else:
            print("ℹ️  is_swappable column already exists")
        
        # Add product_type column if it doesn't exist (optional enhancement)
        result = session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'product_type'
            );
        """))
        product_type_exists = result.scalar()
        
        if not product_type_exists:
            print("\n✅ Adding product_type column to products...")
            session.execute(text("""
                ALTER TABLE products 
                ADD COLUMN product_type VARCHAR(32) DEFAULT 'product';
            """))
            print("✅ product_type column added")
        else:
            print("ℹ️  product_type column already exists")
        
        session.commit()
        
        print("\n" + "="*80)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("="*80 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        session.rollback()
        raise
    finally:
        session.close()
        engine.dispose()

if __name__ == "__main__":
    run_migration()

