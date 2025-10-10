# 🚀 SwapSync - Quick Start Guide

## ✨ Easy Launch Options

### Option 1: Quick Start (Recommended)
**Double-click `START.bat`** 
- Starts backend + frontend automatically
- Opens in separate windows
- Access at: http://localhost:5173

### Option 2: Complete Start with Details
**Double-click `START_ALL.bat`**
- Shows detailed startup information
- Displays all URLs
- Checks virtual environment

### Option 3: Network Access (For Mobile Testing)
**Double-click `START_NETWORK.bat`**
- Access from phones/tablets on same WiFi
- Network URL: http://192.168.17.1:5173

---

## 📱 System Features

### **Current Database:**
- ✅ **24 Phones** with complete specs (CPU, RAM, Storage, Battery, Color, IMEI)
- ✅ **86 Products** with varied stock levels
  - 54 In Stock
  - 22 Low Stock (need reorder)
  - 10 Out of Stock
- ✅ **8 Customers**
- ✅ **10 Brands**
- ✅ **8 Categories**

### **User Roles & Login:**

**Super Admin:**
- Username: `super_admin`
- Password: `admin123`
- Full system access

**Manager:**
- Create in Staff Management page
- Can manage inventory, view reports

**Shop Keeper:**
- Create in Staff Management page
- Can record sales and swaps

---

## 🔧 Advanced Features

### **1. Bulk Upload** (Manager/CEO)
Upload multiple phones/products at once:
1. Navigate to Phones or Products page
2. Click "📤 Bulk Upload"
3. Download Excel template
4. Fill in your data
5. Upload completed file

### **2. System Data Cleanup** (Super Admin Only)
Delete system data for testing/reset:
1. Navigate to Settings page
2. Scroll to "Danger Zone"
3. Click "Manage System Data"
4. Select what to delete (or Delete All)
5. Enter password to confirm
6. Admin accounts are PROTECTED

---

## 📊 Dashboard Access

### **Shop Keeper:**
- Phone Swaps
- Product Sales  
- View inventory (read-only)

### **Manager:**
- All shop keeper features
- Add/Edit phones and products
- View reports and analytics
- Manage staff

### **CEO/Super Admin:**
- All manager features
- System settings
- Data cleanup
- Bulk operations

---

## 🌐 Access URLs

**Local Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Network Access (from other devices):**
- Frontend: http://192.168.17.1:5173
- Backend: http://192.168.17.1:8000

---

## 🛠️ Troubleshooting

**Backend not starting?**
1. Make sure virtual environment exists: `.venv` folder
2. Install dependencies: `.venv\Scripts\activate` then `pip install -r backend\requirements.txt`
3. Check if port 8000 is free

**Frontend not starting?**
1. Install dependencies: `cd frontend` then `npm install`
2. Check if port 5173 is free

**Products not showing?**
1. Restart backend server
2. Check browser console for errors
3. Verify you're logged in as Manager or CEO

---

## 📱 Mobile Responsive

All pages are fully responsive:
- ✅ Phone Inventory with view details modal
- ✅ Products with stock management
- ✅ Swap Management forms
- ✅ Sales forms
- ✅ Customer management
- ✅ Reports and analytics
- ✅ Staff management

No horizontal scrolling on any device! 📱✨

---

**Enjoy your SwapSync system!** 🎉

