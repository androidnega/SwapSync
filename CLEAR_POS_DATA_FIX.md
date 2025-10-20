# POS Data Clearing Fix

## Issue Description

The POS Monitor (`https://swapsync.digitstec.store/pos-monitor`) and Shopkeeper POS are showing historical sales data even though there are no products in the system. This is because:

1. **Real Data in Database**: The data being displayed comes from real POS sales records stored in the database (not from cache or mock data)
2. **No Caching Issue**: The frontend is fetching data directly from the backend API without any browser or service worker caching
3. **Historical Records**: Previous POS transactions were recorded and are still in the database

## Solution

Three methods have been implemented to clear the POS sales data:

### Method 1: Using the Web UI (Recommended)

1. **Login** to your SwapSync system as a Super Admin
2. Navigate to **System Database** page
3. Click on the **"Clear Data"** tab
4. Scroll down to find the purple button **"Clear All POS Sales"**
5. Click the button and confirm when prompted
6. The system will clear:
   - All POS sales transactions
   - All POS sale items
   - All product sales records
   - All stock movements related to POS sales

### Method 2: Using the Backend Script (Server Access Required)

If you have SSH access to your server:

```bash
# Navigate to backend directory
cd backend

# Run the script (no confirmation required)
python clear_pos_sales_now.py
```

This script will immediately clear all POS sales data without asking for confirmation.

### Method 3: Using the API Directly

You can call the API endpoint directly:

```bash
curl -X POST https://api.digitstec.store/api/maintenance/clear-pos-sales \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## Changes Made

### Backend Changes

1. **`backend/app/api/routes/maintenance_routes.py`**
   - Added new endpoint: `POST /maintenance/clear-pos-sales`
   - Updated `POST /maintenance/clear-all-data` to include POS sales deletion
   - Both endpoints properly delete data in the correct order to respect foreign key constraints

2. **`backend/clear_pos_sales_now.py`** (NEW)
   - Created a command-line script to clear POS sales immediately
   - No confirmation required - useful for automated tasks

### Frontend Changes

1. **`frontend/src/services/api.ts`**
   - Added `maintenanceAPI` with methods to clear various data types
   - Added `clearPosSales()` method

2. **`frontend/src/pages/SystemDatabase.tsx`**
   - Added "Clear All POS Sales" button in the Clear Data tab
   - Purple button to distinguish from other clear operations
   - Integrated with the maintenance API

## What Gets Deleted

When you clear POS sales data, the following will be permanently deleted:

- ✅ All POS sales transactions
- ✅ All POS sale items (line items in each transaction)
- ✅ All product sales records
- ✅ All stock movements related to POS sales
- ❌ Products (will remain intact)
- ❌ Customers (will remain intact)
- ❌ Users (will remain intact)
- ❌ Product categories and brands (will remain intact)

## After Clearing

1. **Refresh the Pages**: After clearing, refresh both:
   - POS Monitor page (`/pos-monitor`)
   - POS System page (`/pos-system`)

2. **Expected Behavior**:
   - POS Monitor should show:
     - Total Revenue: ₵0.00
     - Total Profit: ₵0.00
     - Items Sold: 0
     - "No transactions found" message
   - Shopkeeper POS should show:
     - Sold Today: 0
     - Amount Recorded: ₵0.00
     - Empty transaction history

3. **Products**: All your products should still be visible and ready for new sales

## Prevention

To avoid accumulating test/dummy data in the future:

1. **Use a Test Environment**: Set up a separate test/staging environment for testing
2. **Regular Cleanup**: Periodically clear test data during development
3. **Backup Before Testing**: Always create a backup before adding test data
4. **Use the Clear Functions**: Utilize the provided clear functions in the System Database page

## Technical Details

### Database Tables Affected

- `pos_sales` - Main POS transaction records
- `pos_sale_items` - Individual line items in each POS transaction
- `product_sales` - Product sales records linked to POS transactions
- `stock_movements` - Inventory movements from POS sales

### Foreign Key Constraints

The clearing operation respects all foreign key constraints by deleting in this order:

1. First: `pos_sale_items` (child records)
2. Second: `pos_sales` (parent records)
3. Third: `product_sales` (related records)
4. Fourth: `stock_movements` with `reference_type = 'pos_sale'`

## Troubleshooting

### Issue: "Still seeing old data after clearing"

**Solution**: Hard refresh your browser:
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

### Issue: "Clear button not working"

**Solutions**:
1. Check that you're logged in as a Super Admin
2. Check browser console for errors (F12)
3. Try using Method 2 (backend script) instead

### Issue: "API returns 403 Forbidden"

**Solution**: Only Super Admin and Admin users can clear data. Login with appropriate credentials.

## Support

If you need additional help:
1. Check the application logs for detailed error messages
2. Ensure you're using the latest version of the code
3. Verify that all migrations have been run successfully

---

**Last Updated**: October 20, 2025
**Version**: 1.0

