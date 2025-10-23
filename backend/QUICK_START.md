# Quick Start Guide

## 🚀 Setup & Deployment

### Step 1: Run Database Migration
```bash
cd backend
python migrate_add_repair_sales_table.py
```

**Expected Output:**
```
================================================================================
🔧 MIGRATION: Add repair_sales table
================================================================================

✅ Creating repair_sales table...
✅ repair_sales table created successfully
✅ Checking products.is_swappable column...
ℹ️  is_swappable column already exists
✅ Adding product_type column to products...
✅ product_type column added

================================================================================
✅ MIGRATION COMPLETED SUCCESSFULLY
================================================================================
```

---

### Step 2: Restart Backend Server
```bash
# Development
cd backend
python main.py

# Production (if using gunicorn)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

---

### Step 3: Update Frontend (Optional)
```bash
cd frontend
npm install
npm run build  # Production
# or
npm start  # Development
```

---

## ✅ Quick Test Checklist

### 1. Test Phone Deletion Fix
```bash
# Try deleting a phone that has sales (should return 409)
curl -X DELETE "http://api.digitstec.store/api/phones/112" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: HTTP 409 with message:
# "Cannot delete phone because it has related records: 2 sale(s), 1 swap(s)..."
```

### 2. Test Add Repair Item
```bash
# Add a product to a repair
curl -X POST "http://api.digitstec.store/api/repairs/1/items" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 10,
    "quantity": 2,
    "unit_price": 30.00
  }'

# Expected: HTTP 201 with repair_sale details
```

### 3. Test Repairer Dashboard
```bash
# View repairer sales statistics
curl -X GET "http://api.digitstec.store/api/dashboard/repairer-sales" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: HTTP 200 with repairers array and summary
```

---

## 🎯 Testing in UI

### Test Repair Modal with Inventory Search
1. Login as Repairer
2. Go to "Repairs" page
3. Click "New Repair"
4. Fill customer details
5. In "Add Items Used" section:
   - Click search box
   - Type product name (e.g., "battery")
   - Click "+" to add
   - Verify stock shows and updates
6. Submit repair
7. Verify:
   - Repair created
   - Items appear in repair details
   - Product stock decreased

### Test Manager Dashboard
1. Login as Manager
2. Go to Dashboard
3. Look for "Repairer Sales" section
4. Verify:
   - List of repairers with metrics
   - Items sold count
   - Total sales amount
   - Profit calculations
5. Click on a repairer
6. Verify detailed breakdown appears

### Test Product "Available for Swap" Toggle
1. Login as Manager
2. Go to "Products" page
3. Create or edit a product
4. Scroll to "Available for Swap" section
5. Check the toggle
6. Save product
7. Verify saved correctly on reload

---

## 🐛 Troubleshooting

### Migration Fails
**Problem:** `table "repair_sales" already exists`
**Solution:** Table was already created. Safe to ignore if columns exist.

### Import Error: RepairSale
**Problem:** `ImportError: cannot import name 'RepairSale'`
**Solution:** Restart your Python server to reload models.

### Frontend: Products Not Showing in Repair Modal
**Problem:** Dropdown is empty
**Checklist:**
- ✅ Check browser console for API errors
- ✅ Verify `GET /api/products` returns data
- ✅ Check products have `quantity > 0`
- ✅ Check products have `is_active = true`

### Dashboard: No Repairer Stats
**Problem:** Empty repairers array
**Reason:** No repair items have been added yet
**Solution:** Add items to at least one repair first

---

## 📝 Common Scenarios

### Scenario 1: Repairer Adds Items to Repair
```
1. Repairer creates repair for customer
2. Searches for "iPhone battery" in modal
3. Clicks "+" to add 2 units
4. Submits repair
5. System:
   - Deducts 2 from product stock
   - Creates repair_sale record
   - Links to repairer's ID
   - Calculates profit
   - Updates repair total cost
```

### Scenario 2: Manager Views Repairer Performance
```
1. Manager opens dashboard
2. Sees "Repairer Sales" card showing:
   - John: 45 items, ₵3500, ₵1400 profit
   - Jane: 32 items, ₵2800, ₵1000 profit
3. Clicks "John" to see details
4. Views breakdown by product:
   - iPhone batteries: 15 sold
   - Samsung screens: 8 sold
   - Etc.
```

### Scenario 3: Deleting Phone with Dependencies
```
1. Manager tries to delete phone ID 112
2. System checks:
   - Has 2 sales ❌
   - Has 1 swap ❌
   - Has 0 repairs ✅
3. Returns 409 Conflict:
   "Cannot delete phone because it has related records: 2 sale(s), 1 swap(s). Archive this phone instead..."
4. Manager archives phone or removes dependencies first
```

---

## 🔗 Useful Links

- **Implementation Summary:** `backend/IMPLEMENTATION_SUMMARY.md`
- **API Endpoints Guide:** `backend/API_ENDPOINTS_GUIDE.md`
- **Migration Script:** `backend/migrate_add_repair_sales_table.py`
- **RepairSale Model:** `backend/app/models/repair_sale.py`

---

## 💡 Tips

- **Stock Concurrency:** Multiple repairers can add items simultaneously. Database transactions prevent race conditions.
- **Profit Calculation:** Automatic based on `unit_price - cost_price`. No manual entry needed.
- **Company Isolation:** All queries respect multi-tenant boundaries. Managers only see their company's data.
- **Permissions:** Repairers can add/view items. Only managers can remove items from repairs.

---

## 🎉 Success Indicators

You know it's working when:
- ✅ Phone deletion returns clear error messages (no 500s)
- ✅ Adding items to repairs deducts inventory
- ✅ Manager dashboard shows repairer metrics
- ✅ Repair modal searches products by name/SKU/brand
- ✅ "Available for Swap" toggle appears on products
- ✅ All calculations (profit, totals) are accurate

---

## 📞 Need Help?

If you encounter issues:
1. Check backend logs for detailed error messages
2. Verify database migration ran successfully
3. Confirm API endpoints return expected responses
4. Review browser console for frontend errors
5. Check user roles and permissions

Happy coding! 🚀

