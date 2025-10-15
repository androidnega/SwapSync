# 🚀 Deploy Backend to Vercel (Fix CORS Issue)

## ✅ Changes Made:
1. ✅ Enhanced FastAPI CORS middleware (main.py)
2. ✅ Removed conflicting headers from vercel.json
3. ✅ Added production domains to allowed origins
4. ✅ Pushed to GitHub (commit: db771c9)

---

## 🔧 How to Deploy to Vercel:

### Option 1: Auto-Deploy from GitHub (Recommended)

If your Vercel project is connected to GitHub, it will **auto-deploy** when you push changes.

1. **Check Vercel Dashboard**:
   - Go to: https://vercel.com/dashboard
   - Find your `swapsync-backend` or `api-digitstec` project
   - Check if deployment is in progress
   - Wait for deployment to complete (usually 2-3 minutes)

2. **Verify Deployment**:
   - Once deployed, visit: https://api.digitstec.store/api/ping
   - Should return: `{"message": "pong"}`

---

### Option 2: Manual Deploy via Vercel CLI

If auto-deploy is not working:

```bash
# Navigate to backend directory
cd backend

# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow the prompts
```

---

### Option 3: Redeploy from Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your backend project
3. Click "Deployments" tab
4. Click the three dots (...) on the latest deployment
5. Click "Redeploy"
6. Select "Use existing Build Cache: NO"
7. Click "Redeploy"

---

## ✅ How to Verify CORS is Fixed:

### 1. Check Backend Logs:
```bash
# In Vercel Dashboard > Deployments > View Function Logs
# Look for:
🌐 CORS Allowed Origins:
   ✅ https://swapsync.digitstec.store
   ✅ https://api.digitstec.store
   ✅ https://digitstec.store
```

### 2. Test from Browser:
```javascript
// Open browser console on https://swapsync.digitstec.store
// Run this command:
fetch('https://api.digitstec.store/api/ping', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => console.log('✅ CORS WORKING:', data))
.catch(err => console.error('❌ CORS ERROR:', err));
```

**Expected Result:**
```
✅ CORS WORKING: {message: "pong"}
```

### 3. Check Network Tab:
- Open DevTools (F12) on https://swapsync.digitstec.store
- Go to Network tab
- Reload page
- Click on any API request (e.g., `/api/dashboard/cards`)
- Check Response Headers:
  ```
  ✅ access-control-allow-origin: https://swapsync.digitstec.store
  ✅ access-control-allow-credentials: true
  ✅ Status: 200 OK
  ```

---

## ❌ Troubleshooting:

### Issue 1: Still seeing CORS error after deployment
**Solution:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard reload page (Ctrl + Shift + R)
3. Try in incognito/private mode

### Issue 2: Deployment failed
**Solution:**
1. Check Vercel build logs
2. Verify all requirements in `requirements.txt`
3. Check Python version compatibility

### Issue 3: 500 Internal Server Error
**Solution:**
1. Check Vercel function logs
2. Verify database connection
3. Check environment variables

---

## 📞 Support:

If CORS error persists after deployment:
1. Share Vercel deployment URL
2. Share browser console error screenshot
3. Share Network tab screenshot showing request headers

---

## 🎯 Quick Deploy Command:

```bash
# One command to deploy
cd backend && vercel --prod
```

After deployment completes (~2 minutes), the CORS issue should be resolved! ✅

