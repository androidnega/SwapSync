# Repair Items Company Isolation Migration

## Overview
This migration adds company isolation to repair items by adding a `created_by_user_id` field and updating existing repair items to be assigned to a super admin.

## What This Migration Does
1. **Adds `created_by_user_id` field** to the `repair_items` table
2. **Updates existing repair items** to be assigned to a super admin user
3. **Enables company filtering** for repair items in the API
4. **Fixes repair items profit calculations** to work with company isolation

## How to Run the Migration

### Option 1: Via API Endpoint (Recommended)
The migration endpoint has been added to the API at:
```
POST /api/migration/repair-items-company-isolation
```

**Using curl:**
```bash
curl -X POST "https://swapsync.digitstec.store/api/migration/repair-items-company-isolation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Using the admin panel:**
1. Log in as a super admin
2. Navigate to the admin panel
3. Look for the migration section
4. Click "Run Repair Items Migration"

### Option 2: Direct Database Update
If you have direct database access, you can run these SQL commands:

```sql
-- Add the column if it doesn't exist
ALTER TABLE repair_items ADD COLUMN created_by_user_id INTEGER;

-- Update existing repair items to be assigned to the first super admin
UPDATE repair_items 
SET created_by_user_id = (
    SELECT id FROM users 
    WHERE role = 'super_admin' OR role = 'admin' 
    ORDER BY id LIMIT 1
)
WHERE created_by_user_id IS NULL;
```

### Option 3: Via Python Script
If you have access to the server, you can run:
```bash
cd /path/to/backend
python migrate_repair_items_endpoint.py
```

## Verification
After running the migration, verify it worked by:

1. **Check repair items API**: Visit `/api/repair-items/` - should only show company-specific items
2. **Check dashboard profit**: Repair items profit should now show correct values
3. **Check repair items stock**: Should only show items from your company

## Expected Results
- ✅ Repair items are now filtered by company
- ✅ Repair items profit calculations work correctly
- ✅ Each company only sees their own repair items
- ✅ Manager data clearing option is visible in Settings

## Troubleshooting
If the migration fails:
1. Check that you're logged in as a super admin
2. Verify the API is accessible
3. Check server logs for any errors
4. Ensure the database is accessible

## Files Modified
- `backend/app/models/repair_item.py` - Added `created_by_user_id` field
- `backend/app/api/routes/repair_item_routes.py` - Added company filtering
- `backend/app/api/routes/dashboard_routes.py` - Fixed profit calculations
- `backend/frontend/src/pages/Settings.tsx` - Added manager data clearing option
- `backend/migrate_repair_items_endpoint.py` - Migration endpoint
- `backend/main.py` - Added migration route

## Support
If you encounter any issues, check the server logs or contact the system administrator.
