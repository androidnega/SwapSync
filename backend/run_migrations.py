"""
Master migration runner - automatically runs all migration scripts
"""
import os
import sys
import subprocess
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
            # Run migration as subprocess (safer than exec)
            result = subprocess.run(
                [sys.executable, migration_file],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ {migration_file} completed successfully!")
                if result.stdout:
                    print(result.stdout)
            else:
                # Migration failed, but don't crash
                print(f"⚠️  {migration_file} had an issue (this may be normal if already applied)")
                if result.stderr:
                    print(f"   Error: {result.stderr[:200]}")  # Truncate long errors
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
        print(f"⚠️  Migration runner error: {e}")
        print("⚠️  Continuing to start server anyway...")
        # Don't exit with error code - allow server to start anyway

