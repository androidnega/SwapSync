# SwapSync cPanel Deployment Guide

## 🚀 Complete Deployment Guide for digitstec.store

This guide provides step-by-step instructions to deploy SwapSync to your cPanel hosting using Git.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Method 1: Git Deployment (Recommended)](#method-1-git-deployment-recommended)
3. [Method 2: Manual Upload](#method-2-manual-upload)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Testing Your Deployment](#testing-your-deployment)
6. [Updating Your Deployment](#updating-your-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need:
- ✅ cPanel hosting account with Python 3.9+ support
- ✅ Domain: `digitstec.store` pointed to your cPanel hosting
- ✅ SSH or Terminal access to cPanel
- ✅ GitHub repository: `https://github.com/androidnega/SwapSync.git`
- ✅ cPanel username (e.g., `manuelc8`)

### Repository Structure:
```
SwapSync/
├── backend/              ← FastAPI application (production-ready)
│   ├── .htaccess         ← cPanel/Passenger configuration
│   ├── passenger_wsgi.py ← WSGI entry point
│   ├── app/              ← Core application code
│   ├── main.py           ← FastAPI entry point
│   ├── requirements.txt  ← Python dependencies
│   └── env.template      ← Environment variables template
│
├── frontend/             ← React application
│   ├── .htaccess         ← Static file serving configuration
│   ├── src/              ← React source code
│   ├── public/           ← Static assets
│   └── package.json      ← Node dependencies
│
└── CPANEL_DEPLOYMENT_GUIDE.md ← This file
```

---

## Method 1: Git Deployment (Recommended)

### Step 1: Setup Git Repository in cPanel

1. **Login to cPanel**
2. **Find "Git™ Version Control"** icon and click it
3. **Click "Create"** button

4. **Fill in Git Repository Configuration:**
   - **Clone a Repository:** ✅ Enable this toggle
   - **Clone URL:** `https://github.com/androidnega/SwapSync.git`
   - **Repository Path:** `swapsync` (or `digitstec.store`)
   - **Repository Name:** `SwapSync Production`

5. **Click "Create"** - cPanel will clone your repository

### Step 2: Access Terminal

**Option A - cPanel Terminal:**
- In cPanel, click **"Terminal"** icon

**Option B - SSH:**
```bash
ssh manuelc8@digitstec.store
# Enter your password
```

### Step 3: Navigate to Repository

```bash
# Navigate to your cloned repository
cd ~/swapsync
# OR if you used your domain name:
cd ~/digitstec.store
```

### Step 4: Setup Python Application

1. **Go to cPanel → "Setup Python App"**
2. **Click "Create Application"**
3. **Fill in these EXACT values:**

| Field | Value |
|-------|-------|
| **Python Version** | 3.9 or 3.11 (highest available) |
| **Application Root** | `swapsync/backend` |
| **Application URL** | `/` |
| **Application Startup File** | `passenger_wsgi.py` |
| **Application Entry Point** | `application` |

4. **Click "Create"**
5. **Copy the virtual environment path** (you'll need this)

Example path:
```bash
source /home3/manuelc8/virtualenv/swapsync/backend/3.9/bin/activate
```

### Step 5: Install Python Dependencies

```bash
# Navigate to backend directory
cd ~/swapsync/backend

# Activate virtual environment (use the path from Step 4)
source /home3/manuelc8/virtualenv/swapsync/backend/3.9/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt
```

This will take 3-5 minutes. Wait for completion.

### Step 6: Create Environment File

```bash
# Still in ~/swapsync/backend
cp env.template .env
nano .env
```

**Update these critical values in `.env`:**

```env
# Generate a secure secret key
SECRET_KEY=your-generated-secret-key-here

# Database (SQLite for now)
DATABASE_URL=sqlite:///./swapsync.db

# CORS Origins - Add your domain
CORS_ORIGINS=https://digitstec.store,https://www.digitstec.store

# Admin Credentials
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@digitstec.store
DEFAULT_ADMIN_PASSWORD=ChangeThisPassword123!

# Environment
ENVIRONMENT=production
DEBUG=False
PORT=8000

# SMS Configuration (optional)
ARKASEL_API_KEY=
ARKASEL_SENDER_ID=SwapSync
```

**To generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Save file:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 7: Create Required Directories

```bash
# Still in ~/swapsync/backend
mkdir -p uploads backups logs
chmod 755 uploads backups logs
```

### Step 8: Initialize Database

```bash
# Activate virtual environment if not already active
source /home3/manuelc8/virtualenv/swapsync/backend/3.9/bin/activate

# Initialize database
python -c "from app.core.database import init_db; init_db()"
```

### Step 9: Build Frontend

```bash
# Navigate to frontend
cd ~/swapsync/frontend

# Install Node dependencies
npm install

# Build for production
npm run build
```

The built files will be in `frontend/dist/` directory.

### Step 10: Configure Frontend Serving

**Option A - Serve from backend (recommended):**

Backend is already configured to serve static files from `frontend/dist/`

**Option B - Separate public directory:**

```bash
# Create public directory
mkdir -p ~/public_html/app
cp -r ~/swapsync/frontend/dist/* ~/public_html/app/
```

### Step 11: Restart Python Application

1. **Go back to cPanel**
2. **Navigate to "Setup Python App"**
3. **Find your application**
4. **Click "Restart"** button

---

## Method 2: Manual Upload

If you prefer not to use Git:

### Step 1: Build Frontend Locally

On your local machine:
```bash
cd D:\SwapSync\frontend
npm install
npm run build
```

### Step 2: Prepare Files for Upload

Create a zip file containing:
- `backend/` folder (entire directory)
- `frontend/dist/` folder (built frontend)

### Step 3: Upload to cPanel

1. **Login to cPanel**
2. **Open File Manager**
3. **Navigate to your home directory**
4. **Upload the zip file**
5. **Extract it**

### Step 4: Follow Steps 4-11 from Method 1

Continue with Python application setup, dependencies installation, etc.

---

## Post-Deployment Configuration

### 1. Update .htaccess (if needed)

Check `backend/.htaccess` line 4:

```apache
PassengerPython /home3/manuelc8/virtualenv/swapsync/backend/3.9/bin/python
```

Update `manuelc8` with your cPanel username and correct Python version.

### 2. Set File Permissions

```bash
cd ~/swapsync/backend
chmod 755 passenger_wsgi.py .htaccess
chmod 600 .env
chmod 664 swapsync.db
```

### 3. Configure SSL Certificate

In cPanel:
1. Go to **SSL/TLS Status**
2. Check box next to `digitstec.store`
3. Click **Run AutoSSL**

---

## Testing Your Deployment

### Test Backend API

Open these URLs in your browser:

1. **API Documentation:**
```
https://digitstec.store/docs
```
   Should show FastAPI Swagger UI

2. **Health Check:**
```
https://digitstec.store/api/health
```
Should return: `{"status": "healthy"}`

3. **Alternative API Docs:**
   ```
   https://digitstec.store/redoc
   ```

### Test Frontend

```
https://digitstec.store
```
Should load the SwapSync login page

### Test Login

1. Navigate to login page
2. Use credentials from your `.env` file:
   - Username: `admin`
   - Password: (the one you set in .env)

---

## Updating Your Deployment

### When You Push Changes to GitHub:

```bash
# SSH into your server
ssh manuelc8@digitstec.store

# Navigate to repository
cd ~/swapsync

# Pull latest changes
git pull origin main

# If backend changes, reinstall dependencies
cd backend
source /home3/manuelc8/virtualenv/swapsync/backend/3.9/bin/activate
pip install -r requirements.txt --upgrade

# If frontend changes, rebuild
cd ../frontend
npm install
npm run build

# Restart Python application in cPanel
# Or via command:
touch ~/swapsync/tmp/restart.txt
```

### Using cPanel Git Interface:

1. **Go to Git™ Version Control**
2. **Click "Manage"** on your repository
3. **Click "Pull or Deploy"**
4. **Click "Update from Remote"**

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Check Error Logs:**
```bash
tail -f ~/logs/passenger.log
# Or check in cPanel → Errors
```

**Common causes:**
- Virtual environment path incorrect in `.htaccess`
- Missing Python dependencies
- `.env` file not configured
- Database not initialized

**Solution:**
```bash
# Verify virtual environment
source /home3/manuelc8/virtualenv/swapsync/backend/3.9/bin/activate
python --version  # Should show 3.9+

# Reinstall dependencies
cd ~/swapsync/backend
pip install -r requirements.txt --force-reinstall

# Check .env exists
ls -la .env

# Re-initialize database if needed
python -c "from app.core.database import init_db; init_db()"
```

### Issue: Module Not Found

**Solution:**
```bash
cd ~/swapsync/backend
source /home3/manuelc8/virtualenv/swapsync/backend/3.9/bin/activate
pip install -r requirements.txt
```

### Issue: Permission Denied

**Solution:**
```bash
cd ~/swapsync/backend
chmod 755 passenger_wsgi.py .htaccess
chmod -R 755 app/
chmod 755 uploads backups logs
```

### Issue: Database Locked

**Solution:**
```bash
cd ~/swapsync/backend
# Stop any running processes
pkill -f python

# Reset database permissions
chmod 664 swapsync.db
chmod 755 .

# Restart app in cPanel
```

### Issue: Static Files Not Loading

**Solution:**

Check `frontend/.htaccess` exists and has proper rules.

Or update backend `main.py` to serve static files:

```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")
```

### Issue: CORS Errors

**Update `.env`:**
```env
CORS_ORIGINS=https://digitstec.store,https://www.digitstec.store,http://digitstec.store,http://www.digitstec.store
```

Then restart the application.

### Issue: Application Won't Start

**Check Python version:**
```bash
python --version  # Should be 3.9+
```

**Validate passenger_wsgi.py:**
```bash
cd ~/swapsync/backend
python passenger_wsgi.py
# Should show no syntax errors
```

**Check .htaccess path:**
Ensure the Python path in `.htaccess` matches your actual virtual environment path.

---

## Important URLs

### Production URLs:
- **Frontend:** https://digitstec.store
- **API Docs:** https://digitstec.store/docs
- **ReDoc:** https://digitstec.store/redoc
- **Health Check:** https://digitstec.store/api/health

### cPanel URLs:
- **cPanel:** https://digitstec.store:2083
- **Terminal:** cPanel → Terminal icon
- **Python App:** cPanel → Setup Python App
- **Git Control:** cPanel → Git™ Version Control

### File Paths on Server:
```
Repository: /home3/manuelc8/swapsync/
Backend: /home3/manuelc8/swapsync/backend/
Frontend: /home3/manuelc8/swapsync/frontend/
Virtual Env: /home3/manuelc8/virtualenv/swapsync/backend/3.9/
Database: /home3/manuelc8/swapsync/backend/swapsync.db
Uploads: /home3/manuelc8/swapsync/backend/uploads/
Backups: /home3/manuelc8/swapsync/backend/backups/
Logs: /home3/manuelc8/logs/
```

---

## Security Checklist

After deployment, ensure:

- [ ] Changed default admin password
- [ ] Updated `SECRET_KEY` in `.env` with random 32+ character string
- [ ] Set `.env` file permissions to 600
- [ ] Set `DEBUG=False` in `.env`
- [ ] SSL certificate is active (HTTPS)
- [ ] Added your domain to `CORS_ORIGINS` in `.env`
- [ ] Database file permissions are secure (chmod 664)
- [ ] Removed any test/debug files
- [ ] Configured regular backups
- [ ] SMS credentials configured (if using SMS features)

---

## Backup Strategy

### Automated Backups:

```bash
# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cd /home3/manuelc8/swapsync/backend && /home3/manuelc8/virtualenv/swapsync/backend/3.9/bin/python -c "from app.core.backup import create_backup; create_backup()"
```

### Manual Backup:

```bash
cd ~/swapsync/backend
cp swapsync.db backups/swapsync_$(date +%Y%m%d_%H%M%S).db
```

---

## Performance Optimization

### 1. Enable GZIP Compression

Add to `backend/.htaccess`:
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/javascript
</IfModule>
```

### 2. Configure Passenger Settings

In `backend/.htaccess`:
```apache
PassengerMaxPoolSize 2
PassengerMinInstances 1
PassengerMaxRequestQueueSize 50
```

### 3. Database Optimization

```bash
# Vacuum database monthly
cd ~/swapsync/backend
sqlite3 swapsync.db "VACUUM;"
```

---

## Common Commands Reference

### Restart Application:
```bash
# Via cPanel: Setup Python App → Restart
# Via terminal:
cd ~/swapsync
mkdir -p tmp
touch tmp/restart.txt
```

### View Live Logs:
```bash
tail -f ~/logs/passenger.log
```

### Check Disk Space:
```bash
df -h
```

### Check Python Packages:
```bash
source /home3/manuelc8/virtualenv/swapsync/backend/3.9/bin/activate
pip list
```

### Update Application:
```bash
cd ~/swapsync
git pull origin main
pip install -r backend/requirements.txt --upgrade
touch tmp/restart.txt
```

---

## Support & Resources

### Documentation:
- Main README: `/README.md` in repository
- API Documentation: https://digitstec.store/docs
- FastAPI Docs: https://fastapi.tiangolo.com

### GitHub Repository:
- **URL:** https://github.com/androidnega/SwapSync
- **Issues:** Use GitHub Issues for bug reports
- **Pull Requests:** For contributions

### Hosting Support:
- Contact your hosting provider for cPanel-specific issues
- Check Python/Passenger module availability
- Verify resource limits (RAM, CPU, storage)

---

## Deployment Checklist

### Pre-Deployment:
- [ ] Repository cloned to server
- [ ] Python 3.9+ available in cPanel
- [ ] Domain DNS configured
- [ ] SSL certificate ready

### Setup:
- [ ] Python application created in cPanel
- [ ] Virtual environment path noted
- [ ] Dependencies installed via pip
- [ ] `.env` file created and configured
- [ ] Required directories created (uploads, backups, logs)
- [ ] Database initialized
- [ ] Frontend built

### Testing:
- [ ] API docs accessible at /docs
- [ ] Health check returns success
- [ ] Frontend loads correctly
- [ ] Login works with admin credentials
- [ ] Can access dashboard
- [ ] Static files loading properly
- [ ] Database operations work

### Security:
- [ ] Admin password changed
- [ ] SECRET_KEY updated with secure random value
- [ ] .env permissions set to 600
- [ ] DEBUG=False
- [ ] SSL certificate active and working
- [ ] CORS configured properly

### Post-Deployment:
- [ ] Backups configured
- [ ] Logs monitored
- [ ] Performance optimized
- [ ] Documentation saved
- [ ] Team notified

---

## 🎉 Deployment Complete!

If you've completed all steps, SwapSync should now be running live at **https://digitstec.store**!

### Next Steps:
1. Login and change admin password
2. Configure company settings
3. Add users and assign roles
4. Test all features (sales, repairs, swaps)
5. Set up SMS notifications (if needed)
6. Configure automated backups
7. Monitor application logs

---

**Document Version:** 2.0  
**Last Updated:** October 10, 2025  
**Repository:** https://github.com/androidnega/SwapSync  
**Domain:** digitstec.store  
**Deployment Method:** Git + cPanel Python App

---

**Need Help?** Check the troubleshooting section above or review error logs in `~/logs/passenger.log`
