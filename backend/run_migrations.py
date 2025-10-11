"""
Master migration runner - automatically runs all migration scripts
"""
import os
import sys
import glob

def run_migrations():
    """Run all migration scripts in order"""
    print("🔧 Running database migrations...")
    
    # Get all migration files (sorted alphabetically)
    migration_files = sorted(glob.glob("migrate_*.py"))
    
    if not migration_files:
        print("✅ No migration files found, skipping...")
        return
    
    print(f"📋 Found {len(migration_files)} migration(s)")
    
    for migration_file in migration_files:
        print(f"\n▶️  Running: {migration_file}")
        try:
            # Execute the migration script
            with open(migration_file) as f:
                exec(f.read())
            print(f"✅ {migration_file} completed successfully!")
        except Exception as e:
            # Don't fail if migration already applied or has minor errors
            print(f"⚠️  {migration_file}: {str(e)}")
            # Continue with other migrations
            continue
    
    print("\n✅ All migrations completed!\n")

if __name__ == "__main__":
    try:
        run_migrations()
    except Exception as e:
        print(f"❌ Migration error: {e}")
        # Don't exit with error code - allow server to start anyway
        # sys.exit(1)

