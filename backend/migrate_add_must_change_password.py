"""
Migration: Add must_change_password column to users table
"""
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    """Add must_change_password column to users table"""
    print("🔧 Adding must_change_password column to users table...")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL, echo=True)
    
    with engine.connect() as conn:
        try:
            # Add column (default 1 = must change password)
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN must_change_password INTEGER DEFAULT 1
            """))
            conn.commit()
            print("✅ must_change_password column added successfully!")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("⚠️ Column already exists, skipping...")
            else:
                raise

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

