# SwapSync Deployment Guide
## Vercel (Frontend) + Render (Backend)

---

## 📋 TABLE OF CONTENTS
1. [Backend Audit](#backend-audit)
2. [Frontend Audit](#frontend-audit)
3. [Critical Issues](#critical-issues)
4. [Deployment Configuration](#deployment-configuration)
5. [Pre-Deployment Checklist](#pre-deployment-checklist)
6. [Step-by-Step Deployment](#step-by-step-deployment)
7. [Post-Deployment Testing](#post-deployment-testing)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 BACKEND AUDIT (Render)

### Python Version
- **Current:** Python 3.12.11 (specified in `runtime.txt`)
- **Status:** ✅ Compatible with Render

### Entry Point
- **File:** `backend/main.py`
- **ASGI App:** `main:app`
- **Framework:** FastAPI (ASGI-based)
- **Server:** Uvicorn with standard extras

### Dependencies (from requirements.txt)
```
fastapi>=0.115.0
uvicorn[standard]>=0.34.0
sqlalchemy>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
pydantic>=2.0.0
pydantic-settings>=2.0.0
bcrypt>=4.0.1
reportlab>=4.0.0
apscheduler>=3.10.4
python-dotenv>=1.0.0
requests>=2.31.0
email-validator>=2.0.0
openpyxl>=3.1.0
pandas>=2.0.0
```

### Environment Variables Required
```env
# SECURITY (CRITICAL)
SECRET_KEY=<generate-secure-random-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# DATABASE (⚠️ MUST USE POSTGRESQL FOR RENDER)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# APPLICATION
APP_NAME=SwapSync API
APP_VERSION=1.0.0
DEBUG=False
ENVIRONMENT=production

# CORS (CRITICAL - Must include Vercel domain)
CORS_ORIGINS=https://your-vercel-app.vercel.app,https://your-vercel-app-*.vercel.app

# SMS CONFIGURATION (Optional but recommended)
ARKASEL_API_KEY=<your-arkasel-api-key>
ARKASEL_SENDER_ID=SwapSync
HUBTEL_CLIENT_ID=<optional-hubtel-client-id>
HUBTEL_CLIENT_SECRET=<optional-hubtel-secret>
HUBTEL_SENDER_ID=SwapSync

# DEFAULT ADMIN USER (First Run)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@swapsync.com
DEFAULT_ADMIN_PASSWORD=<set-secure-password>
```

### Start Command
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Health Check Endpoints
- ✅ `/` - Root endpoint (returns API info)
- ✅ `/ping` - Primary health check (recommended)
- ✅ `/health` - Alternative health check
- ✅ `/docs` - FastAPI auto-generated documentation

**Recommended Health Check Path:** `/ping`

---

## 🎨 FRONTEND AUDIT (Vercel)

### Framework Details
- **Build Tool:** Vite
- **React Version:** 19.1.1
- **TypeScript:** Yes (5.9.3)
- **UI Framework:** TailwindCSS
- **Routing:** React Router DOM

### Build Configuration
- **Build Command:** `npm run build` (runs: `tsc -b && vite build`)
- **Output Directory:** `dist`
- **Development Server:** Vite Dev Server (port 5173)

### Environment Variables Required
```env
# BACKEND API URL (CRITICAL)
VITE_API_URL=https://your-render-backend.onrender.com/api
```

### API Configuration
- **Location:** `frontend/src/services/api.ts`
- **Environment Variable:** `VITE_API_URL`
- **Fallback Logic:** Auto-detects from `window.location.hostname:8000/api`
- ⚠️ **For production, MUST set `VITE_API_URL` explicitly**

---

## 🚨 CRITICAL DEPLOYMENT ISSUES

### 1. DATABASE PERSISTENCE (MAJOR ISSUE)
**Problem:** Current setup uses SQLite with local file storage (`swapsync.db`)
**Render Issue:** Ephemeral filesystem - database WILL RESET on every deployment/restart

**Solutions:**

#### Option A: PostgreSQL (STRONGLY RECOMMENDED)
```bash
# 1. Add to requirements.txt:
psycopg2-binary>=2.9.0

# 2. Update backend/app/core/database.py:
# Remove this line:
# connect_args={"check_same_thread": False}

# 3. Set DATABASE_URL in Render:
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

**PostgreSQL Providers:**
- Render PostgreSQL (Built-in add-on)
- Supabase (Free tier available)
- Neon (Serverless PostgreSQL)
- PlanetScale (MySQL alternative)

#### Option B: Render Persistent Disk
- Enable Render Disk in service settings
- Mount to: `/opt/render/project/src/data`
- Update: `DATABASE_URL=sqlite:////opt/render/project/src/data/swapsync.db`
- Cost: Additional charges apply

### 2. SMS Configuration File
**Problem:** Code reads `sms_config.json` from filesystem (main.py:49)
**Render Issue:** File won't persist across deployments
**Solution:** Use environment variables (already supported in code)

### 3. CORS Configuration
**Problem:** Hardcoded localhost origins in code
**Required:** Must add Vercel URL to allowed origins
**Solution:** Set `CORS_ORIGINS` environment variable with Vercel domains

### 4. File Storage Issues
**Affected Features:**
- Backup files (`backend/backups/`)
- PDF invoices (if saved to disk)
- Uploaded files

**Solutions:**
- Use cloud storage (AWS S3, Cloudinary)
- Use Render Persistent Disk
- Stream files to client instead of saving

---

## ⚙️ DEPLOYMENT CONFIGURATION

### Render Backend Setup

```yaml
Service Type: Web Service
Environment: Python 3

Build Command:
  pip install -r requirements.txt

Start Command:
  uvicorn main:app --host 0.0.0.0 --port $PORT

Health Check Path:
  /ping

Root Directory:
  backend

Auto-Deploy:
  Yes (from main branch)

Environment Variables:
  SECRET_KEY=<generate-secure-key>
  DATABASE_URL=postgresql://<credentials>
  CORS_ORIGINS=https://your-app.vercel.app,https://*.vercel.app
  DEBUG=False
  ENVIRONMENT=production
  APP_NAME=SwapSync API
  APP_VERSION=1.0.0
  ARKASEL_API_KEY=<your-key>
  ARKASEL_SENDER_ID=SwapSync
  DEFAULT_ADMIN_USERNAME=admin
  DEFAULT_ADMIN_EMAIL=admin@swapsync.com
  DEFAULT_ADMIN_PASSWORD=<secure-password>
```

### Vercel Frontend Setup

```yaml
Framework Preset: Vite

Build Command:
  npm run build

Output Directory:
  dist

Install Command:
  npm install

Root Directory:
  frontend

Node Version:
  18.x or 20.x

Environment Variables:
  VITE_API_URL=https://your-backend.onrender.com/api

Deployment Settings:
  - Enable automatic deployments from Git
  - Enable preview deployments for PRs
  - Add production domain (optional)
```

### Create vercel.json (in frontend/ directory)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Backend Preparation
- [ ] Generate secure `SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] Set up PostgreSQL database (Render or external provider)
- [ ] Add `psycopg2-binary>=2.9.0` to `requirements.txt`
- [ ] Update `backend/app/core/database.py` (remove SQLite-specific config)
- [ ] Prepare all environment variables
- [ ] Set `DEBUG=False` and `ENVIRONMENT=production`
- [ ] Configure SMS credentials (Arkasel/Hubtel)
- [ ] Set secure admin password (change from default)
- [ ] Test database connection locally with PostgreSQL
- [ ] Remove `swapsync.db` from repository (add to .gitignore)

### Frontend Preparation
- [ ] Create `vercel.json` in `frontend/` directory
- [ ] Test production build locally: `npm run build`
- [ ] Ensure `dist/` is in `.gitignore`
- [ ] Prepare `VITE_API_URL` environment variable
- [ ] Verify all API endpoints are using the centralized API service
- [ ] Test CORS configuration locally

### Repository Preparation
- [ ] Commit all changes to git
- [ ] Push to GitHub/GitLab/Bitbucket
- [ ] Ensure `.env` files are in `.gitignore`
- [ ] Remove any sensitive data from repository
- [ ] Tag release version (optional)

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### Step 1: Deploy Backend to Render

1. **Create PostgreSQL Database (if needed)**
   - Go to Render Dashboard → New → PostgreSQL
   - Copy the Internal Database URL
   - Or use external provider (Supabase, Neon)

2. **Create Web Service**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure service:
     - Name: `swapsync-backend`
     - Region: Choose closest to users
     - Branch: `main`
     - Root Directory: `backend`
     - Runtime: `Python 3`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables**
   - Click "Environment" tab
   - Add all variables from checklist above
   - **Important:** Set `DATABASE_URL` to PostgreSQL connection string
   - **Important:** Set `CORS_ORIGINS` to include `*.vercel.app`

4. **Configure Health Check**
   - Health Check Path: `/ping`
   - Health Check Interval: 30 seconds

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete (~3-5 minutes)
   - Check logs for errors
   - Copy the backend URL (e.g., `https://swapsync-backend.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI (Optional)**
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Configure project:
     - Framework Preset: `Vite`
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend.onrender.com/api`
   - Apply to: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build (~2-3 minutes)
   - Copy the deployment URL

### Step 3: Update CORS Configuration

1. **Update Backend CORS**
   - Go back to Render dashboard
   - Update `CORS_ORIGINS` environment variable
   - Add your Vercel URL: `https://your-app.vercel.app`
   - Add preview URLs: `https://your-app-*.vercel.app`
   - Example: `https://swapsync.vercel.app,https://swapsync-*.vercel.app`

2. **Trigger Redeploy**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete

---

## 🧪 POST-DEPLOYMENT TESTING

### Backend Health Checks
```bash
# Test root endpoint
curl https://your-backend.onrender.com/

# Test health endpoint
curl https://your-backend.onrender.com/ping

# Test API documentation
# Visit: https://your-backend.onrender.com/docs
```

### Frontend Testing
1. **Visit your Vercel URL**
2. **Test authentication:**
   - Try logging in with admin credentials
   - Check browser console for CORS errors
3. **Test API connectivity:**
   - Try loading customers, phones, etc.
   - Check Network tab in browser DevTools
4. **Test all major features:**
   - Customer management
   - Phone inventory
   - Swap transactions
   - Repair tracking
   - Product sales
   - Reports generation

### Database Verification
```bash
# Check if tables were created
# Login to your PostgreSQL database and run:
\dt

# Verify admin user was created
SELECT * FROM users WHERE username='admin';
```

---

## 🔧 TROUBLESHOOTING

### Common Backend Issues

#### Database Connection Errors
```
Error: could not connect to server
```
**Solution:**
- Verify `DATABASE_URL` is correct
- Check PostgreSQL database is running
- Ensure network connectivity
- Check Render service logs

#### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Add Vercel domain to `CORS_ORIGINS`
- Include wildcard for preview URLs: `https://*.vercel.app`
- Redeploy backend after updating CORS

#### Module Import Errors
```
ModuleNotFoundError: No module named 'psycopg2'
```
**Solution:**
- Ensure `psycopg2-binary>=2.9.0` is in `requirements.txt`
- Trigger manual redeploy on Render

#### Port Binding Errors
```
Error: Address already in use
```
**Solution:**
- Ensure start command uses `$PORT` variable
- Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Common Frontend Issues

#### Build Failures
```
Error: Cannot find module '@vitejs/plugin-react'
```
**Solution:**
- Run `npm install` locally
- Commit `package-lock.json`
- Ensure Node version is compatible (18.x or 20.x)

#### API Connection Errors
```
Network Error / ERR_CONNECTION_REFUSED
```
**Solution:**
- Verify `VITE_API_URL` is set correctly
- Check backend is running
- Verify backend URL includes `/api` suffix

#### Environment Variable Not Found
```
import.meta.env.VITE_API_URL is undefined
```
**Solution:**
- Environment variables must start with `VITE_`
- Redeploy after adding environment variables
- Clear build cache in Vercel

#### Routing Issues (404 on refresh)
```
404 Page Not Found on page refresh
```
**Solution:**
- Ensure `vercel.json` has rewrite rules
- Add catch-all route to `/index.html`

---

## 🔐 SECURITY BEST PRACTICES

### Production Security Checklist
- [ ] Use strong, randomly generated `SECRET_KEY`
- [ ] Set `DEBUG=False` in production
- [ ] Use HTTPS only (Render and Vercel provide this)
- [ ] Change default admin password immediately
- [ ] Enable database connection encryption
- [ ] Set up rate limiting on API endpoints
- [ ] Implement request logging and monitoring
- [ ] Regular security updates for dependencies
- [ ] Use environment variables for all secrets
- [ ] Never commit `.env` files to repository
- [ ] Rotate credentials periodically
- [ ] Set up database backups
- [ ] Configure CORS restrictively (specific domains only)

### Generate Secure Credentials
```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate strong password
python -c "import secrets; import string; chars = string.ascii_letters + string.digits + string.punctuation; print(''.join(secrets.choice(chars) for _ in range(32)))"
```

---

## 📊 MONITORING & MAINTENANCE

### Render Monitoring
- Dashboard → Your Service → Metrics
- Monitor: CPU, Memory, Response Times
- Set up email alerts for downtime
- Check logs regularly for errors

### Vercel Monitoring
- Dashboard → Your Project → Analytics
- Monitor: Page views, Performance, Errors
- Review build logs for warnings
- Check bandwidth and build minutes usage

### Database Maintenance
- Set up automated backups (daily recommended)
- Monitor database size and performance
- Review slow queries
- Implement database connection pooling if needed

### Regular Tasks
- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review and rotate credentials
- [ ] Quarterly: Security audit
- [ ] As needed: Scale resources based on usage

---

## 📞 SUPPORT & RESOURCES

### Documentation Links
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Vite Documentation](https://vitejs.dev)

### Useful Commands
```bash
# Generate secure key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Test backend locally
cd backend && uvicorn main:app --reload

# Test frontend locally
cd frontend && npm run dev

# Build frontend locally
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview

# Check Python version
python --version

# Check Node version
node --version

# Install dependencies
pip install -r requirements.txt
npm install
```

---

## 🎯 QUICK DEPLOYMENT SUMMARY

### Backend (Render)
1. Add PostgreSQL database
2. Update code to use PostgreSQL
3. Create web service with Python 3.12
4. Set environment variables (especially `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`)
5. Deploy with health check on `/ping`

### Frontend (Vercel)
1. Create `vercel.json` config
2. Set `VITE_API_URL` environment variable
3. Deploy with framework preset: Vite
4. Verify CORS configuration

### Final Steps
1. Test login with admin credentials
2. Verify all features work
3. Set up custom domains (optional)
4. Configure monitoring and alerts
5. Document deployment for team

---

**Last Updated:** October 10, 2025
**Version:** 1.0.0
**Maintained by:** SwapSync Development Team

---

For questions or issues, refer to the troubleshooting section or check the application logs.

