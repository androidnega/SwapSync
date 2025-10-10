# Backend Deployment Preparation Guide

## ⚠️ CRITICAL: Database Migration from SQLite to PostgreSQL

This guide will help you prepare the SwapSync backend for production deployment on Render.

---

## Step 1: Update Requirements

Add PostgreSQL driver to `requirements.txt`:

```bash
# Add this line to backend/requirements.txt
psycopg2-binary>=2.9.0
```

---

## Step 2: Update Database Configuration

Modify `backend/app/core/database.py`:

**BEFORE:**
```python
# Create engine with SQLite-specific configuration
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Only needed for SQLite
)
```

**AFTER:**
```python
# Create engine (works with both SQLite and PostgreSQL)
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args
)
```

---

## Step 3: Test PostgreSQL Locally (Optional but Recommended)

### Option A: Using Docker
```bash
# Start PostgreSQL in Docker
docker run --name swapsync-postgres \
  -e POSTGRES_USER=swapsync \
  -e POSTGRES_PASSWORD=swapsync123 \
  -e POSTGRES_DB=swapsync \
  -p 5432:5432 \
  -d postgres:15

# Update your local .env file
DATABASE_URL=postgresql://swapsync:swapsync123@localhost:5432/swapsync

# Test the backend
cd backend
uvicorn main:app --reload
```

### Option B: Using Local PostgreSQL Installation
```bash
# Create database
createdb swapsync

# Update .env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/swapsync

# Test the backend
cd backend
uvicorn main:app --reload
```

---

## Step 4: Environment Variables for Production

Create these environment variables in Render:

### Required Variables:
```env
# Database (CRITICAL - Use Render PostgreSQL or external provider)
DATABASE_URL=postgresql://user:password@host:5432/database

# Security (CRITICAL - Generate new key)
SECRET_KEY=<generate-new-secure-key>

# CORS (CRITICAL - Add your Vercel domain)
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app

# Application Settings
DEBUG=False
ENVIRONMENT=production
APP_NAME=SwapSync API
APP_VERSION=1.0.0
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Optional Variables (SMS):
```env
ARKASEL_API_KEY=your-key-here
ARKASEL_SENDER_ID=SwapSync
HUBTEL_CLIENT_ID=your-client-id
HUBTEL_CLIENT_SECRET=your-secret
HUBTEL_SENDER_ID=SwapSync
```

### Admin User Variables:
```env
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@swapsync.com
DEFAULT_ADMIN_PASSWORD=<set-secure-password>
```

### Generate Secure Keys:
```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate secure admin password
python -c "import secrets, string; chars = string.ascii_letters + string.digits + string.punctuation; print(''.join(secrets.choice(chars) for _ in range(20)))"
```

---

## Step 5: PostgreSQL Provider Options

### Option 1: Render PostgreSQL (Recommended)
- Go to Render Dashboard
- Click "New +" → "PostgreSQL"
- Name: swapsync-db
- Region: Same as your web service
- PostgreSQL Version: 15
- Copy the "Internal Database URL"
- Use this as your `DATABASE_URL`

**Pros:**
- Integrated with Render
- Automatic backups
- Easy connection (internal URL)

**Cons:**
- Requires paid plan for production features

---

### Option 2: Supabase
- Go to https://supabase.com
- Create new project
- Get connection string from Settings → Database
- Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

**Pros:**
- Free tier available
- Good dashboard
- Automatic backups

**Cons:**
- External dependency

---

### Option 3: Neon
- Go to https://neon.tech
- Create new project
- Copy connection string
- Format: `postgresql://[user]:[password]@ep-xxx.[region].aws.neon.tech/[dbname]`

**Pros:**
- Serverless
- Auto-scaling
- Free tier

**Cons:**
- Connection pooling limits on free tier

---

## Step 6: Data Migration (If you have existing data)

If you have existing SQLite data you want to migrate:

### Export from SQLite:
```bash
# Export data to SQL dump
sqlite3 swapsync.db .dump > swapsync_export.sql

# Or use a migration tool
pip install sqlalchemy-migrate
```

### Import to PostgreSQL:
```bash
# Connect to your PostgreSQL database
psql -h your-host -U your-user -d your-database < swapsync_export.sql

# Or use pgloader for automatic conversion
pgloader swapsync.db postgresql://user:pass@host/db
```

**Note:** For production deployment, it's often easier to start fresh and manually migrate critical data.

---

## Step 7: Update CORS for Production

Ensure your backend accepts requests from Vercel:

**In Render Environment Variables:**
```
CORS_ORIGINS=https://swapsync.vercel.app,https://swapsync-*.vercel.app,https://swapsync-git-*.vercel.app
```

This pattern allows:
- Production domain
- Preview deployments
- Branch deployments

---

## Step 8: File Storage Considerations

Your app has these file-related features:

1. **Backup Files** (`backend/backups/`)
   - Issue: Won't persist on Render
   - Solution: Use S3, Cloudinary, or Render Disk

2. **PDF Invoices** (reportlab)
   - Issue: If saved to disk, won't persist
   - Solution: Stream to client or use cloud storage

3. **SMS Config** (`sms_config.json`)
   - Issue: File won't persist
   - Solution: Use environment variables (already supported)

### Recommendation:
Configure file storage in environment variables:
```env
# Add these if you need persistent storage
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=swapsync-files
AWS_REGION=us-east-1
```

---

## Step 9: Testing Checklist

Before deploying to production:

- [ ] Install PostgreSQL driver: `pip install psycopg2-binary`
- [ ] Update database.py configuration
- [ ] Test with PostgreSQL locally
- [ ] Generate secure SECRET_KEY
- [ ] Prepare all environment variables
- [ ] Test CORS with frontend
- [ ] Verify SMS configuration (if used)
- [ ] Change default admin password
- [ ] Remove swapsync.db from repository
- [ ] Update .gitignore to exclude .env files
- [ ] Commit all changes to git
- [ ] Push to repository

---

## Step 10: Deployment Command Reference

### Render Deployment:
```
Service Type: Web Service
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health Check: /ping
```

### Verify Deployment:
```bash
# Test health endpoint
curl https://your-app.onrender.com/ping

# Check API docs
open https://your-app.onrender.com/docs

# Test with frontend
# Update frontend VITE_API_URL to: https://your-app.onrender.com/api
```

---

## Troubleshooting

### Database Connection Issues
```
Error: FATAL: password authentication failed
```
- Verify DATABASE_URL credentials
- Check PostgreSQL is running
- Ensure SSL mode if required: `?sslmode=require`

### Import Errors
```
ModuleNotFoundError: No module named 'psycopg2'
```
- Ensure `psycopg2-binary>=2.9.0` is in requirements.txt
- Trigger manual deploy on Render

### CORS Errors
```
Access-Control-Allow-Origin error
```
- Add Vercel domain to CORS_ORIGINS
- Include wildcard for previews: `*.vercel.app`
- Redeploy backend

---

## Quick Commands

```bash
# Test PostgreSQL connection
python -c "from sqlalchemy import create_engine; engine = create_engine('postgresql://user:pass@host/db'); print('Connected!' if engine.connect() else 'Failed')"

# Check installed packages
pip list | grep psycopg2

# Test backend locally
cd backend && uvicorn main:app --reload

# Generate production configs
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```

---

## Next Steps

After completing these steps:

1. Deploy backend to Render (see DEPLOYMENT_GUIDE.md)
2. Deploy frontend to Vercel
3. Update CORS with Vercel URL
4. Test all functionality
5. Set up monitoring and alerts

**Full deployment guide:** See `../DEPLOYMENT_GUIDE.md`
**Quick reference:** See `../DEPLOYMENT_QUICK_REFERENCE.txt`

---

**Last Updated:** October 10, 2025

