# SwapSync cPanel Deployment Checklist

## ✅ Files Prepared for Deployment

Your `deploy_package` folder is ready for cPanel deployment with the following structure:

```
deploy_package/
├── frontend/                    ← React Production Build
│   ├── index.html
│   ├── assets/
│   │   ├── index-Bv1zh7x5.js   (777 KB)
│   │   ├── index-UmQShnMb.css   (44 KB)
│   │   └── swapsync-DsOdEpz5.webp
│   └── [other static assets]
│
└── backend/                     ← FastAPI Backend
    ├── .htaccess               ⭐ cPanel/Passenger config
    ├── .env                    ⭐ Environment variables
    ├── passenger_wsgi.py       ⭐ WSGI entry point
    ├── main.py                 FastAPI app
    ├── requirements.txt        Python dependencies
    ├── swapsync.db            SQLite database
    ├── sms_config.json        SMS configuration
    ├── app/                   Application modules
    │   ├── api/routes/        All API routes
    │   ├── core/              Core functionality
    │   ├── models/            Database models
    │   └── schemas/           Pydantic schemas
    └── backups/               Database backups
```

---

## 📋 Pre-Deployment Configuration

### 1. Update `.htaccess` File
Edit `deploy_package/backend/.htaccess` and replace:
```apache
PassengerPython /home/<your_cpanel_username>/virtualenv/swapsync_backend/3.11/bin/python3
```
With your actual cPanel username, for example:
```apache
PassengerPython /home/swapuser/virtualenv/swapsync_backend/3.11/bin/python3
```

### 2. Update `.env` File
Edit `deploy_package/backend/.env` and configure:

**REQUIRED:**
- `SECRET_KEY`: Generate using `openssl rand -hex 32`
- `CORS_ORIGINS`: Add your production domain(s)

**OPTIONAL:**
- SMS API credentials (if using SMS notifications)
- Change `DEBUG=False` to `True` only for testing

---

## 🚀 cPanel Deployment Steps

### Step 1: Upload Files
1. Log in to your cPanel
2. Open **File Manager**
3. Navigate to `public_html` (or your app directory)
4. Upload the entire `deploy_package` folder contents:
   - Upload `frontend/` to `public_html/` (or `public_html/frontend/`)
   - Upload `backend/` to `public_html/backend/`

### Step 2: Setup Python Environment
1. Open **cPanel Terminal** or connect via SSH
2. Navigate to backend directory:
   ```bash
   cd ~/public_html/backend
   ```

3. Create Python virtual environment:
   ```bash
   python3.11 -m venv ~/virtualenv/swapsync_backend/3.11
   source ~/virtualenv/swapsync_backend/3.11/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

### Step 3: Configure Application in cPanel
1. Go to **Setup Python App** in cPanel
2. Click **Create Application**
3. Configure:
   - **Python Version**: 3.11
   - **Application Root**: `/home/yourusername/public_html/backend`
   - **Application URL**: `yourdomain.com/api` (or your preferred path)
   - **Application Startup File**: `passenger_wsgi.py`
   - **Application Entry Point**: `application`

4. Click **Create**

### Step 4: Set File Permissions
```bash
chmod 755 ~/public_html/backend
chmod 644 ~/public_html/backend/.htaccess
chmod 600 ~/public_html/backend/.env
chmod 664 ~/public_html/backend/swapsync.db
```

### Step 5: Restart Application
In cPanel Python App manager, click **Restart** button

---

## 🔧 Post-Deployment Configuration

### Frontend Configuration
1. Update frontend API base URL:
   - Edit `frontend/assets/index-*.js` or rebuild with production API URL
   - Or use environment-based API detection

### Database
- The SQLite database (`swapsync.db`) is included
- Ensure write permissions for database file and directory
- For production, consider migrating to PostgreSQL/MySQL

### Security Checklist
- ✅ Change `SECRET_KEY` in `.env`
- ✅ Set `DEBUG=False` in `.env`
- ✅ Configure proper CORS origins
- ✅ Set proper file permissions
- ✅ Enable HTTPS on your domain
- ✅ Backup database regularly

---

## 🧪 Testing

### Test Backend API
```bash
curl https://yourdomain.com/api/
curl https://yourdomain.com/api/ping
```

Expected response:
```json
{
  "message": "Welcome to SwapSync API",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/ping"
}
```

### Test Frontend
Visit: `https://yourdomain.com` (or your configured frontend path)

---

## 📝 Important Notes

1. **Python Version**: Ensure cPanel supports Python 3.11+ (or adjust version in .htaccess)
2. **Virtual Environment Path**: Must match the path in `.htaccess` PassengerPython directive
3. **Database**: SQLite is included, but for production consider PostgreSQL/MySQL
4. **File Uploads**: Ensure proper permissions for any upload directories
5. **Backups**: The `backups/` folder contains database backups
6. **SMS**: Configure SMS settings via admin panel after deployment

---

## 🆘 Troubleshooting

### Error: "Application failed to start"
- Check `.htaccess` PassengerPython path is correct
- Verify virtual environment is activated
- Check `requirements.txt` dependencies are installed
- View error logs in cPanel Error Log viewer

### Error: "500 Internal Server Error"
- Check `.env` file exists and is properly configured
- Verify database file has write permissions
- Check Python app error logs in cPanel

### Frontend not loading
- Verify `index.html` is in the correct directory
- Check file permissions (should be 644)
- Clear browser cache

### API CORS errors
- Update `CORS_ORIGINS` in `.env` file
- Include both `http://` and `https://` versions
- Restart Python application after changes

---

## 📞 Support

For issues with:
- **cPanel/Hosting**: Contact your hosting provider
- **SwapSync App**: Check application logs and error messages
- **Python Dependencies**: Ensure all packages in `requirements.txt` are installed

---

## ✅ Deployment Complete!

Once deployed, your SwapSync application should be fully functional at your domain.

**Default Admin Credentials:**
- Username: `admin`
- Password: Check your backend configuration or database

**Remember to:**
1. Change default admin password immediately
2. Configure SMS settings (if needed)
3. Set up regular database backups
4. Monitor application logs for errors

---

*Generated on: October 10, 2025*
*SwapSync Version: 1.0.0*

