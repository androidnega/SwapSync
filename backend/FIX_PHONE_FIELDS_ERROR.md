# Fix for "column products.is_phone does not exist" Error

## Problem
The PostgreSQL database on Railway is missing the `is_phone` and other phone-related columns in the `products` table.

## Solution

### Option 1: Via API Endpoint (Recommended)

Run the Python script to trigger the migration:

```bash
cd backend
python trigger_phone_fields_migration.py
```

You'll be prompted for manager/admin credentials. The script will:
1. Login to your API
2. Trigger the migration endpoint
3. Add all missing columns to the products table

### Option 2: Via API Directly (Using curl)

1. First, get your access token:
```bash
curl -X POST "https://api.digitstec.store/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=YOUR_USERNAME&password=YOUR_PASSWORD"
```

2. Then trigger the migration:
```bash
curl -X POST "https://api.digitstec.store/api/migrations/add-phone-fields" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Option 3: Via Railway CLI (Direct Database Access)

If you have Railway CLI installed:

```bash
cd backend
railway run python migrate_add_phone_fields_postgresql.py
```

## What This Migration Adds

The migration adds these columns to the `products` table:
- `imei` - IMEI number for phones
- `is_phone` - Boolean flag to identify phone products
- `is_swappable` - Boolean flag for swap-eligible phones
- `phone_condition` - Condition of the phone
- `phone_specs` - JSON field for phone specifications
- `phone_status` - Status (AVAILABLE, SOLD, etc.)
- `swapped_from_id` - Reference to swap transaction
- `current_owner_id` - Current owner reference
- `current_owner_type` - Owner type (shop, customer, repair)

Plus indexes on key fields for better performance.

## After Migration

1. Restart your Railway deployment (it should auto-restart)
2. Refresh your frontend application
3. The dashboard and products API should now work correctly

## Verification

Check if the migration was successful:
- Login to your dashboard
- Navigate to Products page
- Check if low stock alerts are loading
- Verify dashboard cards are displaying correctly

## Troubleshooting

If you still see errors after migration:
1. Check Railway logs for any deployment errors
2. Verify the migration endpoint returned success
3. Try restarting the Railway service manually
4. Contact support if issues persist

