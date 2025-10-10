"""
Migration: Add brand_id column to phones table and create brands table
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        print("🔄 Creating brands table...")
        
        # Create brands table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR UNIQUE NOT NULL,
                description VARCHAR,
                logo_url VARCHAR,
                created_by_user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by_user_id) REFERENCES users(id)
            )
        """)
        print("  ✅ Brands table created")
        
        # Add brand_id to phones
        try:
            cursor.execute("""
                ALTER TABLE phones ADD COLUMN brand_id INTEGER
            """)
            print("  ✅ Added brand_id to phones")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("  ⚠️ brand_id already exists in phones")
            else:
                raise
        
        # Insert default brands based on existing phone brands
        print("\n🔄 Migrating existing brands...")
        cursor.execute("SELECT DISTINCT brand FROM phones WHERE brand IS NOT NULL AND brand != ''")
        existing_brands = cursor.fetchall()
        
        for (brand_name,) in existing_brands:
            try:
                cursor.execute("""
                    INSERT INTO brands (name, description, created_by_user_id)
                    VALUES (?, ?, NULL)
                """, (brand_name, f"{brand_name} phones"))
                print(f"  ✅ Created brand: {brand_name}")
            except sqlite3.IntegrityError:
                print(f"  ⚠️ Brand {brand_name} already exists")
        
        # Update phones to link with brands
        print("\n🔄 Linking phones to brands...")
        cursor.execute("""
            UPDATE phones 
            SET brand_id = (
                SELECT id FROM brands WHERE brands.name = phones.brand
            )
            WHERE brand IS NOT NULL
        """)
        updated = cursor.rowcount
        print(f"  ✅ Linked {updated} phones to brands")
        
        conn.commit()
        
        print(f"\n✅ Migration successful!")
        print(f"   - Brands table created")
        print(f"   - brand_id column added to phones")
        print(f"   - Existing brands migrated")
        print(f"   - Phones linked to brands")
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

