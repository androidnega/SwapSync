"""
Migration: Add pending_resales table for comprehensive resale tracking
"""
import sys
import os

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings
from app.core.database import Base
from app.models.pending_resale import PendingResale
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Add pending_resales table"""
    engine = create_engine(settings.DATABASE_URL, echo=True)
    inspector = inspect(engine)
    
    # Check if table already exists
    if "pending_resales" in inspector.get_table_names():
        logger.info("✅ pending_resales table already exists, skipping migration")
        return
    
    logger.info("📦 Creating pending_resales table...")
    
    try:
        # Create the table using SQLAlchemy
        Base.metadata.tables['pending_resales'].create(engine)
        logger.info("✅ pending_resales table created successfully")
        
    except Exception as e:
        logger.error(f"❌ Error creating pending_resales table: {e}")
        raise


if __name__ == "__main__":
    migrate()
    print("✅ Migration completed successfully")

