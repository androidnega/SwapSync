# Clear All POS Sales Data

## ⚠️ WARNING
This will **permanently delete ALL POS sales history** from the database!
- All transactions will be removed
- All sales records will be deleted
- This action CANNOT be undone

## Requirements
- You must be logged in as **SUPER_ADMIN**
- The backend API must be running

## How to Clear Data

### Method 1: Using the Script (Recommended)

Run the PowerShell script:
```powershell
.\clear_pos_data.ps1
```

### Method 2: Manual API Call

1. **Get your access token**:
   - Log in to the application
   - Open browser DevTools (F12)
   - Go to Application/Storage > Local Storage
   - Copy the value of `access_token`

2. **Call the cleanup endpoint**:

**For Local Development:**
```bash
curl -X POST "http://localhost:8000/api/admin/clear-pos-sales" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**For Production:**
```bash
curl -X POST "https://api.digitstec.store/api/admin/clear-pos-sales" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Expected Response
```json
{
  "success": true,
  "message": "All POS sales data cleared successfully",
  "deleted": {
    "pos_sales": 7,
    "pos_sale_items": 7,
    "product_sales": 7,
    "stock_movements": 7
  }
}
```

## After Clearing Data

1. Refresh your POS Transactions page
2. Refresh your POS Monitor page
3. All stats should show zero:
   - Total Revenue: ₵0.00
   - Transactions: 0
   - Items Sold: 0
   - No products in top selling list

## What Gets Deleted
- ✅ All POS sales records
- ✅ All POS sale items
- ✅ All product sales records
- ✅ All stock movements related to POS sales

## What Is NOT Deleted
- ✅ Products (inventory)
- ✅ Customers
- ✅ Users/Staff
- ✅ Repairs
- ✅ Settings

## Security
- Only users with **SUPER_ADMIN** role can clear data
- Regular managers, shop keepers cannot access this endpoint
- This is an irreversible operation - use with extreme caution!

---

**Created**: October 20, 2025  
**Purpose**: Clear historical sales data when testing or starting fresh

