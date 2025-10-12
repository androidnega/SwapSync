"""
Add SMS Branding Toggle to Users Table
Allows managers to have SMS sent with their company name instead of SwapSync
"""
from sqlalchemy import create_engine, Column, Integer, text
from app.core.config import settings

def migrate():
    """Add use_company_sms_branding column to users table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            columns = [row[1] for row in result]
            
            if 'use_company_sms_branding' not in columns:
                print("Adding use_company_sms_branding column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN use_company_sms_branding INTEGER DEFAULT 0
                """))
                conn.commit()
                print("✅ Added use_company_sms_branding column (default: 0 = SwapSync branding)")
            else:
                print("✅ Column use_company_sms_branding already exists")
                
        except Exception as e:
            print(f"❌ Migration error: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("\n" + "="*60)
    print("MIGRATION: Add SMS Branding Toggle")
    print("="*60 + "\n")
    migrate()
    print("\n✅ Migration completed successfully!\n")

