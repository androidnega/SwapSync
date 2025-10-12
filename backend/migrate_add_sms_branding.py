"""
Add SMS Branding Toggle to Users Table
Allows managers to have SMS sent with their company name instead of SwapSync
"""
from sqlalchemy import create_engine, text, inspect
from app.core.config import settings

def migrate():
    """Add use_company_sms_branding column to users table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if column exists (works for both SQLite and PostgreSQL)
            inspector = inspect(engine)
            columns = [col['name'] for col in inspector.get_columns('users')]
            
            if 'use_company_sms_branding' not in columns:
                print("Adding use_company_sms_branding column...")
                
                # Detect database type
                db_url = str(settings.DATABASE_URL)
                if 'postgresql' in db_url or 'postgres' in db_url:
                    # PostgreSQL syntax
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN use_company_sms_branding INTEGER DEFAULT 0
                    """))
                else:
                    # SQLite syntax
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
            import traceback
            traceback.print_exc()
            conn.rollback()
            raise

if __name__ == "__main__":
    print("\n" + "="*60)
    print("MIGRATION: Add SMS Branding Toggle")
    print("="*60 + "\n")
    migrate()
    print("\n✅ Migration completed successfully!\n")

