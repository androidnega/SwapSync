"""
Add unique_id to Repairs Table
For easy tracking and customer reference (REP-0001, REP-0002, etc.)
"""
from sqlalchemy import create_engine, text, inspect
from app.core.config import settings

def migrate():
    """Add unique_id column to repairs table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if column exists (works for both SQLite and PostgreSQL)
            inspector = inspect(engine)
            columns = [col['name'] for col in inspector.get_columns('repairs')]
            
            if 'unique_id' not in columns:
                print("Adding unique_id column to repairs...")
                
                # Add column (works for both SQLite and PostgreSQL)
                conn.execute(text("""
                    ALTER TABLE repairs 
                    ADD COLUMN unique_id VARCHAR(20)
                """))
                
                conn.commit()
                print("✅ Added unique_id column to repairs table")
                
                # Generate unique_ids for existing repairs
                print("Generating unique IDs for existing repairs...")
                result = conn.execute(text("SELECT id FROM repairs ORDER BY id")).fetchall()
                
                for index, row in enumerate(result, start=1):
                    repair_id = row[0]
                    unique_id = f"REP-{str(index).zfill(4)}"
                    conn.execute(
                        text("UPDATE repairs SET unique_id = :uid WHERE id = :rid"),
                        {"uid": unique_id, "rid": repair_id}
                    )
                
                conn.commit()
                print(f"✅ Generated {len(result)} unique IDs for existing repairs")
            else:
                print("✅ Column unique_id already exists in repairs table")
                
        except Exception as e:
            print(f"❌ Migration error: {e}")
            import traceback
            traceback.print_exc()
            conn.rollback()
            raise

if __name__ == "__main__":
    print("\n" + "="*60)
    print("MIGRATION: Add Repair Unique ID")
    print("="*60 + "\n")
    migrate()
    print("\n✅ Migration completed successfully!\n")

