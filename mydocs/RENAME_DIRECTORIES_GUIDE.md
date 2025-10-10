# 📁 Directory Renaming Guide

## ✅ Status
- **Passwords Fixed**: ✅ All user passwords are now working!
- **Changes Committed**: ✅ All new features committed to Git
- **Changes Pushed**: ✅ Pushed to GitHub successfully

---

## 🔄 How to Rename Directories

### Current Issue:
The backend server is running and has the `swapsync-backend` directory locked, preventing the rename.

### Solution Steps:

#### **Step 1: Stop the Backend Server**
Press `Ctrl+C` in the terminal where the backend is running to stop it.

You should see output like:
```
INFO: Shutting down
INFO: Finished server process
```

#### **Step 2: Rename Directories Using Git**
Once the server is stopped, run these commands:

```bash
cd D:\SwapSync
git mv swapsync-backend backend
git mv swapsync-frontend frontend
```

#### **Step 3: Commit the Rename**
```bash
git add -A
git commit -m "refactor: Rename swapsync-backend to backend and swapsync-frontend to frontend"
git push origin main
```

#### **Step 4: Update File References**
After renaming, update these files to reflect the new directory names:

**1. Update `START_BACKEND.bat`:**
```batch
@echo off
cd backend
call venv\Scripts\activate
python main.py
pause
```

**2. Update any documentation** that references the old directory names.

#### **Step 5: Restart the Backend**
```bash
cd backend
venv\Scripts\activate
python main.py
```

---

## 📋 **WORKING LOGIN CREDENTIALS**

✅ **All passwords have been reset and are working!**

| Role | Username | Password | Email |
|------|----------|----------|-------|
| **Super Admin** | `admin` | `admin123` | admin@swapsync.local |
| **Manager/CEO** | `ceo1` | `ceo123` | ceo@dailycoins.local |
| **Shop Keeper** | `keeper` | `keeper123` | keeper@swapsync.local |
| **Repairer** | `repairer` | `repair123` | repairer@swapsync.local |

### 🌐 Login URL:
**Frontend**: `http://localhost:5173/login`

---

## ✅ What Was Fixed:

1. **Password Issue**: All user passwords were re-hashed correctly using bcrypt
2. **Database**: Password hashes updated in the database
3. **Verification**: All accounts tested and working
4. **Git**: All changes committed and pushed to GitHub

---

## 🚀 Quick Start After Rename:

### Start Backend:
```bash
cd D:\SwapSync\backend
venv\Scripts\activate
python main.py
```

### Start Frontend:
```bash
cd D:\SwapSync\frontend
npm run dev
```

---

## 📊 Project Structure (After Rename):

```
D:\SwapSync\
├── backend/               # ← Renamed from swapsync-backend
│   ├── app/
│   ├── venv/
│   ├── main.py
│   ├── swapsync.db
│   └── requirements.txt
│
├── frontend/              # ← Renamed from swapsync-frontend
│   ├── src/
│   ├── public/
│   ├── node_modules/
│   └── package.json
│
└── mydocs/
    └── (documentation files)
```

---

## ⚠️ Important Notes:

1. **Always stop the backend** before renaming directories
2. **Use `git mv`** instead of manual rename to preserve Git history
3. **Commit and push** after renaming
4. **Update batch scripts** and documentation

---

## ✅ Summary

**What's Done:**
- ✅ All new UI features implemented
- ✅ SMS service with Arkasel/Hubtel
- ✅ All passwords fixed and working
- ✅ Changes committed to Git
- ✅ Changes pushed to GitHub

**What's Next:**
1. Stop backend server (Ctrl+C)
2. Rename directories using `git mv`
3. Commit and push
4. Restart servers with new paths

---

**Need Help?** All credentials are now working! Just login with:
- Username: `admin`
- Password: `admin123`

🎉 **Your SwapSync system is ready to go!**

