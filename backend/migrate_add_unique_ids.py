"""
Migration: Add unique_id fields to all models for better identification
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    print("🔄 Adding unique_id fields...")
    
    # Add to customers (without UNIQUE constraint initially)
    try:
        cursor.execute("ALTER TABLE customers ADD COLUMN unique_id VARCHAR(20)")
        print("✅ Added unique_id to customers")
    except Exception as e:
        print(f"⚠️ Customers unique_id might already exist: {e}")
    
    # Add to users
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN unique_id VARCHAR(20)")
        print("✅ Added unique_id to users")
    except Exception as e:
        print(f"⚠️ Users unique_id might already exist: {e}")
    
    # Add to products
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN unique_id VARCHAR(20)")
        print("✅ Added unique_id to products")
    except Exception as e:
        print(f"⚠️ Products unique_id might already exist: {e}")
    
    # Add to phones (for consistency)
    try:
        cursor.execute("ALTER TABLE phones ADD COLUMN unique_id VARCHAR(20)")
        print("✅ Added unique_id to phones")
    except Exception as e:
        print(f"⚠️ Phones unique_id might already exist: {e}")
    
    # Add to repairs (REP-YYYYMMDD-XXXX already exists as tracking_code)
    print("ℹ️ Repairs already have tracking_code")
    
    conn.commit()
    
    # Now generate IDs for existing records
    print("\n🔄 Generating unique IDs for existing records...")
    
    # Customers
    cursor.execute("SELECT id FROM customers WHERE unique_id IS NULL ORDER BY id")
    customers = cursor.fetchall()
    for idx, (cust_id,) in enumerate(customers, 1):
        unique_id = f"CUST-{str(idx).zfill(4)}"
        cursor.execute("UPDATE customers SET unique_id = ? WHERE id = ?", (unique_id, cust_id))
    print(f"✅ Generated {len(customers)} customer IDs")
    
    # Users (role-based prefixes)
    cursor.execute("SELECT id, role FROM users WHERE unique_id IS NULL ORDER BY id")
    users = cursor.fetchall()
    role_counters = {'super_admin': 0, 'admin': 0, 'manager': 0, 'shop_keeper': 0, 'repairer': 0}
    
    for user_id, role in users:
        role_key = role.split('.')[-1] if '.' in role else role  # Handle enum format
        
        if 'super_admin' in role_key or role_key == 'UserRole.SUPER_ADMIN':
            prefix = 'ADM'
            role_counters['super_admin'] += 1
            num = role_counters['super_admin']
        elif 'admin' in role_key:
            prefix = 'ADM'
            role_counters['admin'] += 1
            num = role_counters['admin']
        elif 'manager' in role_key or 'ceo' in role_key:
            prefix = 'MGR'
            role_counters['manager'] += 1
            num = role_counters['manager']
        elif 'shop_keeper' in role_key:
            prefix = 'SHOP'
            role_counters['shop_keeper'] += 1
            num = role_counters['shop_keeper']
        elif 'repairer' in role_key:
            prefix = 'TECH'
            role_counters['repairer'] += 1
            num = role_counters['repairer']
        else:
            prefix = 'USER'
            num = user_id
        
        unique_id = f"{prefix}-{str(num).zfill(4)}"
        cursor.execute("UPDATE users SET unique_id = ? WHERE id = ?", (unique_id, user_id))
    
    print(f"✅ Generated {len(users)} user IDs")
    
    # Products
    cursor.execute("SELECT id FROM products WHERE unique_id IS NULL ORDER BY id")
    products = cursor.fetchall()
    for idx, (prod_id,) in enumerate(products, 1):
        unique_id = f"PROD-{str(idx).zfill(4)}"
        cursor.execute("UPDATE products SET unique_id = ? WHERE id = ?", (unique_id, prod_id))
    print(f"✅ Generated {len(products)} product IDs")
    
    # Phones
    cursor.execute("SELECT id FROM phones WHERE unique_id IS NULL ORDER BY id")
    phones = cursor.fetchall()
    for idx, (phone_id,) in enumerate(phones, 1):
        unique_id = f"PHON-{str(idx).zfill(4)}"
        cursor.execute("UPDATE phones SET unique_id = ? WHERE id = ?", (unique_id, phone_id))
    print(f"✅ Generated {len(phones)} phone IDs")
    
    conn.commit()
    
    # Create unique indexes
    print("\n🔄 Creating unique indexes...")
    try:
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_unique_id ON customers(unique_id)")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id)")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_products_unique_id ON products(unique_id)")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_phones_unique_id ON phones(unique_id)")
        print("✅ Unique indexes created")
    except Exception as e:
        print(f"⚠️ Indexes might already exist: {e}")
    
    conn.commit()
    conn.close()
    print("\n✅ Migration completed successfully!")
    print("\n📋 ID Formats:")
    print("   Customers: CUST-0001, CUST-0002, etc.")
    print("   Managers: MGR-0001, MGR-0002, etc.")
    print("   Shop Keepers: SHOP-0001, SHOP-0002, etc.")
    print("   Repairers: TECH-0001, TECH-0002, etc.")
    print("   Admins: ADM-0001, ADM-0002, etc.")
    print("   Products: PROD-0001, PROD-0002, etc.")
    print("   Phones: PHON-0001, PHON-0002, etc.")
    print("   Repairs: REP-YYYYMMDD-XXXX (tracking_code)")

if __name__ == "__main__":
    migrate()

