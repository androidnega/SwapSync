# 🔧 SwapSync CORS & Connection Troubleshooting Guide

**Date:** October 9, 2025  
**Issue:** CORS errors and 500 Internal Server Error

---

## ✅ FIXES APPLIED

I've just updated your backend with better CORS handling:

1. ✅ **Enhanced CORS configuration** - Now explicitly allows both localhost and 127.0.0.1
2. ✅ **Added global exception handler** - Ensures errors are properly logged
3. ✅ **Added validation error handler** - Better error messages

---

## 🚀 STEP-BY-STEP DEBUGGING

### **Step 1: Restart Your Backend** ⚡

The CORS changes require a backend restart:

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
cd swapsync-backend
.\venv\Scripts\activate
uvicorn main:app --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

---

### **Step 2: Test Backend Directly** 🧪

Before testing from React, verify the backend works:

**Open your browser and go to:**
```
http://127.0.0.1:8000/
```

**Expected response:**
```json
{
  "message": "Welcome to SwapSync API",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/ping"
}
```

**If this doesn't work:**
- ❌ Backend is not running
- ❌ Port 8000 is blocked/in use
- ❌ Check terminal for error messages

---

### **Step 3: Check if You're Logged In** 🔐

The **500 error** is most likely caused by **missing or invalid authentication token**.

**Test authentication:**

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Check localStorage:**
   ```javascript
   localStorage.getItem('token')
   ```

**If you see `null` or an old token:**
- ✅ You need to log in!
- Go to: `http://localhost:5173/login`
- Login with: `admin / admin123` (or any valid user)

**After successful login:**
```javascript
localStorage.getItem('token')
// Should show: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### **Step 4: Verify Frontend is Sending Token** 📤

**Check Network tab in DevTools:**

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Try to load dashboard**
4. **Click on the `/api/dashboard/cards` request**
5. **Check Request Headers:**

**Should see:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If Authorization header is missing:**
- ❌ Frontend is not sending the token
- Check `src/services/api.ts` configuration

---

### **Step 5: Test with Postman/Thunder Client** 🔬

**Direct API test:**

```
GET http://127.0.0.1:8000/api/dashboard/cards
Headers:
  Authorization: Bearer YOUR_TOKEN_HERE
```

**How to get token:**
```
POST http://127.0.0.1:8000/api/auth/login
Body (x-www-form-urlencoded):
  username: admin
  password: admin123
```

**Response will include:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

Use this token in subsequent requests.

---

## 🔍 COMMON ISSUES & SOLUTIONS

### **Issue 1: "No 'Access-Control-Allow-Origin' header"**

**Cause:** CORS not configured or backend not running

**Solution:**
1. ✅ **Already fixed!** Restart backend (see Step 1)
2. If still occurs, check backend logs for startup errors

---

### **Issue 2: "500 Internal Server Error"**

**Cause:** Usually authentication failure or database issue

**Solutions:**

**A) Check backend logs:**
```bash
# In your backend terminal, you should see error details
# Look for lines starting with ❌
```

**B) Common causes:**
- **No token sent** → Log in first
- **Invalid token** → Log in again
- **Database error** → Check if `swapsync.db` exists
- **Missing dependencies** → Run `pip install -r requirements.txt`

---

### **Issue 3: "401 Unauthorized"**

**Cause:** Token is invalid or expired

**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Log in again
3. New token will be stored automatically

---

### **Issue 4: Frontend can't connect to backend**

**Cause:** Backend not running or wrong URL

**Check:**
```bash
# In backend terminal, ensure you see:
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Also verify frontend API configuration:**

**File:** `swapsync-frontend/src/services/api.ts`

Should have:
```typescript
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## 🧪 COMPLETE TEST PROCEDURE

**Run these tests in order:**

### **Test 1: Backend Health Check** ✅
```bash
# In browser:
http://127.0.0.1:8000/ping

# Expected:
{"status": "ok", "message": "Server is running"}
```

### **Test 2: Login** ✅
```bash
# In frontend:
http://localhost:5173/login

# Use: admin / admin123
# Should redirect to dashboard
```

### **Test 3: Dashboard Load** ✅
```bash
# After login:
http://localhost:5173/

# Should show dashboard cards
# Check browser console for errors
```

### **Test 4: API Call from Console** ✅
```javascript
// In browser console (F12):
fetch('http://127.0.0.1:8000/api/dashboard/cards', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log)

// Should show: {cards: [...], user_role: "...", total_cards: ...}
```

---

## 📋 CHECKLIST FOR COMMON SETUP ISSUES

**Before asking for help, verify:**

- [ ] Backend is running (`uvicorn main:app --reload`)
- [ ] Backend shows no errors in terminal
- [ ] Can access http://127.0.0.1:8000/ in browser
- [ ] Frontend is running (`npm run electron:dev` or `npm run dev`)
- [ ] Can access http://localhost:5173/ in browser
- [ ] Have logged in at least once
- [ ] Token exists in localStorage
- [ ] Browser console shows no red errors (except CORS, which we're fixing)
- [ ] Both terminals (backend + frontend) are open and running

---

## 🔧 ADVANCED DEBUGGING

### **View Backend Logs in Detail:**

The new exception handler will print errors like:
```
❌ Unhandled exception: Could not validate credentials
📍 Path: /api/dashboard/cards
Traceback (most recent call last):
  ...
```

### **Enable Debug Mode:**

**File:** `swapsync-backend/app/core/config.py`

Already enabled:
```python
DEBUG: bool = True
```

### **Check Database:**

```bash
cd swapsync-backend
sqlite3 swapsync.db

sqlite> SELECT COUNT(*) FROM users;
# Should show number of users

sqlite> SELECT username, role FROM users;
# Should show: admin, ceo1, keeper, repairer

sqlite> .quit
```

---

## 🚨 IF NOTHING WORKS

### **Nuclear Option: Fresh Start** 💣

```bash
# 1. Stop both backend and frontend (Ctrl+C)

# 2. Backend:
cd swapsync-backend
.\venv\Scripts\activate
pip install --upgrade -r requirements.txt
uvicorn main:app --reload

# 3. Frontend (new terminal):
cd swapsync-frontend
npm install
npm run dev
# OR
npm run electron:dev

# 4. Clear browser data:
# - Press F12 (DevTools)
# - Right-click refresh button → "Empty Cache and Hard Reload"
# - Or: localStorage.clear() in console

# 5. Try login again
```

---

## 📞 STILL STUCK?

**Share these details:**

1. **Backend logs** (copy the terminal output)
2. **Browser console errors** (F12 → Console tab, screenshot)
3. **Network tab** (F12 → Network, click failed request, screenshot)
4. **What you're trying to do** (e.g., "load dashboard after login")

---

## ✅ SUCCESS INDICATORS

**You know it's working when:**

1. ✅ Backend terminal shows: `INFO: "GET /api/dashboard/cards HTTP/1.1" 200 OK`
2. ✅ Browser console shows NO red errors
3. ✅ Dashboard loads with cards visible
4. ✅ Network tab shows 200 status for API calls
5. ✅ No CORS errors in console

---

## 🎯 MOST COMMON FIX

**90% of the time, the issue is:**

```bash
# You forgot to log in! 😅

# Solution:
1. Go to http://localhost:5173/login
2. Enter: admin / admin123
3. Click Login
4. Dashboard should load automatically
```

---

## 🎊 AFTER FIXING

Once it works:

1. ✅ Test all pages (Dashboard, Swaps, Sales, Repairs, Reports)
2. ✅ Test creating a transaction
3. ✅ Test downloading PDFs (new feature!)
4. ✅ Test staff filter in Reports (new feature!)

---

**Updated:** October 9, 2025  
**CORS Configuration:** ✅ Fixed  
**Exception Handling:** ✅ Enhanced  
**Status:** Ready for testing!

