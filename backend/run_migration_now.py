"""
Run Migration Now - Uses existing application database connection
This script runs the migration using the same database connection as the app
"""
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_migration():
    """Run the migration using the application's database connection"""
    try:
        from app.core.database import SessionLocal
        from sqlalchemy import text
        
        print("🚀 AUTOMATIC PHONE FIELDS MIGRATION")
        print("=" * 40)
        
        # Create database session
        db = SessionLocal()
        
        try:
            # Check existing columns
            result = db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'products' AND table_schema = 'public'
            """))
            existing_columns = [row[0] for row in result.fetchall()]
            
            print(f"📊 Found {len(existing_columns)} existing columns in products table")
            
            # Define phone fields to add
            phone_fields = [
                ("imei", "VARCHAR UNIQUE"),
                ("is_phone", "BOOLEAN DEFAULT FALSE"),
                ("phone_condition", "VARCHAR"),
                ("phone_specs", "JSONB"),
                ("is_swappable", "BOOLEAN DEFAULT FALSE"),
                ("phone_status", "VARCHAR DEFAULT 'AVAILABLE'"),
                ("swapped_from_id", "INTEGER"),
                ("current_owner_id", "INTEGER"),
                ("current_owner_type", "VARCHAR DEFAULT 'shop'")
            ]
            
            added_fields = []
            for field_name, field_type in phone_fields:
                if field_name not in existing_columns:
                    try:
                        print(f"➕ Adding column: {field_name}")
                        db.execute(text(f"ALTER TABLE products ADD COLUMN {field_name} {field_type}"))
                        added_fields.append(field_name)
                    except Exception as e:
                        print(f"⚠️ Could not add {field_name}: {e}")
                else:
                    print(f"ℹ️ Column {field_name} already exists")
            
            # Create indexes
            print("📝 Creating indexes...")
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_products_imei ON products(imei)",
                "CREATE INDEX IF NOT EXISTS idx_products_is_phone ON products(is_phone)",
                "CREATE INDEX IF NOT EXISTS idx_products_phone_condition ON products(phone_condition)",
                "CREATE INDEX IF NOT EXISTS idx_products_is_swappable ON products(is_swappable)",
                "CREATE INDEX IF NOT EXISTS idx_products_phone_status ON products(phone_status)"
            ]
            
            for index_sql in indexes:
                try:
                    db.execute(text(index_sql))
                    print(f"✅ Created index")
                except Exception as e:
                    print(f"⚠️ Could not create index: {e}")
            
            db.commit()
            
            if added_fields:
                print(f"\n🎉 MIGRATION SUCCESSFUL!")
                print(f"✅ Added {len(added_fields)} new fields: {', '.join(added_fields)}")
            else:
                print(f"\nℹ️ All phone fields already exist. No migration needed.")
            
            # Show summary
            result = db.execute(text("SELECT COUNT(*) FROM products"))
            product_count = result.fetchone()[0]
            print(f"📊 Total products in database: {product_count}")
            
            print("\n✅ MIGRATION COMPLETED SUCCESSFULLY!")
            print("The 500 error should now be fixed.")
            print("Products API and POS system should work normally.")
            
            return True
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            db.rollback()
            return False
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Failed to initialize database connection: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
