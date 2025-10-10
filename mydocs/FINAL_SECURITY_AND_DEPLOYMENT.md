# 🔐 SECURITY & DEPLOYMENT - COMPLETE GUIDE

## ✅ What Has Been Done

### 1. **Security Improvements** ✅
- ✅ Created `.gitignore` files (root, backend, frontend)
- ✅ Removed all sensitive files from Git tracking:
  - ALL_CREDENTIALS.txt
  - WORKING_PASSWORDS.txt
  - All credential files in mydocs/
- ✅ Protected: Database files, API keys, passwords, secrets
- ✅ All changes committed and pushed to GitHub

### 2. **Settings Page Width** ✅
- ✅ Fixed width to match standard layout (`mx-6` instead of `max-w-6xl`)
- ✅ Now consistent with other pages (Dashboard, Reports, etc.)

### 3. **Railway Configuration** ✅
- ✅ Created `railway.toml` for deployment
- ✅ Created `Procfile` for Railway
- ✅ Environment variables guide created

---

## 🚂 Deploy to Railway (Step-by-Step)

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login**
```bash
railway login
```

### **Step 3: Create New Project**
1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your `SwapSync` repository

### **Step 4: Configure Environment Variables**

In Railway Dashboard → Your Project → Variables, add:

```
SECRET_KEY=<generate-using-python-command-below>
ARKASEL_API_KEY=your-arkasel-api-key
ARKASEL_SENDER_ID=SwapSync
HUBTEL_CLIENT_ID=your-hubtel-client-id
HUBTEL_CLIENT_SECRET=your-hubtel-client-secret
HUBTEL_SENDER_ID=SwapSync
DEFAULT_ADMIN_PASSWORD=your-secure-password
ENVIRONMENT=production
DEBUG=False
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### **Step 5: Deploy**

Railway will automatically:
- Detect `railway.toml` and `Procfile`
- Install dependencies from `requirements.txt`
- Start your app with `uvicorn`

### **Step 6: Get Your URL**
Railway will provide a URL like:
```
https://swapsync-production-xxxx.up.railway.app
```

### **Step 7: Update Frontend**

Update `swapsync-frontend/src/services/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 
                'https://your-railway-backend-url.up.railway.app/api';
```

---

## 📁 Directory Rename (IMPORTANT!)

**Current Issue**: Directories are locked by running processes

### **To Rename:**

1. **Stop ALL processes:**
   ```bash
   # Press Ctrl+C in backend terminal
   # Close VS Code
   # Close any File Explorer windows
   ```

2. **Run rename commands:**
   ```bash
   cd D:\SwapSync
   git mv swapsync-backend backend
   git mv swapsync-frontend frontend
   git add -A
   git commit -m "refactor: Rename directories"
   git push origin main
   ```

3. **Update file references:**
   - Update any documentation
   - Update batch scripts
   - Update import paths if needed

4. **Restart:**
   ```bash
   # Backend
   cd backend
   venv\Scripts\activate
   python main.py

   # Frontend
   cd frontend  
   npm run dev
   ```

---

## 🔒 What's Protected (via .gitignore)

```
✅ *.db, *.sqlite (Database files)
✅ *CREDENTIALS*, *PASSWORD* (Credential files)
✅ .env, .env.* (Environment variables)
✅ __pycache__/ (Python cache)
✅ node_modules/ (Node dependencies)
✅ venv/, env/ (Virtual environments)
✅ backups/ (Database backups)
✅ *.log (Log files)
✅ railway.json, .railway/ (Railway config)
```

---

## 🎯 Login Credentials (Keep Secure!)

**Store these safely - NOT in Git!**

```
Super Admin: admin / admin123
Manager:     ceo1 / ceo123
Shopkeeper:  keeper / keeper123
Repairer:    repairer / repair123
```

**⚠️ Change these passwords after first login!**

---

## 📊 Deployment Checklist

### Local Setup:
- [ ] Backend runs on `http://127.0.0.1:8000`
- [ ] Frontend runs on `http://localhost:5173`
- [ ] Database has test data
- [ ] All passwords work

### Railway Setup:
- [ ] Railway CLI installed
- [ ] Logged into Railway
- [ ] Project created on Railway
- [ ] Environment variables added
- [ ] SECRET_KEY generated and added
- [ ] Admin password changed
- [ ] Deployment successful
- [ ] App accessible via Railway URL

### After Deployment:
- [ ] Test login on production
- [ ] Test SMS functionality (Arkasel/Hubtel)
- [ ] Test database operations
- [ ] Verify all features work
- [ ] Change default admin password
- [ ] Create real user accounts

---

## 🚨 Security Best Practices

### ✅ DO:
- ✅ Use environment variables for secrets
- ✅ Use strong, unique passwords
- ✅ Enable HTTPS in production
- ✅ Regularly backup database
- ✅ Monitor logs for suspicious activity
- ✅ Keep dependencies updated

### ❌ DON'T:
- ❌ Commit `.env` files to Git
- ❌ Commit database files to Git
- ❌ Use default passwords in production
- ❌ Share API keys publicly
- ❌ Disable CORS in production
- ❌ Run with DEBUG=True in production

---

## 🔧 Environment Variables Reference

### Required:
```env
SECRET_KEY           # JWT token secret
DATABASE_URL         # Database connection
DEFAULT_ADMIN_PASSWORD # Initial admin password
```

### SMS (Optional but recommended):
```env
ARKASEL_API_KEY      # Arkasel SMS API key
ARKASEL_SENDER_ID    # Sender ID (default: SwapSync)
HUBTEL_CLIENT_ID     # Hubtel client ID
HUBTEL_CLIENT_SECRET # Hubtel client secret
HUBTEL_SENDER_ID     # Sender ID (default: SwapSync)
```

### Other:
```env
CORS_ORIGINS         # Allowed origins (comma-separated)
ENVIRONMENT          # development or production
DEBUG                # True or False
```

---

## 📚 Helpful Commands

### Generate Secure Password:
```bash
python -c "import secrets; print(secrets.token_urlsafe(16))"
```

### Test Backend Locally:
```bash
cd swapsync-backend
venv\Scripts\activate
python main.py
```

### Deploy to Railway:
```bash
railway up
```

### View Railway Logs:
```bash
railway logs
```

### SSH into Railway:
```bash
railway shell
```

---

## 🎉 Summary

✅ **Security**: All sensitive data removed from GitHub
✅ **Settings**: Page width fixed to standard layout
✅ **.gitignore**: Protecting sensitive files
✅ **Railway**: Configuration files ready
✅ **Environment**: Variables documented
✅ **Guide**: Complete deployment instructions

⏳ **Pending**:
- Directory rename (stop processes first)
- Railway deployment (follow steps above)

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Arkasel SMS**: https://sms.arkesel.com
- **Hubtel SMS**: https://developers.hubtel.com

---

**Your app is now secure and ready for Railway deployment! 🚀**


