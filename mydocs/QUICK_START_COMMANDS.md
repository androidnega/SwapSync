# ⚡ SwapSync - QUICK START COMMANDS

**Use these commands if servers won't start automatically**

---

## 🚀 METHOD 1: DOUBLE-CLICK THE BAT FILE

### **Backend:**
1. Open File Explorer
2. Navigate to: `D:\SwapSync`
3. **Double-click:** `START_BACKEND.bat`
4. A terminal window will open
5. ✅ Backend running!

### **Frontend:**
1. Open a **new terminal** (PowerShell or CMD)
2. Run:
   ```powershell
   cd D:\SwapSync\swapsync-frontend
   npm run electron:dev
   ```
3. ✅ Electron window opens!

---

## 🚀 METHOD 2: MANUAL COMMANDS (PowerShell)

### **Terminal 1 - Backend:**
```powershell
cd D:\SwapSync\swapsync-backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started server process
INFO:     Waiting for application startup.
✅ Database initialized successfully!
INFO:     Application startup complete.
```

### **Terminal 2 - Frontend:**
```powershell
cd D:\SwapSync\swapsync-frontend
npm run electron:dev
```

**Expected:**
- Electron window opens automatically
- Shows login page

---

## 🚀 METHOD 3: USING CMD (NOT PowerShell)

### **Terminal 1 - Backend:**
```cmd
cd D:\SwapSync\swapsync-backend
venv\Scripts\activate
uvicorn main:app --reload
```

### **Terminal 2 - Frontend:**
```cmd
cd D:\SwapSync\swapsync-frontend
npm run electron:dev
```

---

## ✅ VERIFY BACKEND IS RUNNING:

### **Test 1: Open in Browser**
```
http://127.0.0.1:8000/
```

**Should show:**
```json
{
  "message": "Welcome to SwapSync API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

### **Test 2: Check API Docs**
```
http://127.0.0.1:8000/docs
```

**Should show:** FastAPI interactive documentation

---

## 🔍 TROUBLESHOOTING:

### **Error: "Could not import module 'main'"**
**Cause:** Running uvicorn from wrong directory

**Fix:**
```powershell
cd D:\SwapSync\swapsync-backend
# Make sure you're IN the backend folder before running uvicorn!
```

### **Error: "ModuleNotFoundError: No module named 'weasyprint'"**
**Fix:**
```powershell
cd D:\SwapSync\swapsync-backend
.\venv\Scripts\Activate.ps1
pip install weasyprint
```

### **Error: "Port 8000 already in use"**
**Fix:**
```powershell
# Find and kill the process using port 8000
netstat -ano | findstr :8000
# Note the PID, then:
taskkill /PID <PID_NUMBER> /F
```

### **CORS Errors in Frontend**
**Cause:** Backend is NOT actually running

**Check:**
1. Is there a terminal window with backend logs?
2. Can you access `http://127.0.0.1:8000/` in browser?
3. If NO to either → Backend is not running!

**Fix:** Start backend using Method 1, 2, or 3 above

---

## 🎯 WHEN EVERYTHING IS WORKING:

You'll see:

### **Backend Terminal:**
```
INFO:     127.0.0.1:xxxxx - "GET /api/auth/me HTTP/1.1" 200 OK
INFO:     127.0.0.1:xxxxx - "GET /api/dashboard/cards HTTP/1.1" 200 OK
```

### **Frontend:**
- ✅ Login page loads
- ✅ Can login successfully
- ✅ Dashboard shows cards
- ✅ No CORS errors
- ✅ No 401/500 errors

---

## 💡 PRO TIP:

**Keep both terminals open side by side!**

```
┌─────────────────────┬─────────────────────┐
│  Backend Terminal   │  Frontend Terminal  │
│  (uvicorn running)  │  (npm/electron)     │
│                     │                     │
│  Port 8000          │  Port 5173          │
└─────────────────────┴─────────────────────┘
```

This way you can see logs from both servers!

---

## 🎊 READY TO USE!

**Easiest way:**
1. **Double-click** `START_BACKEND.bat`
2. Open **new terminal**, run: `cd swapsync-frontend && npm run electron:dev`
3. **Login** when Electron opens
4. **Enjoy SwapSync!** 🚀

---

**Created:** October 9, 2025  
**Status:** ✅ Ready to use  
**Choose:** Any method above that works for you!

