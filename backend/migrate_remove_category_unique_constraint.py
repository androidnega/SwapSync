"""
Migration to remove global unique constraint from categories.name
This allows multiple companies to have categories with the same name
"""
import os
from sqlalchemy import create_engine, text, inspect
from app.core.config import settings

def migrate():
    """Remove unique constraint from categories.name column"""
    try:
        # Get database URL from environment or settings
        database_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL
        
        # Fix Railway's postgres:// to postgresql://
        if database_url and database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        print(f"🔄 Connecting to database...")
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            print("🔄 Checking for unique constraint on categories.name...")
            
            # Get all constraints on categories table
            inspector = inspect(engine)
            constraints = inspector.get_unique_constraints('categories')
            indexes = inspector.get_indexes('categories')
            
            print(f"📊 Found {len(constraints)} unique constraints")
            print(f"📊 Found {len(indexes)} indexes")
            
            # Find and drop the unique constraint on 'name' column
            constraint_dropped = False
            
            # Check unique constraints
            for constraint in constraints:
                if 'name' in constraint.get('column_names', []):
                    constraint_name = constraint.get('name')
                    print(f"🔄 Dropping unique constraint: {constraint_name}")
                    try:
                        drop_sql = text(f"ALTER TABLE categories DROP CONSTRAINT IF EXISTS {constraint_name}")
                        conn.execute(drop_sql)
                        conn.commit()
                        print(f"✅ Dropped constraint: {constraint_name}")
                        constraint_dropped = True
                    except Exception as e:
                        print(f"⚠️ Could not drop constraint {constraint_name}: {e}")
                        conn.rollback()
            
            # Check for unique indexes
            for index in indexes:
                if index.get('unique') and 'name' in index.get('column_names', []):
                    index_name = index.get('name')
                    print(f"🔄 Dropping unique index: {index_name}")
                    try:
                        drop_sql = text(f"DROP INDEX IF EXISTS {index_name}")
                        conn.execute(drop_sql)
                        conn.commit()
                        print(f"✅ Dropped index: {index_name}")
                        constraint_dropped = True
                    except Exception as e:
                        print(f"⚠️ Could not drop index {index_name}: {e}")
                        conn.rollback()
            
            # Try common PostgreSQL constraint names if not found
            if not constraint_dropped:
                print("🔄 Trying common constraint names...")
                common_names = [
                    'categories_name_key',
                    'uq_categories_name',
                    'categories_name_unique'
                ]
                
                for constraint_name in common_names:
                    try:
                        drop_sql = text(f"ALTER TABLE categories DROP CONSTRAINT IF EXISTS {constraint_name}")
                        conn.execute(drop_sql)
                        conn.commit()
                        print(f"✅ Dropped constraint: {constraint_name}")
                        constraint_dropped = True
                        break
                    except Exception as e:
                        print(f"⚠️ Constraint {constraint_name} not found or already dropped")
                        conn.rollback()
            
            # Ensure we have a regular (non-unique) index on name for performance
            print("🔄 Creating non-unique index on categories.name...")
            try:
                create_index_sql = text("CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)")
                conn.execute(create_index_sql)
                conn.commit()
                print("✅ Created non-unique index on name")
            except Exception as e:
                print(f"⚠️ Could not create index: {e}")
                conn.rollback()
            
            # Get category count
            count_result = conn.execute(text("SELECT COUNT(*) FROM categories"))
            category_count = count_result.fetchone()[0]
            print(f"📊 Total categories in database: {category_count}")
            
        if constraint_dropped:
            print("🎉 Migration completed successfully!")
            print("✅ Categories can now have duplicate names across different companies")
        else:
            print("ℹ️ No unique constraint found (may have been removed already)")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = migrate()
    if success:
        print("\n✅ Migration completed! Categories are now company-isolated.")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")

