# 🔐 Environment Variables Setup Guide

## ✅ Security Improvements Applied

All sensitive data has been removed from GitHub and protected with `.gitignore` files!

---

## 📋 Backend Environment Variables

Create a file `swapsync-backend/.env` (or `backend/.env` after rename):

```env
# Database
DATABASE_URL=sqlite:///./swapsync.db

# JWT Secret (CHANGE THIS!)
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-railway-domain.up.railway.app

# SMS Configuration - Arkasel (Primary)
ARKASEL_API_KEY=your-arkasel-api-key-here
ARKASEL_SENDER_ID=SwapSync

# SMS Configuration - Hubtel (Fallback)
HUBTEL_CLIENT_ID=your-hubtel-client-id-here
HUBTEL_CLIENT_SECRET=your-hubtel-client-secret-here
HUBTEL_SENDER_ID=SwapSync

# Default Admin User
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@swapsync.local
DEFAULT_ADMIN_PASSWORD=change-this-immediately

# Environment
ENVIRONMENT=production
DEBUG=False
```

---

## 🚂 Railway Deployment Setup

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Initialize Railway Project
```bash
cd swapsync-backend  # or backend after rename
railway init
```

### Step 4: Add Environment Variables in Railway Dashboard

Go to your Railway project → Variables → Add these:

```
SECRET_KEY = generate-random-string-here
ARKASEL_API_KEY = your-arkasel-key
ARKASEL_SENDER_ID = SwapSync
HUBTEL_CLIENT_ID = your-hubtel-id
HUBTEL_CLIENT_SECRET = your-hubtel-secret
HUBTEL_SENDER_ID = SwapSync
DEFAULT_ADMIN_PASSWORD = your-secure-password
ENVIRONMENT = production
DEBUG = False
```

### Step 5: Deploy Backend
```bash
railway up
```

### Step 6: Deploy Frontend (if needed)

For frontend on Railway:
```bash
cd swapsync-frontend  # or frontend after rename
railway init
railway up
```

---

## 🔒 What's Protected Now

✅ **Database files** (`.db`, `.sqlite`)
✅ **Credentials files** (`*CREDENTIALS*`, `*PASSWORD*`)
✅ **Environment variables** (`.env`, `.env.*`)
✅ **API keys** and secrets
✅ **Sensitive logs**
✅ **Backup files**

---

## 📁 Directory Rename Instructions

**NOTE**: Both directories are currently locked by running processes.

### To Rename Directories:

1. **Stop the Backend Server**
   - Find the terminal running the backend
   - Press `Ctrl+C` to stop it

2. **Close VS Code or any IDE** (they lock directories)

3. **Close any File Explorer** windows showing these directories

4. **Run these commands**:
```bash
cd D:\SwapSync
git mv swapsync-backend backend
git mv swapsync-frontend frontend
git add -A
git commit -m "refactor: Rename directories to backend and frontend"
git push origin main
```

5. **Update references** in documentation and scripts

6. **Restart servers**:
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

## 🎯 Railway-Specific Configuration

### Backend `railway.toml` (Create this file)

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "backend"
```

### Frontend Deployment

If deploying frontend separately on Railway:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run dev"
```

---

## 🔐 Generate Secure SECRET_KEY

Use Python to generate a secure key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output to your `.env` file or Railway environment variables.

---

## ✅ Checklist

- [ ] Created `.env` file in backend (not committed to Git)
- [ ] Added all environment variables to `.env`
- [ ] Changed `SECRET_KEY` to a secure random string
- [ ] Changed `DEFAULT_ADMIN_PASSWORD` to a secure password
- [ ] Added Railway environment variables in dashboard
- [ ] Tested backend locally with `.env`
- [ ] Deployed to Railway
- [ ] Verified app works on Railway
- [ ] Stopped backend and closed IDE
- [ ] Renamed directories using `git mv`
- [ ] Committed and pushed rename changes

---

## 🚨 Security Reminders

⚠️ **NEVER** commit `.env` files to Git
⚠️ **NEVER** commit database files to Git
⚠️ **NEVER** commit credentials/passwords to Git
⚠️ **ALWAYS** use environment variables for secrets
⚠️ **ALWAYS** use different passwords in production

---

## 📊 Current Status

✅ **Security**: All sensitive files removed from Git
✅ **Settings Page**: Width fixed to standard layout
✅ **.gitignore**: Created for root, backend, and frontend
✅ **Git**: All changes committed and pushed

⏳ **Pending**: Directory rename (requires stopping processes)

---

**Need help?** Check the files in your project:
- `.gitignore` - What's being ignored
- This guide - How to set up environment variables
- Railway docs - https://docs.railway.app


