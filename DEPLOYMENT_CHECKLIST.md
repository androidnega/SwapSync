# SwapSync Deployment Checklist
**Complete this checklist before deploying to production**

---

## ✅ Pre-Deployment Tasks

### Backend Preparation
- [x] ~~Added PostgreSQL driver to requirements.txt~~ ✓ (psycopg2-binary>=2.9.0)
- [x] ~~Updated database.py to support PostgreSQL~~ ✓ (handles both SQLite and PostgreSQL)
- [ ] Set up PostgreSQL database (Render, Supabase, or Neon)
- [ ] Generated secure SECRET_KEY
- [ ] Created production environment variables list
- [ ] Changed default admin password
- [ ] Configured SMS credentials (Arkasel/Hubtel)
- [ ] Tested backend with PostgreSQL locally (optional)
- [ ] Removed swapsync.db from git tracking
- [ ] Set DEBUG=False for production

### Frontend Preparation
- [x] ~~Created vercel.json configuration~~ ✓ (frontend/vercel.json)
- [ ] Tested production build locally (`npm run build`)
- [ ] Verified dist/ is in .gitignore
- [ ] Prepared VITE_API_URL environment variable
- [ ] Reviewed API service configuration

### Repository Cleanup
- [ ] Committed all code changes
- [ ] Pushed to GitHub/GitLab
- [ ] Verified .env files are in .gitignore
- [ ] Removed sensitive data from repository
- [ ] Tagged release version (optional)

---

## 🔐 Security Setup

### Generate Credentials
```bash
# Generate SECRET_KEY (copy the output)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate secure admin password (copy the output)
python -c "import secrets, string; chars = string.ascii_letters + string.digits + string.punctuation; print(''.join(secrets.choice(chars) for _ in range(24)))"
```

### Save These Values
- [ ] SECRET_KEY: _______________________________________________
- [ ] Admin Password: ___________________________________________
- [ ] PostgreSQL URL: ___________________________________________

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Render
- [ ] Created PostgreSQL database on Render (or external provider)
- [ ] Copied DATABASE_URL
- [ ] Created new Web Service on Render
- [ ] Connected GitHub repository
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `pip install -r requirements.txt`
- [ ] Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Set Health Check Path: `/ping`
- [ ] Added all environment variables:
  - [ ] SECRET_KEY
  - [ ] DATABASE_URL
  - [ ] CORS_ORIGINS (with *.vercel.app)
  - [ ] DEBUG=False
  - [ ] ENVIRONMENT=production
  - [ ] ARKASEL_API_KEY (if using SMS)
  - [ ] DEFAULT_ADMIN_PASSWORD
- [ ] Deployed successfully
- [ ] Copied backend URL: ________________________________________

### Step 2: Deploy Frontend to Vercel
- [ ] Logged into Vercel
- [ ] Created new project
- [ ] Imported Git repository
- [ ] Set Framework Preset: `Vite`
- [ ] Set Root Directory: `frontend`
- [ ] Set Build Command: `npm run build`
- [ ] Set Output Directory: `dist`
- [ ] Added environment variable:
  - [ ] VITE_API_URL = https://your-backend.onrender.com/api
- [ ] Deployed successfully
- [ ] Copied Vercel URL: _________________________________________

### Step 3: Update CORS Configuration
- [ ] Went back to Render dashboard
- [ ] Updated CORS_ORIGINS environment variable with Vercel URLs:
  ```
  https://your-app.vercel.app,https://your-app-*.vercel.app
  ```
- [ ] Triggered manual redeploy on Render
- [ ] Waited for deployment to complete

---

## 🧪 Testing

### Backend Tests
- [ ] Tested root endpoint: `curl https://your-backend.onrender.com/`
- [ ] Tested health check: `curl https://your-backend.onrender.com/ping`
- [ ] Accessed API docs: `https://your-backend.onrender.com/docs`
- [ ] Verified no errors in Render logs

### Frontend Tests
- [ ] Visited Vercel URL
- [ ] Checked for CORS errors in browser console
- [ ] Tested admin login with new credentials
- [ ] Verified API connectivity (data loads)
- [ ] Tested core features:
  - [ ] Customer management
  - [ ] Phone inventory
  - [ ] Swap transactions
  - [ ] Repair tracking
  - [ ] Product sales
  - [ ] Reports generation
  - [ ] Invoice printing

### Database Tests
- [ ] Logged into PostgreSQL database
- [ ] Verified tables were created
- [ ] Confirmed admin user exists
- [ ] Tested data persistence (create & reload)

---

## 📊 Post-Deployment Configuration

### Monitoring Setup
- [ ] Set up Render health check alerts
- [ ] Configured Vercel analytics
- [ ] Set up error tracking (optional: Sentry)
- [ ] Enabled database backups

### Performance
- [ ] Verified page load times acceptable
- [ ] Checked API response times
- [ ] Monitored database query performance
- [ ] Reviewed Render/Vercel resource usage

### Custom Domains (Optional)
- [ ] Added custom domain to Vercel
- [ ] Updated CORS_ORIGINS with custom domain
- [ ] Configured SSL certificate
- [ ] Updated DNS records

---

## 🔒 Security Verification

- [ ] Confirmed DEBUG=False in production
- [ ] Verified HTTPS is enforced
- [ ] Checked SECRET_KEY is strong and unique
- [ ] Confirmed admin password was changed from default
- [ ] Reviewed CORS is restrictive (no wildcards except subdomains)
- [ ] Ensured .env files not committed to git
- [ ] Verified database credentials are secure
- [ ] Checked API rate limiting (if implemented)

---

## 📝 Documentation

- [ ] Updated README.md with deployment info
- [ ] Documented environment variables
- [ ] Noted backend URL for team
- [ ] Noted frontend URL for team
- [ ] Created admin credentials document (secure storage)
- [ ] Documented any custom configurations

---

## ⚠️ Known Issues & Limitations

### Current Limitations
- [ ] Acknowledged: Backups saved to disk won't persist (use database exports)
- [ ] Acknowledged: SMS config from file won't work (using env vars)
- [ ] Acknowledged: Render free tier spins down after inactivity
- [ ] Acknowledged: Database connection limits on free tiers

### Mitigation Strategies
- [ ] Set up external backup solution (if needed)
- [ ] Use environment variables for all config
- [ ] Consider upgrading to paid tiers for production
- [ ] Implement database connection pooling

---

## 📞 Support Information

### Deployment Resources
- Main Guide: `DEPLOYMENT_GUIDE.md`
- Quick Reference: `DEPLOYMENT_QUICK_REFERENCE.txt`
- Backend Preparation: `backend/prepare_for_deployment.md`

### Emergency Contacts
- Render Support: https://render.com/support
- Vercel Support: https://vercel.com/support
- Database Provider: ___________________________________________

### Rollback Plan
If deployment fails:
1. [ ] Revert to previous Git commit
2. [ ] Redeploy previous version on Render
3. [ ] Check Render logs for errors
4. [ ] Restore database backup (if needed)
5. [ ] Contact support if issue persists

---

## 🎯 Success Criteria

Deployment is successful when:
- [x] Backend responds to health checks
- [x] Frontend loads without errors
- [x] CORS is properly configured
- [x] Database connection is stable
- [x] Admin can log in
- [x] All core features work
- [x] No critical errors in logs
- [x] Performance is acceptable

---

## 📅 Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Review user reports

### Weekly
- [ ] Review performance metrics
- [ ] Check database size
- [ ] Verify backups are working

### Monthly
- [ ] Update dependencies
- [ ] Review security
- [ ] Rotate credentials (if policy requires)
- [ ] Check resource usage and costs

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature updates
- [ ] User feedback review

---

## 🏁 Final Steps

Before considering deployment complete:
- [ ] All checklist items above are completed
- [ ] Team has been notified of new deployment
- [ ] User documentation is updated
- [ ] Monitoring is active
- [ ] Backup strategy is in place
- [ ] Support plan is established

---

**Deployment Date:** __________________
**Deployed By:** __________________
**Backend URL:** __________________
**Frontend URL:** __________________
**Database Provider:** __________________

**Notes:**
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

---

**Status:** 
- [ ] In Progress
- [ ] Deployed to Staging
- [ ] Deployed to Production
- [ ] Verified & Complete ✅

---

*Last Updated: October 10, 2025*

