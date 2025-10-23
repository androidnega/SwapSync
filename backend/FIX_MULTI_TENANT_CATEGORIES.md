# Fix Multi-Tenant Category Isolation

## Problem
Categories have a **global unique constraint**, causing this issue:
- Company A creates category "Phones"
- Company B tries to create "Phones" → **ERROR: Already exists**
- Company B cannot see Company A's category, but can't create their own

## Solution
Run the migration to remove the global unique constraint and enable per-company categories.

## Running the Migration

### Option 1: Via PowerShell Script (Easiest)
```powershell
cd backend
pwsh -ExecutionPolicy Bypass -File run_migration.ps1
```

When prompted:
1. Enter your manager/admin username
2. Enter your password
3. Select option or manually trigger the endpoint

### Option 2: Via API Endpoint Directly

1. Login to get token:
```bash
curl -X POST "https://api.digitstec.store/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=YOUR_USERNAME&password=YOUR_PASSWORD"
```

2. Copy the `access_token` from response

3. Run the migration:
```bash
curl -X POST "https://api.digitstec.store/api/migrations/remove-category-unique-constraint" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Option 3: Via Railway CLI
```bash
cd backend
railway run python migrate_remove_category_unique_constraint.py
```

## What This Migration Does

1. ✅ Removes global unique constraint on `categories.name`
2. ✅ Drops any unique indexes on the name column
3. ✅ Creates a non-unique index for performance
4. ✅ Enables multiple companies to have categories with the same name

## After Migration

### What Changes:
- ✅ Each company can create their own "Phones", "Chargers", etc.
- ✅ Category names are checked for uniqueness within each company only
- ✅ Companies cannot see other companies' categories (already filtered)
- ✅ No data loss - all existing categories remain intact

### Verification:
1. Login as Company A manager
2. Try to create category "Phones" (should work)
3. Login as Company B manager  
4. Try to create category "Phones" (should also work!)
5. Each company only sees their own categories

## Technical Details

### Database Changes:
```sql
-- Before (WRONG - Global unique)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE,  -- ❌ Globally unique
    ...
);

-- After (CORRECT - Per company)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR,  -- ✅ Not globally unique
    ...
);
CREATE INDEX idx_categories_name ON categories(name);  -- Non-unique index
```

### Code Changes:
- Updated `app/models/category.py` - Removed `unique=True`
- Updated `app/api/routes/category_routes.py` - Check duplicates per company
- Categories are filtered by `created_by_user_id` which belongs to company

### How It Works:
```python
# Old (WRONG)
existing = db.query(Category).filter(Category.name == "Phones").first()

# New (CORRECT)
company_user_ids = get_company_user_ids(db, current_user)
existing = db.query(Category).filter(
    Category.name == "Phones",
    Category.created_by_user_id.in_(company_user_ids)  # Only check within company
).first()
```

## Rollback (If Needed)
If you need to rollback (not recommended):
```sql
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
```

## Support
If you encounter issues:
1. Check Railway logs for errors
2. Verify you have manager/admin access
3. Ensure Railway database is PostgreSQL (not SQLite)
4. Contact support with error details

