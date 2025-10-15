"""
Migration: Add Repair Items and Repair Item Usage tables
Also adds service_cost and items_cost to repairs table
"""
from app.core.database import engine, SessionLocal
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    """Add repair items tables and update repairs table"""
    db = SessionLocal()
    
    try:
        # Create repair_items table
        logger.info("Creating repair_items table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS repair_items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                cost_price FLOAT NOT NULL,
                selling_price FLOAT NOT NULL,
                stock_quantity INTEGER DEFAULT 0,
                min_stock_level INTEGER DEFAULT 5,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        logger.info("✅ repair_items table created")
        
        # Create repair_items_usage table
        logger.info("Creating repair_items_usage table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS repair_items_usage (
                id SERIAL PRIMARY KEY,
                repair_id INTEGER NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
                repair_item_id INTEGER NOT NULL REFERENCES repair_items(id) ON DELETE RESTRICT,
                quantity INTEGER DEFAULT 1,
                unit_cost FLOAT NOT NULL,
                total_cost FLOAT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        logger.info("✅ repair_items_usage table created")
        
        # Add service_cost and items_cost to repairs table if not exists
        logger.info("Adding service_cost and items_cost to repairs table...")
        try:
            db.execute(text("""
                ALTER TABLE repairs 
                ADD COLUMN IF NOT EXISTS service_cost FLOAT DEFAULT 0.0 NOT NULL,
                ADD COLUMN IF NOT EXISTS items_cost FLOAT DEFAULT 0.0 NOT NULL
            """))
            logger.info("✅ Added service_cost and items_cost columns")
        except Exception as e:
            logger.info(f"Columns may already exist: {e}")
        
        # Update existing repairs to set service_cost = cost and items_cost = 0
        logger.info("Updating existing repairs...")
        db.execute(text("""
            UPDATE repairs 
            SET service_cost = cost, 
                items_cost = 0.0 
            WHERE service_cost IS NULL OR service_cost = 0
        """))
        logger.info("✅ Updated existing repairs")
        
        db.commit()
        logger.info("🎉 Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

