"""
Add created_by_user_id to Customers Table
Track who created each customer for deletion code privacy
"""
from sqlalchemy import create_engine, text, inspect
from app.core.config import settings

def migrate():
    """Add created_by_user_id column to customers table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if column exists
            inspector = inspect(engine)
            columns = [col['name'] for col in inspector.get_columns('customers')]
            
            if 'created_by_user_id' not in columns:
                print("Adding created_by_user_id column to customers...")
                
                # Add column (works for both SQLite and PostgreSQL)
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN created_by_user_id INTEGER
                """))
                
                conn.commit()
                print("✅ Added created_by_user_id column to customers table")
                print("   This tracks who created each customer for deletion code privacy")
            else:
                print("✅ Column created_by_user_id already exists in customers table")
                
        except Exception as e:
            print(f"❌ Migration error: {e}")
            import traceback
            traceback.print_exc()
            conn.rollback()
            raise

if __name__ == "__main__":
    print("\n" + "="*60)
    print("MIGRATION: Add Customer Creator Tracking")
    print("="*60 + "\n")
    migrate()
    print("\n✅ Migration completed successfully!\n")

