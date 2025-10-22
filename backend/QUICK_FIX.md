# 🚨 QUICK FIX - Run Migration Automatically

## Option 1: One-Liner Command (Fastest)

Run this single command on your server:

```bash
cd backend && pip install psycopg2-binary && python server_migration.py
```

## Option 2: Deploy and Migrate Script

```bash
cd backend && chmod +x deploy_and_migrate.sh && ./deploy_and_migrate.sh
```

## Option 3: Manual Steps

1. **SSH into your server**
2. **Navigate to backend directory**: `cd backend`
3. **Install psycopg2**: `pip install psycopg2-binary`
4. **Run migration**: `python server_migration.py`

## Option 4: Direct SQL (If you have database access)

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS imei VARCHAR UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_phone BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS phone_condition VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS phone_specs JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_swappable BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS phone_status VARCHAR DEFAULT 'AVAILABLE';
ALTER TABLE products ADD COLUMN IF NOT EXISTS swapped_from_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS current_owner_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS current_owner_type VARCHAR DEFAULT 'shop';
```

## Expected Output

You should see:
```
🚀 AUTOMATIC PHONE FIELDS MIGRATION
========================================
📊 Found X existing columns in products table
➕ Adding column: imei
➕ Adding column: is_phone
➕ Adding column: phone_condition
➕ Adding column: phone_specs
➕ Adding column: is_swappable
➕ Adding column: phone_status
➕ Adding column: swapped_from_id
➕ Adding column: current_owner_id
➕ Adding column: current_owner_type
📝 Creating indexes...
✅ Created index
✅ Created index
✅ Created index
✅ Created index
✅ Created index

🎉 MIGRATION SUCCESSFUL!
✅ Added 9 new fields: imei, is_phone, phone_condition, phone_specs, is_swappable, phone_status, swapped_from_id, current_owner_id, current_owner_type
📊 Total products in database: 123

✅ MIGRATION COMPLETED SUCCESSFULLY!
The 500 error should now be fixed.
Products API and POS system should work normally.
```

## After Migration

- ✅ Products API will work
- ✅ Dashboard will load
- ✅ POS system will function
- ✅ 500 errors will be resolved
- ✅ You can create phone products
