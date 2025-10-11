"""
Migration: Create sms_config table for encrypted SMS configuration storage
"""
import sys
import os
from sqlalchemy import create_engine, text, inspect

# Don't import from app - might cause circular imports during migration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./swapsync.db")

def migrate():
    """Create sms_config table"""
    print("🔧 [MIGRATION] Creating sms_config table...")
    print(f"🔧 [MIGRATION] Database URL: {DATABASE_URL[:20]}...")
    
    try:
        engine = create_engine(DATABASE_URL, echo=False)
        
        # Check if table already exists
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'sms_config' in tables:
            print("✅ [MIGRATION] Table 'sms_config' already exists, skipping...")
            return
        
        # Create table - PostgreSQL compatible syntax
        with engine.connect() as conn:
            # Detect database type
            is_postgres = "postgresql" in DATABASE_URL.lower()
            
            if is_postgres:
                # PostgreSQL syntax
                conn.execute(text("""
                    CREATE TABLE sms_config (
                        id SERIAL PRIMARY KEY,
                        arkasel_api_key_encrypted TEXT,
                        arkasel_sender_id TEXT DEFAULT 'SwapSync',
                        arkasel_enabled BOOLEAN DEFAULT FALSE,
                        hubtel_client_id_encrypted TEXT,
                        hubtel_client_secret_encrypted TEXT,
                        hubtel_sender_id TEXT DEFAULT 'SwapSync',
                        hubtel_enabled BOOLEAN DEFAULT FALSE,
                        sms_enabled BOOLEAN DEFAULT FALSE,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_by TEXT
                    )
                """))
            else:
                # SQLite syntax
                conn.execute(text("""
                    CREATE TABLE sms_config (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        arkasel_api_key_encrypted TEXT,
                        arkasel_sender_id TEXT DEFAULT 'SwapSync',
                        arkasel_enabled INTEGER DEFAULT 0,
                        hubtel_client_id_encrypted TEXT,
                        hubtel_client_secret_encrypted TEXT,
                        hubtel_sender_id TEXT DEFAULT 'SwapSync',
                        hubtel_enabled INTEGER DEFAULT 0,
                        sms_enabled INTEGER DEFAULT 0,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_by TEXT
                    )
                """))
            
            conn.commit()
            print("✅ [MIGRATION] sms_config table created successfully!")
            print(f"   Database type: {'PostgreSQL' if is_postgres else 'SQLite'}")
            
    except Exception as e:
        error_msg = str(e).lower()
        if "already exists" in error_msg or "duplicate" in error_msg:
            print("✅ [MIGRATION] Table already exists (caught in exception), skipping...")
        else:
            print(f"❌ [MIGRATION] Failed: {e}")
            raise

if __name__ == "__main__":
    try:
        migrate()
        print("✅ [MIGRATION] Script completed successfully")
    except Exception as e:
        print(f"❌ [MIGRATION] Script failed with error: {e}")
        # Don't exit with error code - allow deployment to continue

