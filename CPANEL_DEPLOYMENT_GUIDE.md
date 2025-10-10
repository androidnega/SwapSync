# SwapSync cPanel Deployment Guide for digitstec.store

## Complete Step-by-Step Deployment Instructions

This document provides everything you need to deploy SwapSync to your cPanel hosting with the domain **digitstec.store**.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Prepare Your Local Files](#step-1-prepare-your-local-files)
3. [Step 2: Build Frontend for Production](#step-2-build-frontend-for-production)
4. [Step 3: Prepare Backend Files](#step-3-prepare-backend-files)
5. [Step 4: Upload Files to cPanel](#step-4-upload-files-to-cpanel)
6. [Step 5: Setup Python Application in cPanel](#step-5-setup-python-application-in-cpanel)
7. [Step 6: Configure Environment Variables](#step-6-configure-environment-variables)
8. [Step 7: Initialize Database](#step-7-initialize-database)
9. [Step 8: Final Testing](#step-8-final-testing)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need:
- ✅ cPanel hosting account with Python support (Python 3.8+)
- ✅ Domain: `digitstec.store` pointed to your cPanel hosting
- ✅ FTP/File Manager access to cPanel
- ✅ SSH access (optional but recommended)
- ✅ Your SwapSync project files (current directory)

### Check Your cPanel Python Version:
1. Login to cPanel
2. Go to "Setup Python App" or "Python Selector"
3. Verify Python 3.8 or higher is available

---

## Step 1: Prepare Your Local Files

### 1.1 Create Deployment Package Directory
On your local machine, create a temporary folder:

```bash
# On Windows (in your project root D:\SwapSync)
mkdir deploy_package
```

### 1.2 Files to Include:
- All backend files from `backend/` folder
- Built frontend files (we'll create these next)
- Configuration files

---

## Step 2: Build Frontend for Production

### 2.1 Open Terminal in Frontend Directory
```bash
cd D:\SwapSync\frontend
```

### 2.2 Install Dependencies (if not already done)
```bash
npm install
```

### 2.3 Build Frontend for Production
```bash
npm run build
```

This creates a `dist` folder with optimized static files.

### 2.4 Copy Built Files to Deploy Package
```bash
# Copy the entire dist folder
xcopy /E /I dist ..\deploy_package\frontend_dist
```

---

## Step 3: Prepare Backend Files

### 3.1 Create Application Entry Point

Create a new file called `passenger_wsgi.py` in your backend folder with this exact content:

```python
import os
import sys

# Add your application directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Import your FastAPI application
from main import app as application

# For Passenger compatibility
def application(environ, start_response):
    return application(environ, start_response)
```

### 3.2 Update requirements.txt

Create/update `backend/requirements.txt` with these dependencies:

```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
aiofiles==23.2.1
httpx==0.25.1
apscheduler==3.10.4
websockets==12.0
reportlab==4.0.7
pytz==2023.3
```

### 3.3 Copy Backend Files to Deploy Package
```bash
cd D:\SwapSync
xcopy /E /I backend deploy_package\backend
```

### 3.4 Create .htaccess File

Create `deploy_package/.htaccess`:

```apache
PassengerEnabled On
PassengerAppRoot /home/yourusername/digitstec.store
PassengerAppType wsgi
PassengerStartupFile passenger_wsgi.py
PassengerPython /home/yourusername/virtualenv/digitstec.store/3.9/bin/python

# Passenger performance settings
PassengerMaxPoolSize 2
PassengerMinInstances 1
PassengerMaxRequestQueueSize 50

# Static files handling
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ passenger_wsgi.py [QSA,L]

# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"

# CORS headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

**Note:** Replace `yourusername` with your actual cPanel username (you'll find this in cPanel).

### 3.5 Create Environment File

Create `deploy_package/.env`:

```env
# Database
DATABASE_URL=sqlite:///./swapsync.db

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
APP_NAME=SwapSync
DEBUG=False
ALLOWED_ORIGINS=["https://digitstec.store", "https://www.digitstec.store"]

# File Uploads
UPLOAD_DIR=/home/yourusername/digitstec.store/uploads
MAX_UPLOAD_SIZE=10485760

# SMS Configuration (if using)
SMS_ENABLED=False
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=SwapSync

# Backup
BACKUP_DIR=/home/yourusername/digitstec.store/backups
BACKUP_ENABLED=True
BACKUP_SCHEDULE=0 2 * * *
```

**Important Changes Needed:**
1. Replace `your-super-secret-key-change-this-in-production-min-32-chars` with a random 32+ character string
2. Replace `yourusername` with your cPanel username
3. Update SMS settings if you have an SMS provider

### 3.6 Create Main WSGI File

Create `deploy_package/passenger_wsgi.py`:

```python
import os
import sys

# Get the application directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
sys.path.insert(0, os.path.join(SCRIPT_DIR, 'backend'))

# Set environment
os.environ['PRODUCTION'] = 'true'

# Import FastAPI app
try:
    from backend.main import app
    application = app
except ImportError as e:
    print(f"Error importing application: {e}")
    import traceback
    traceback.print_exc()
    
    # Create a simple WSGI application for error display
    def application(environ, start_response):
        status = '500 Internal Server Error'
        output = f'Error importing application: {str(e)}'.encode('utf-8')
        response_headers = [('Content-type', 'text/plain'),
                          ('Content-Length', str(len(output)))]
        start_response(status, response_headers)
        return [output]
```

---

## Step 4: Upload Files to cPanel

### 4.1 Access cPanel File Manager
1. Login to your cPanel at: `https://digitstec.store:2083` or via your hosting provider's cPanel URL
2. Navigate to **File Manager**
3. Go to the **public_html** directory (or your domain's root directory)

### 4.2 Create Application Directory

**Option A - If digitstec.store is your main domain:**
- Upload files directly to `/home/yourusername/public_html/`

**Option B - If digitstec.store is an addon domain:**
- Upload files to `/home/yourusername/digitstec.store/`

### 4.3 Upload Files
1. Click **Upload** button in File Manager
2. Upload the entire contents of your `deploy_package` folder
3. OR use FTP client (FileZilla):
   - Host: `ftp.digitstec.store`
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21
   - Upload all files from `deploy_package` to the appropriate directory

### 4.4 Set Permissions
After upload, set these permissions:
- Folders: 755
- Files: 644
- `passenger_wsgi.py`: 755
- `.env`: 600 (more secure)

To set permissions in File Manager:
1. Select file/folder
2. Click **Permissions**
3. Enter the numeric value

---

## Step 5: Setup Python Application in cPanel

### 5.1 Access Python App Setup
1. In cPanel, find **"Setup Python App"** or **"Python Selector"**
2. Click **"Create Application"**

### 5.2 Fill in Python App Configuration

Here are the EXACT values to enter in each field:

#### Field: **Python Version**
```
Select: Python 3.9 or higher (choose the highest available)
```

#### Field: **Application Root**
```
digitstec.store
```
Or if main domain:
```
public_html
```

#### Field: **Application URL**
```
/
```
(Leave as root or choose a subdirectory if needed)

#### Field: **Application Startup File**
```
passenger_wsgi.py
```

#### Field: **Application Entry Point**
```
application
```

#### Field: **Passenger Log File** (if asked)
```
/home/yourusername/logs/passenger.log
```
(Replace `yourusername` with your actual cPanel username)

### 5.3 Click "Create" Button

### 5.4 Note the Virtual Environment Path
After creation, cPanel will show you the virtual environment path. It will look like:
```
source /home/yourusername/virtualenv/digitstec.store/3.9/bin/activate
```
**Save this path - you'll need it!**

---

## Step 6: Configure Environment Variables

### 6.1 Access Terminal/SSH
You need to install Python packages. Two options:

**Option A - cPanel Terminal:**
1. In cPanel, find **"Terminal"** icon
2. Click to open web-based terminal

**Option B - SSH Client:**
```bash
ssh yourusername@digitstec.store
# Enter your cPanel password
```

### 6.2 Activate Virtual Environment
```bash
# Navigate to your app directory
cd ~/digitstec.store
# OR if main domain: cd ~/public_html

# Activate the virtual environment (use the path from Step 5.4)
source /home/yourusername/virtualenv/digitstec.store/3.9/bin/activate
```

### 6.3 Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

This will take a few minutes. Wait for all packages to install.

### 6.4 Verify Installation
```bash
pip list
# Should show fastapi, uvicorn, sqlalchemy, etc.
```

---

## Step 7: Initialize Database

### 7.1 Create Required Directories
```bash
# Still in your app directory with virtual environment activated
mkdir -p uploads
mkdir -p backups
mkdir -p logs
```

### 7.2 Set Directory Permissions
```bash
chmod 755 uploads backups logs
```

### 7.3 Initialize Database
```bash
# Run the FastAPI app once to create database tables
cd backend
python -c "from app.core.database import init_db; init_db()"
```

### 7.4 Create Default Admin User (Optional)
```bash
# Create a default admin user
python -c "
from app.core.database import get_db
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = next(get_db())

# Check if admin exists
admin = db.query(User).filter(User.username == 'admin').first()
if not admin:
    admin_user = User(
        username='admin',
        email='admin@digitstec.store',
        full_name='System Administrator',
        hashed_password=pwd_context.hash('Admin@123'),
        role='admin',
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    print('Admin user created successfully!')
    print('Username: admin')
    print('Password: Admin@123')
    print('CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!')
else:
    print('Admin user already exists')
"
```

---

## Step 8: Final Testing

### 8.1 Restart Python Application
1. Go back to cPanel
2. Navigate to **"Setup Python App"**
3. Find your application
4. Click **"Restart"** button

### 8.2 Test Your Application

#### Test Backend API:
Open browser and visit:
```
https://digitstec.store/docs
```
You should see the FastAPI Swagger documentation.

#### Test API Health:
```
https://digitstec.store/api/health
```
Should return: `{"status": "healthy"}`

#### Test Frontend:
```
https://digitstec.store
```
Should load your SwapSync login page.

### 8.3 Test Login
1. Go to: `https://digitstec.store`
2. Login with:
   - Username: `admin`
   - Password: `Admin@123`
3. You should be redirected to the dashboard

---

## 📝 Important URLs & Credentials

### Application URLs:
- **Frontend:** https://digitstec.store
- **API Docs:** https://digitstec.store/docs
- **API Alternative Docs:** https://digitstec.store/redoc
- **Health Check:** https://digitstec.store/api/health

### Default Admin Credentials:
```
Username: admin
Email: admin@digitstec.store
Password: Admin@123
```
**⚠️ CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN!**

### File Paths on Server:
```
Application Root: /home/yourusername/digitstec.store/
Virtual Environment: /home/yourusername/virtualenv/digitstec.store/3.9/
Database: /home/yourusername/digitstec.store/backend/swapsync.db
Uploads: /home/yourusername/digitstec.store/uploads/
Backups: /home/yourusername/digitstec.store/backups/
Logs: /home/yourusername/digitstec.store/logs/
```

---

## 🔧 Troubleshooting

### Issue: 500 Internal Server Error

**Solution 1 - Check Error Logs:**
```bash
# Via terminal
cd ~/digitstec.store
tail -f logs/passenger.log
# OR
tail -f /home/yourusername/logs/passenger.log
```

In cPanel File Manager:
- Navigate to `logs` folder
- View `passenger.log` or `error_log`

**Solution 2 - Check Permissions:**
```bash
chmod 755 passenger_wsgi.py
chmod -R 755 backend/
```

**Solution 3 - Verify Virtual Environment:**
```bash
source /home/yourusername/virtualenv/digitstec.store/3.9/bin/activate
pip list | grep fastapi
# Should show fastapi version
```

### Issue: Module Not Found Errors

**Solution:**
```bash
# Activate virtual environment
source /home/yourusername/virtualenv/digitstec.store/3.9/bin/activate

# Reinstall requirements
cd ~/digitstec.store
pip install -r backend/requirements.txt --force-reinstall
```

### Issue: Database Not Found

**Solution:**
```bash
cd ~/digitstec.store/backend
# Check if swapsync.db exists
ls -la swapsync.db

# If not, initialize it
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### Issue: Static Files Not Loading

**Solution 1 - Update .htaccess:**
Add these rules to `.htaccess`:
```apache
# Serve static files directly
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule .* - [L]

# For frontend assets
RewriteCond %{REQUEST_URI} ^/assets/
RewriteRule .* - [L]
```

**Solution 2 - Check File Permissions:**
```bash
chmod -R 755 frontend_dist/
```

### Issue: CORS Errors

**Solution - Update .env:**
```env
ALLOWED_ORIGINS=["https://digitstec.store", "https://www.digitstec.store", "http://digitstec.store", "http://www.digitstec.store"]
```

Then restart the app in cPanel.

### Issue: Application Won't Start

**Solution 1 - Check Python Version:**
```bash
python --version
# Should be 3.8+
```

**Solution 2 - Validate passenger_wsgi.py:**
```bash
python passenger_wsgi.py
# Should show no syntax errors
```

**Solution 3 - Check .htaccess:**
Ensure the Python path in `.htaccess` matches your virtual environment path.

---

## 🔐 Security Checklist

After deployment, ensure:

- [ ] Changed default admin password
- [ ] Updated SECRET_KEY in `.env` to a random 32+ character string
- [ ] Set `.env` file permissions to 600: `chmod 600 .env`
- [ ] Set DEBUG=False in `.env`
- [ ] SSL certificate is active (HTTPS)
- [ ] Added your domain to ALLOWED_ORIGINS in `.env`
- [ ] Database file permissions are secure: `chmod 600 backend/swapsync.db`
- [ ] Removed any test/debug files
- [ ] Configured regular backups

---

## 📈 Post-Deployment Tasks

### 1. Setup Automated Backups
```bash
# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cd /home/yourusername/digitstec.store && /home/yourusername/virtualenv/digitstec.store/3.9/bin/python backend/app/core/backup.py
```

### 2. Monitor Logs
```bash
# Check logs regularly
tail -f ~/digitstec.store/logs/passenger.log
```

### 3. Setup SSL Certificate
In cPanel:
1. Go to **SSL/TLS Status**
2. Check the box next to digitstec.store
3. Click **Run AutoSSL**

### 4. Configure Email (if using email features)
In cPanel:
1. Go to **Email Accounts**
2. Create email: `noreply@digitstec.store`
3. Update `.env` with email settings

---

## 📞 Support Information

### Common Commands:

**Restart Application:**
```bash
# Via cPanel: Setup Python App > Restart
# Via terminal:
cd ~/digitstec.store
touch tmp/restart.txt
```

**View Live Logs:**
```bash
tail -f ~/logs/passenger.log
```

**Backup Database:**
```bash
cd ~/digitstec.store/backend
cp swapsync.db ~/backups/swapsync_$(date +%Y%m%d_%H%M%S).db
```

**Update Application:**
```bash
cd ~/digitstec.store
source /home/yourusername/virtualenv/digitstec.store/3.9/bin/activate
git pull  # If using git
pip install -r backend/requirements.txt --upgrade
touch tmp/restart.txt  # Restart app
```

---

## ✅ Deployment Checklist

Complete this checklist as you deploy:

### Pre-Deployment:
- [ ] Frontend built successfully (`npm run build`)
- [ ] Backend files copied to deploy_package
- [ ] `.env` file created with correct settings
- [ ] `.htaccess` file created
- [ ] `passenger_wsgi.py` file created
- [ ] `requirements.txt` is up to date

### cPanel Setup:
- [ ] Files uploaded to cPanel
- [ ] File permissions set correctly
- [ ] Python application created in cPanel
- [ ] Virtual environment path noted
- [ ] Dependencies installed via pip
- [ ] Database initialized
- [ ] Admin user created

### Testing:
- [ ] API docs accessible at /docs
- [ ] Health check returns success
- [ ] Frontend loads correctly
- [ ] Login works with admin credentials
- [ ] Can access dashboard
- [ ] Static files loading properly

### Security:
- [ ] Admin password changed
- [ ] SECRET_KEY updated
- [ ] .env permissions set to 600
- [ ] DEBUG=False
- [ ] SSL certificate active

### Post-Deployment:
- [ ] Backups configured
- [ ] Logs monitored
- [ ] Documentation saved
- [ ] Team notified

---

## 🎉 Congratulations!

If you've completed all steps, SwapSync should now be running live at **https://digitstec.store**!

### Next Steps:
1. Login and change admin password
2. Configure company settings
3. Add users
4. Test all features
5. Set up regular backups
6. Monitor application performance

---

## 📧 Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Review error logs in `~/digitstec.store/logs/`
3. Verify all configuration files
4. Ensure all dependencies are installed
5. Contact your hosting provider for cPanel-specific issues

---

**Document Version:** 1.0  
**Last Updated:** October 10, 2025  
**Domain:** digitstec.store  
**Application:** SwapSync  
**Deployment Type:** cPanel Python Application

---


