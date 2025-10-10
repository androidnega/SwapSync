"""
Migration: Add categories table and phone category/specs fields
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        print("🔄 Creating categories table...")
        
        # Create categories table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR UNIQUE NOT NULL,
                description VARCHAR,
                created_by_user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by_user_id) REFERENCES users(id)
            )
        """)
        print("  ✅ Categories table created")
        
        # Add category_id to phones
        try:
            cursor.execute("""
                ALTER TABLE phones ADD COLUMN category_id INTEGER
            """)
            print("  ✅ Added category_id to phones")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("  ⚠️ category_id already exists in phones")
        
        # Add specs JSON to phones
        try:
            cursor.execute("""
                ALTER TABLE phones ADD COLUMN specs TEXT
            """)
            print("  ✅ Added specs to phones")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("  ⚠️ specs already exists in phones")
        
        # Add cost_price to phones
        try:
            cursor.execute("""
                ALTER TABLE phones ADD COLUMN cost_price REAL
            """)
            print("  ✅ Added cost_price to phones")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("  ⚠️ cost_price already exists in phones")
        
        # Add created_at to phones
        try:
            cursor.execute("""
                ALTER TABLE phones ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """)
            print("  ✅ Added created_at to phones")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("  ⚠️ created_at already exists in phones")
        
        # Insert default categories
        default_categories = [
            ('Samsung', 'Samsung smartphones'),
            ('iPhone', 'Apple iPhone devices'),
            ('Tecno', 'Tecno mobile phones'),
            ('Infinix', 'Infinix smartphones'),
            ('Huawei', 'Huawei devices'),
            ('Xiaomi', 'Xiaomi/Redmi phones'),
            ('Other', 'Other brands')
        ]
        
        for cat_name, cat_desc in default_categories:
            try:
                cursor.execute("""
                    INSERT INTO categories (name, description, created_by_user_id)
                    VALUES (?, ?, NULL)
                """, (cat_name, cat_desc))
                print(f"  ✅ Added category: {cat_name}")
            except sqlite3.IntegrityError:
                print(f"  ⚠️ Category {cat_name} already exists, skipping...")
        
        conn.commit()
        
        print(f"\n✅ Migration successful!")
        print(f"   - Categories table ready")
        print(f"   - Phone fields updated")
        print(f"   - Default categories added")
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

