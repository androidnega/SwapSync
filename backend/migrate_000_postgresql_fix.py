"""
PostgreSQL Compatibility Migration
Fixes all database schema issues for PostgreSQL deployments
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


def column_exists(inspector, table_name, column_name):
    """Check if a column exists in a table"""
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def table_exists(inspector, table_name):
    """Check if a table exists"""
    return inspector.has_table(table_name)


def migrate():
    """Run all PostgreSQL compatibility fixes"""
    engine = create_engine(settings.DATABASE_URL, echo=True)
    inspector = inspect(engine)
    
    logger.info("🔧 Running PostgreSQL compatibility migrations...")
    
    migrations_run = 0
    
    try:
        with engine.connect() as conn:
            
            # Fix: phones.is_swappable
            if table_exists(inspector, 'phones') and not column_exists(inspector, 'phones', 'is_swappable'):
                logger.info("📦 Adding is_swappable to phones...")
                conn.execute(text("""
                    ALTER TABLE phones 
                    ADD COLUMN is_swappable BOOLEAN DEFAULT TRUE NOT NULL
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ phones.is_swappable added")
            
            # Fix: users.must_change_password
            if table_exists(inspector, 'users') and not column_exists(inspector, 'users', 'must_change_password'):
                logger.info("📦 Adding must_change_password to users...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ users.must_change_password added")
            
            # Fix: repairs.notify_sent
            if table_exists(inspector, 'repairs') and not column_exists(inspector, 'repairs', 'notify_sent'):
                logger.info("📦 Adding notify_sent to repairs...")
                conn.execute(text("""
                    ALTER TABLE repairs 
                    ADD COLUMN notify_sent BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ repairs.notify_sent added")
            
            # Fix: users.use_company_sms_branding
            if table_exists(inspector, 'users') and not column_exists(inspector, 'users', 'use_company_sms_branding'):
                logger.info("📦 Adding use_company_sms_branding to users...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN use_company_sms_branding BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ users.use_company_sms_branding added")
            
            # Fix: audit_codes.auto_generated
            if table_exists(inspector, 'audit_codes') and not column_exists(inspector, 'audit_codes', 'auto_generated'):
                logger.info("📦 Adding auto_generated to audit_codes...")
                conn.execute(text("""
                    ALTER TABLE audit_codes 
                    ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ audit_codes.auto_generated added")
            
            # Fix: audit_codes.used
            if table_exists(inspector, 'audit_codes') and not column_exists(inspector, 'audit_codes', 'used'):
                logger.info("📦 Adding used to audit_codes...")
                conn.execute(text("""
                    ALTER TABLE audit_codes 
                    ADD COLUMN used BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ audit_codes.used added")
            
            # Fix: product_sales.sms_sent
            if table_exists(inspector, 'product_sales') and not column_exists(inspector, 'product_sales', 'sms_sent'):
                logger.info("📦 Adding sms_sent to product_sales...")
                conn.execute(text("""
                    ALTER TABLE product_sales 
                    ADD COLUMN sms_sent BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ product_sales.sms_sent added")
            
            # Fix: product_sales.email_sent
            if table_exists(inspector, 'product_sales') and not column_exists(inspector, 'product_sales', 'email_sent'):
                logger.info("📦 Adding email_sent to product_sales...")
                conn.execute(text("""
                    ALTER TABLE product_sales 
                    ADD COLUMN email_sent BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ product_sales.email_sent added")
            
            # Fix: sales.sms_sent
            if table_exists(inspector, 'sales') and not column_exists(inspector, 'sales', 'sms_sent'):
                logger.info("📦 Adding sms_sent to sales...")
                conn.execute(text("""
                    ALTER TABLE sales 
                    ADD COLUMN sms_sent BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ sales.sms_sent added")
            
            # Fix: sales.email_sent
            if table_exists(inspector, 'sales') and not column_exists(inspector, 'sales', 'email_sent'):
                logger.info("📦 Adding email_sent to sales...")
                conn.execute(text("""
                    ALTER TABLE sales 
                    ADD COLUMN email_sent BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                migrations_run += 1
                logger.info("✅ sales.email_sent added")
            
        if migrations_run > 0:
            logger.info(f"✅ PostgreSQL compatibility migration completed! ({migrations_run} changes)")
        else:
            logger.info("✅ All columns already exist, no migrations needed")
        
    except Exception as e:
        logger.error(f"❌ Error during PostgreSQL migration: {e}")
        raise


if __name__ == "__main__":
    migrate()
    print("✅ PostgreSQL compatibility migration completed successfully")

