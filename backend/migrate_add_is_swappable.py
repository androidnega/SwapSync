"""
Migration: Add is_swappable field to phones table
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Add is_swappable column to phones table"""
    engine = create_engine(settings.DATABASE_URL, echo=True)
    inspector = inspect(engine)
    
    # Check if column already exists
    columns = [col['name'] for col in inspector.get_columns('phones')]
    if 'is_swappable' in columns:
        logger.info("✅ is_swappable column already exists, skipping migration")
        return
    
    logger.info("📦 Adding is_swappable column to phones table...")
    
    try:
        with engine.connect() as conn:
            # Add column with default value TRUE
            conn.execute(text("""
                ALTER TABLE phones 
                ADD COLUMN is_swappable BOOLEAN DEFAULT 1 NOT NULL
            """))
            conn.commit()
        
        logger.info("✅ is_swappable column added successfully")
        logger.info("   All existing phones set to swappable by default")
        
    except Exception as e:
        logger.error(f"❌ Error adding is_swappable column: {e}")
        raise


if __name__ == "__main__":
    migrate()
    print("✅ Migration completed successfully")

