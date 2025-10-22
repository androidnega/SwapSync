# 🚨 IMMEDIATE FIX FOR 500 ERROR

The 500 error is caused by missing phone fields in the PostgreSQL database. Here are the immediate solutions:

## Option 1: Run Emergency Migration Script (Recommended)

```bash
# Navigate to backend directory
cd backend

# Install psycopg2 if not already installed
pip install psycopg2-binary

# Run the emergency migration
python emergency_migration.py
```

## Option 2: Use cURL Command

Get a manager token first, then run:

```bash
curl -X POST "https://api.digitstec.store/api/migrations/add-phone-fields" \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{}"
```

## Option 3: Direct Database Access

If you have direct PostgreSQL access, run these SQL commands:

```sql
-- Add phone fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS imei VARCHAR UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_phone BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS phone_condition VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS phone_specs JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_swappable BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS phone_status VARCHAR DEFAULT 'AVAILABLE';
ALTER TABLE products ADD COLUMN IF NOT EXISTS swapped_from_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS current_owner_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS current_owner_type VARCHAR DEFAULT 'shop';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_imei ON products(imei);
CREATE INDEX IF NOT EXISTS idx_products_is_phone ON products(is_phone);
CREATE INDEX IF NOT EXISTS idx_products_phone_condition ON products(phone_condition);
CREATE INDEX IF NOT EXISTS idx_products_is_swappable ON products(is_swappable);
CREATE INDEX IF NOT EXISTS idx_products_phone_status ON products(phone_status);
```

## What This Fixes

After running any of these solutions:
- ✅ Products API will work normally
- ✅ Dashboard cards will load correctly
- ✅ POS system will function properly
- ✅ You can create phone products with new fields
- ✅ Existing products will continue to work

## Expected Result

You should see a success message like:
```
🎉 MIGRATION SUCCESSFUL!
✅ Added 9 new fields: imei, is_phone, phone_condition, phone_specs, is_swappable, phone_status, swapped_from_id, current_owner_id, current_owner_type
📊 Total products in database: 123
```

The 500 error will be completely resolved after running the migration.
