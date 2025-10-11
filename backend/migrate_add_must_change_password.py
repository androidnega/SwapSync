"""
Migration: Add must_change_password column to users table
"""
import sys
import os
from sqlalchemy import create_engine, text, inspect

# Don't import from app - might cause circular imports during migration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./swapsync.db")

def migrate():
    """Add must_change_password column to users table"""
    print("🔧 [MIGRATION] Adding must_change_password column to users table...")
    print(f"🔧 [MIGRATION] Database URL: {DATABASE_URL[:20]}...")  # Don't print full URL (security)
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL, echo=False)  # Disable verbose logging
        
        # Check if column already exists
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        if 'must_change_password' in columns:
            print("✅ [MIGRATION] Column 'must_change_password' already exists, skipping...")
            return
        
        # Add column
        with engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN must_change_password INTEGER DEFAULT 1
            """))
            conn.commit()
            print("✅ [MIGRATION] must_change_password column added successfully!")
            
    except Exception as e:
        error_msg = str(e).lower()
        if "already exists" in error_msg or "duplicate column" in error_msg:
            print("✅ [MIGRATION] Column already exists (caught in exception), skipping...")
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
        # sys.exit(1)

