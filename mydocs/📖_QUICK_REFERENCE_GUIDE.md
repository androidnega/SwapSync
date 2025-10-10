# 📖 SWAPSYNC - QUICK REFERENCE GUIDE

## 🚀 **Quick Start**

### **Start Backend**:
```bash
cd backend
venv\Scripts\activate
python main.py
```
**URL**: `http://127.0.0.1:8000`

### **Start Frontend**:
```bash
cd frontend
npm run dev
```
**URL**: `http://localhost:5173`

---

## 👤 **Login Credentials**

```
Manager:    ceo1 / ceo123
Shopkeeper: keeper / keeper123
Repairer:   repairer / repair123
Admin:      admin / admin123
```

---

## 📋 **WHAT EACH ROLE CAN DO**

### **🔵 MANAGER**
✅ **CAN DO**:
- View all sales
- View all repairs
- Add/Edit/Delete products
- Adjust product stock
- Generate PDF profit reports (Daily/Weekly/Monthly/Yearly)
- Manage staff
- Manage phone brands
- Manage product categories
- View analytics
- Add phones with battery health

❌ **CANNOT DO**:
- Record sales (Shopkeeper only)
- Book repairs (Repairer/Shopkeeper only)

---

### **🟢 SHOPKEEPER**
✅ **CAN DO**:
- **Record phone sales** (Manager cannot!)
- **Record product sales**
- Book repairs (walk-ins)
- View products
- View stock alerts
- Process swaps
- Manage customers

❌ **CANNOT DO**:
- Add/edit products (Manager only)
- Generate profit reports (Manager only)

---

### **🟠 REPAIRER**
✅ **CAN DO**:
- Book repairs
- Update repair status
- View repairs
- Send repair completion SMS

❌ **CANNOT DO**:
- Record sales
- Manage products

---

### **🔴 ADMIN**
✅ **CAN DO**:
- Everything (full system access)
- Manage all users
- Configure system settings
- Generate audit codes

---

## 🛍️ **HOW TO SELL**

### **Phone Sale**:
```
1. Login as Shopkeeper
2. Go to Sales
3. Select customer
4. Browse phone (or select from dropdown)
5. Enter price (auto-filled)
6. Enter discount (optional)
7. **Enter customer phone** (REQUIRED!)
8. Enter customer email (optional)
9. Submit
10. ✅ Customer receives SMS receipt!
```

### **Product Sale** (via API):
```
POST /api/product-sales/
{
  "customer_id": 1,
  "product_id": 1,
  "quantity": 2,
  "unit_price": 750,
  "discount_amount": 50,
  "customer_phone": "0241234567",
  "customer_email": "test@example.com"
}
```
**Result**: Stock reduces, customer gets SMS!

---

## 📦 **HOW TO MANAGE PRODUCTS**

### **Add Product**:
```
1. Login as Manager
2. Sidebar → Products
3. Click "Add Product"
4. Fill:
   - Name: "AirPods Pro 2"
   - Category: "Earbuds"
   - Brand: "Apple"
   - Cost: 500
   - Selling: 750
   - Quantity: 20
   - Min Stock: 5
5. Submit
6. ✅ Product created!
```

### **Adjust Stock**:
```
1. Find product in list
2. Click "Stock" button
3. Enter adjustment:
   - Positive (+10) to add stock
   - Negative (-5) to remove stock
4. Add notes (optional)
5. Submit
6. ✅ Stock updated!
```

---

## 📊 **HOW TO GENERATE PROFIT REPORTS**

### **Quick Summary**:
```
1. Login as Manager
2. Sidebar → "Profit Reports (PDF)"
3. See cards:
   - Today's Performance
   - This Week
   - This Month
```

### **Download Daily Report**:
```
1. On Profit Reports page
2. Select date (or use today)
3. Click "📥 Download Daily Report"
4. ✅ PDF downloads!
```

### **Download Weekly Report**:
```
1. Select end date (default: today)
2. Click "📥 Download Weekly Report"
3. ✅ PDF shows last 7 days!
```

### **Download Monthly Report**:
```
1. Select month (1-12)
2. Select year (e.g., 2024)
3. Click "📥 Download Monthly Report"
4. ✅ PDF shows full month!
```

### **Download Yearly Report**:
```
1. Select year (e.g., 2024)
2. Click "📥 Download Yearly Report"
3. ✅ PDF shows full year!
```

---

## 🚨 **STOCK ALERTS**

### **How They Work**:
- Products with **quantity = 0** → Red "Out of Stock" alert
- Products with **quantity <= min_stock_level** → Yellow "Low Stock" alert
- Alerts appear on Manager and Shopkeeper dashboards
- Click product to go to Products page

### **How to Fix**:
```
1. See alert on dashboard
2. Click product
3. Click "Stock" button
4. Add stock (e.g., +50)
5. Submit
6. ✅ Alert disappears!
```

---

## 📱 **SMS RECEIPTS**

### **What Customers Receive**:
```
SwapSync - Purchase Receipt

Product: AirPods Pro 2
Brand: Apple
Quantity: 1
Unit Price: ₵750.00
Discount: ₵50.00
Total: ₵700.00

Thank you for your purchase!
```

### **When SMS is Sent**:
- ✅ After every phone sale
- ✅ After every product sale
- ✅ After repair completion
- ✅ Uses your company name in branding

### **SMS Providers**:
- Primary: **Arkasel**
- Fallback: **Hubtel**
- Configure in: **Settings** page

---

## 🔑 **KEY FEATURES SUMMARY**

| Feature | Manager | Shopkeeper | Repairer |
|---------|---------|------------|----------|
| Record Sales | ❌ No | ✅ Yes | ❌ No |
| Book Repairs | ❌ No | ✅ Yes | ✅ Yes |
| Add Products | ✅ Yes | ❌ No | ❌ No |
| Adjust Stock | ✅ Yes | ❌ No | ❌ No |
| View Alerts | ✅ Yes | ✅ Yes | ❌ No |
| PDF Reports | ✅ Yes | ❌ No | ❌ No |
| View Sales | ✅ Yes | ✅ Yes | ❌ No |
| View Repairs | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 📂 **IMPORTANT PAGES**

### **Manager Pages**:
- `/` - Dashboard with stock alerts
- `/manager-dashboard` - Manager analytics
- `/products` - Products management
- `/profit-reports` - **PDF profit reports** (NEW!)
- `/brands` - Phone brands
- `/categories` - Product categories
- `/staff-management` - Manage staff
- `/activity-logs` - View activity logs

### **Shopkeeper Pages**:
- `/` - Dashboard with stock alerts
- `/sales` - **Record sales** (Manager cannot!)
- `/products` - View products (read-only)
- `/customers` - Manage customers
- `/swaps` - Process swaps
- `/repairs` - Book repairs

### **Repairer Pages**:
- `/` - Dashboard
- `/repairs` - Book and manage repairs

---

## 🎯 **MOST COMMON TASKS**

### **1. Add a New Product** (Manager):
```
Products → Add Product → Fill form → Submit
```

### **2. Record a Sale** (Shopkeeper):
```
Sales → Select customer → Select phone → Enter phone number → Submit
```

### **3. Generate Profit Report** (Manager):
```
Profit Reports → Select period → Download PDF
```

### **4. Restock Low Items** (Manager):
```
Dashboard → See alert → Click product → Stock → Add quantity → Submit
```

### **5. Book a Repair** (Repairer/Shopkeeper):
```
Repairs → New Repair → Fill form → Submit
```

---

## 📊 **REPORTS BREAKDOWN**

| Report Type | Period | Use Case |
|-------------|--------|----------|
| Daily | Single day | Daily review |
| Weekly | Last 7 days | Week-end analysis |
| Monthly | Full month | Monthly review |
| Yearly | Full year | Year-end summary |

**All reports include**:
- Total sales (phones + products)
- Total revenue
- Total profit
- Profit margins
- Top performing items
- Company branding

---

## ⚡ **QUICK TIPS**

1. **Stock Alerts**: Check dashboard daily for alerts
2. **SMS Receipts**: Always enter customer phone for receipts
3. **Email Receipts**: Optional but recommended (customer email)
4. **Profit Reports**: Generate daily for best tracking
5. **Stock Adjustments**: Always add notes for audit trail
6. **Product Categories**: Keep organized for better reporting
7. **Customer Contact**: Required for SMS, builds customer database

---

## 🆘 **TROUBLESHOOTING**

### **"Manager restriction" message**:
✅ This is correct! Manager cannot record sales/repairs

### **No stock alerts showing**:
- Check if you have products with low/zero stock
- Alerts only show for Manager and Shopkeeper

### **SMS not sending**:
- Check Settings page for Arkasel/Hubtel credentials
- Verify phone number format (Ghana: 0241234567)

### **PDF not downloading**:
- Check if reportlab is installed
- Try different browser
- Check browser download settings

---

## 🎉 **YOU'RE ALL SET!**

**SwapSync is ready to use! Start selling, tracking, and generating reports!** 🚀

**Need help?** Check:
- `🧪_COMPREHENSIVE_TEST_GUIDE.md` - Detailed testing steps
- `🏆_FINAL_COMPLETION_STATUS.md` - Complete feature list
- `📊_IMPLEMENTATION_STATUS.md` - Technical details

**ENJOY YOUR AMAZING SYSTEM!** 🎊


