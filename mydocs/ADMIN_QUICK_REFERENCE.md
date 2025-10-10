# 🚀 SYSTEM ADMIN - QUICK REFERENCE CARD

**Login:** `admin / admin123`

---

## 📍 **SIDEBAR (6 ITEMS):**

```
📊 Dashboard        → System overview
👥 CEO Management   → Create/Edit/Delete CEOs
👁️ Audit Access    → View CEO data with audit code
🖥️ System Logs     → Activity logs
💾 Database        → Backups, CEO Lock/Export
⚙️ Settings        → SMS, Maintenance
```

---

## ⚙️ **SETTINGS PAGE**

**What's Here:**
- ✅ SMS Configuration (Twilio, MessageBird, Africa's Talking, Hubtel)
- ✅ Maintenance Mode (Enable/Disable)
- ✅ System Information

**Common Actions:**
```
Configure SMS → Choose provider → Enter API key → Save
Enable Maintenance → All users see "System under maintenance"
```

---

## 💾 **DATABASE PAGE**

**What's Here:**
- ✅ Database Backups (Create, Restore, Delete)
- ✅ CEO Management (Lock/Unlock, Export CSV)
- ✅ Database Tables List
- ✅ System Statistics

**Common Actions:**

### **Create Backup:**
```
Click "Create Backup" → Wait → Backup appears in list
```

### **Export CEOs:**
```
Click "Export CEOs (CSV)" → CSV downloads → Open in Excel
```

### **Lock CEO:**
```
Find CEO → Click "Lock" → Confirm
→ CEO + ALL staff locked
→ Cannot login until unlocked
```

### **Unlock CEO:**
```
Find locked CEO → Click "Unlock" → Confirm
→ CEO + ALL staff can login again
```

---

## 👥 **CEO MANAGEMENT PAGE**

**What's Here:**
- ✅ List all CEOs
- ✅ Create new CEOs (with company name)
- ✅ Edit CEO details
- ✅ Reset CEO passwords
- ✅ Delete CEOs

**Create CEO:**
```
Click "Create New CEO"
→ Full Name: John Doe
→ Company Name: TechFix Ghana ← Required!
→ Username: johndoe
→ Email: john@techfix.gh
→ Password: ceo123
→ Click "Create CEO"
```

**Reset Password:**
```
Find CEO → Click [🔑] → Enter new password → Save
```

---

## 👁️ **AUDIT ACCESS PAGE**

**What's Here:**
- ✅ View all CEOs
- ✅ Request audit access with CEO's audit code
- ✅ View complete CEO business data

**Access CEO Data:**
```
Select CEO → Enter audit code (ask CEO for it)
→ View: Business stats, Staff, Activity logs
```

---

## 🔒 **LOCKED CEO BEHAVIOR:**

**What Locked CEO Sees:**
```
❌ "Your account has been locked."
❌ "Please contact administrator."
❌ Cannot login
```

**What Happens:**
- ✅ CEO locked
- ✅ ALL their staff locked
- ✅ Cannot access system
- ✅ Must contact admin to unlock

---

## 📊 **CSV EXPORT FORMAT:**

```csv
ID,Company Name,CEO Name,Username,Email,Status,Created At
1,"TechFix Ghana","John Doe",johndoe,john@techfix.gh,Active,"2025-10-09"
2,"SwapSync Ltd","Jane Smith",janesmith,jane@swapsync.com,Locked,"2025-10-09"
```

**Use For:**
- ✅ Audit reports
- ✅ Compliance documentation
- ✅ Company directory
- ✅ Excel analysis

---

## ⚡ **QUICK ACTIONS:**

**Daily:**
- ✅ Check System Logs for unusual activity
- ✅ Monitor CEO activity via Audit Access

**Weekly:**
- ✅ Create database backup
- ✅ Export CEOs for records

**As Needed:**
- ✅ Lock problematic CEOs
- ✅ Reset CEO passwords
- ✅ Enable maintenance mode for updates

---

## 🆘 **TROUBLESHOOTING:**

**CEO Can't Login:**
```
Check Database page → See if CEO is locked
→ If locked: Click "Unlock"
→ If not: Reset password in CEO Management
```

**Need CEO Report:**
```
Database page → Click "Export CEOs (CSV)"
→ Open in Excel → Filter/Sort as needed
```

**System Maintenance:**
```
Settings page → Click "Enable Maintenance Mode"
→ Enter reason → Confirm
→ All users see maintenance message
→ After done: Click "Disable Maintenance Mode"
```

---

## 📞 **COMMON TASKS:**

### **Lock CEO for Non-Payment:**
```
1. Database page
2. Find CEO by company name
3. Click "Lock"
4. Confirm
5. Notify CEO to contact you
```

### **Monthly Audit:**
```
1. Database page
2. Click "Export CEOs (CSV)"
3. Click "Create Backup"
4. Audit Access page
5. Review each CEO's data
6. Save reports
```

### **New CEO Onboarding:**
```
1. CEO Management page
2. Click "Create New CEO"
3. Enter company details
4. Send credentials
5. Go to their Audit Code page
6. Note their audit code for records
```

---

**Need help? Check full documentation in `mydocs/` folder!**

