# SwapSync Deployment Documentation

This folder contains comprehensive deployment documentation for deploying SwapSync to production.

---

## 📚 Documentation Files

### 1. **DEPLOYMENT_GUIDE.md** (Main Reference)
📖 **Comprehensive deployment guide with detailed instructions**

**Contents:**
- Complete backend and frontend audits
- Detailed environment variable configurations
- Step-by-step deployment instructions
- Troubleshooting guide
- Security best practices
- Monitoring and maintenance guidelines

**Use this when:** You need detailed explanations and comprehensive instructions.

---

### 2. **DEPLOYMENT_QUICK_REFERENCE.txt** (Quick Lookup)
⚡ **Quick reference guide for fast lookups**

**Contents:**
- Essential configurations (copy-paste ready)
- Command cheat sheet
- Quick troubleshooting tips
- Environment variable templates

**Use this when:** You need to quickly find a command or configuration.

---

### 3. **DEPLOYMENT_CHECKLIST.md** (Task Tracker)
✅ **Interactive checklist for tracking deployment progress**

**Contents:**
- Pre-deployment tasks
- Security setup
- Step-by-step deployment checklist
- Testing procedures
- Post-deployment configuration
- Maintenance schedule

**Use this when:** You're actively deploying and need to track your progress.

---

### 4. **backend/prepare_for_deployment.md** (Technical Guide)
🔧 **Backend-specific technical preparation guide**

**Contents:**
- Database migration instructions (SQLite → PostgreSQL)
- Code changes required
- Local testing procedures
- PostgreSQL provider comparisons
- File storage considerations

**Use this when:** You need to prepare the backend code for production.

---

### 5. **frontend/vercel.json** (Config File)
⚙️ **Vercel deployment configuration**

**Purpose:** 
- Configures Vite build settings
- Sets up routing rewrites for SPA
- Optimizes asset caching

**Status:** ✅ Already created and ready to use

---

## 🚀 Quick Start (First Time Deployers)

### Step 1: Read the Overview
Start with **DEPLOYMENT_GUIDE.md** Section 1-3 to understand:
- What needs to be deployed
- Critical issues to fix
- Required configurations

### Step 2: Prepare Your Code
Follow **backend/prepare_for_deployment.md** to:
- Add PostgreSQL support ✅ (Already done!)
- Update database configuration ✅ (Already done!)
- Test locally (optional but recommended)

### Step 3: Use the Checklist
Open **DEPLOYMENT_CHECKLIST.md** and:
- Check off completed tasks (some are already done!)
- Follow the deployment steps
- Track your progress

### Step 4: Keep Quick Reference Handy
Keep **DEPLOYMENT_QUICK_REFERENCE.txt** open for:
- Copy-paste commands
- Environment variable templates
- Quick troubleshooting

---

## ⚡ Already Completed

The following tasks have already been completed for you:

✅ **Backend Changes:**
- Added `psycopg2-binary>=2.9.0` to `requirements.txt`
- Updated `backend/app/core/database.py` to support both SQLite and PostgreSQL
- Code now automatically detects database type

✅ **Frontend Configuration:**
- Created `frontend/vercel.json` with proper Vite configuration
- Configured SPA routing
- Optimized asset caching

---

## 🎯 What You Need to Do

### 1. Set Up PostgreSQL Database
Choose one:
- **Render PostgreSQL** (Recommended - integrated)
- **Supabase** (Free tier available)
- **Neon** (Serverless PostgreSQL)

### 2. Generate Credentials
```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate admin password
python -c "import secrets, string; chars = string.ascii_letters + string.digits + string.punctuation; print(''.join(secrets.choice(chars) for _ in range(24)))"
```

### 3. Deploy Backend (Render)
- Create Web Service
- Set environment variables
- Deploy

### 4. Deploy Frontend (Vercel)
- Import repository
- Set VITE_API_URL
- Deploy

### 5. Connect Them
- Update CORS_ORIGINS with Vercel URL
- Test everything

---

## 📋 Deployment Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   FRONTEND   │         │   BACKEND    │                 │
│  │   (Vercel)   │ ──────> │   (Render)   │                 │
│  │              │  HTTPS  │              │                 │
│  │  React/Vite  │  API    │   FastAPI    │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│                                   │ SQL                      │
│                                   ▼                          │
│                          ┌────────────────┐                 │
│                          │   PostgreSQL   │                 │
│                          │   (Database)   │                 │
│                          └────────────────┘                 │
│                                                              │
│  Environment Variables:                                      │
│  Frontend: VITE_API_URL                                     │
│  Backend: DATABASE_URL, SECRET_KEY, CORS_ORIGINS           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Required Environment Variables

### Backend (Render)
```env
# Critical
SECRET_KEY=<generate-secure-key>
DATABASE_URL=postgresql://user:pass@host/db
CORS_ORIGINS=https://your-app.vercel.app,https://*.vercel.app
DEBUG=False

# Optional
ARKASEL_API_KEY=<sms-key>
DEFAULT_ADMIN_PASSWORD=<secure-password>
```

### Frontend (Vercel)
```env
# Critical
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## ⚠️ Critical Issues (Must Fix Before Deployment)

### 1. Database Migration
❌ **Problem:** SQLite won't persist on Render
✅ **Solution:** Already implemented PostgreSQL support
📝 **Action:** Set up PostgreSQL database and configure DATABASE_URL

### 2. CORS Configuration
❌ **Problem:** Hardcoded localhost origins
✅ **Solution:** Use CORS_ORIGINS environment variable
📝 **Action:** Add Vercel URL to CORS_ORIGINS

### 3. Security
❌ **Problem:** Default credentials and debug mode
✅ **Solution:** Environment variables prepared
📝 **Action:** Generate and set secure credentials

---

## 🧪 Testing Your Deployment

After deployment, test:

### Backend Health
```bash
# Should return JSON with status: healthy
curl https://your-backend.onrender.com/ping

# Visit API docs
https://your-backend.onrender.com/docs
```

### Frontend
1. Visit your Vercel URL
2. Open browser DevTools → Console
3. Look for errors (especially CORS)
4. Try logging in with admin credentials
5. Test core features

### Database
1. Connect to your PostgreSQL database
2. Run: `\dt` to see tables
3. Verify admin user exists

---

## 📖 Reading Order

For first-time deployment, read in this order:

1. **This file** (DEPLOYMENT_README.md) - Overview ✓ You are here
2. **DEPLOYMENT_CHECKLIST.md** - Start checking off tasks
3. **DEPLOYMENT_QUICK_REFERENCE.txt** - Keep handy for commands
4. **DEPLOYMENT_GUIDE.md** - Reference for detailed explanations
5. **backend/prepare_for_deployment.md** - If you need backend details

---

## 🆘 Getting Help

### If Something Goes Wrong

1. **Check Logs:**
   - Render: Dashboard → Your Service → Logs
   - Vercel: Dashboard → Your Project → Deployments → View Logs

2. **Common Issues:**
   - See "Troubleshooting" section in DEPLOYMENT_GUIDE.md
   - Check DEPLOYMENT_QUICK_REFERENCE.txt for quick fixes

3. **Support:**
   - Render: https://render.com/support
   - Vercel: https://vercel.com/support

---

## ✅ Success Indicators

Your deployment is successful when:

- ✅ Backend `/ping` returns status: healthy
- ✅ Frontend loads without console errors
- ✅ You can log in with admin credentials
- ✅ Data persists across page reloads
- ✅ All features work as expected
- ✅ No CORS errors in browser

---

## 🎉 After Successful Deployment

1. **Document Your Deployment:**
   - Save your environment variables (securely)
   - Note your deployment URLs
   - Document any custom configurations

2. **Set Up Monitoring:**
   - Enable Render health checks
   - Configure Vercel analytics
   - Set up alerts for downtime

3. **Plan Maintenance:**
   - Schedule regular updates
   - Set up database backups
   - Plan security audits

4. **Share with Team:**
   - Provide deployment URLs
   - Share admin credentials (securely)
   - Document any special procedures

---

## 📊 Deployment Files Summary

| File | Purpose | When to Use |
|------|---------|-------------|
| DEPLOYMENT_GUIDE.md | Comprehensive guide | Need detailed explanations |
| DEPLOYMENT_QUICK_REFERENCE.txt | Quick commands | Need fast lookup |
| DEPLOYMENT_CHECKLIST.md | Task tracker | Actively deploying |
| backend/prepare_for_deployment.md | Technical prep | Backend code changes |
| frontend/vercel.json | Config file | Auto-used by Vercel |

---

## 🚦 Deployment Status

Current status of deployment preparation:

- ✅ PostgreSQL support added to backend
- ✅ Database configuration updated
- ✅ Vercel configuration created
- ⏳ Database setup (your action needed)
- ⏳ Environment variables (your action needed)
- ⏳ Backend deployment (your action needed)
- ⏳ Frontend deployment (your action needed)
- ⏳ Testing (your action needed)

**Next Step:** Set up PostgreSQL database and prepare environment variables

---

**Need help?** Start with DEPLOYMENT_CHECKLIST.md and check items off as you go!

**Questions?** See the troubleshooting section in DEPLOYMENT_GUIDE.md

**Good luck with your deployment! 🚀**

---

*Created: October 10, 2025*  
*SwapSync v1.0.0*

