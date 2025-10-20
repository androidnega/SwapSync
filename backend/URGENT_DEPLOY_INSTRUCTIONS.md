# 🚨 URGENT: Backend Deployment Required

## Problem
Your backend at `api.digitstec.store` is showing "Method Not Allowed" because it hasn't been updated with the permission fixes.

## ✅ Fixes Already in GitHub
All code fixes are committed and pushed to GitHub:
- Commit `f1382b8`: Products endpoint now allows shop_keeper role
- Commit `824828f`: POS sales endpoints now allow shop_keeper role

## 🚀 Deploy Now (Choose ONE Method)

### Method 1: SSH Deployment (FASTEST)
```bash
# SSH into your server
ssh your-username@digitstec.store

# Navigate to backend
cd ~/digitstec.store/backend
# OR if different path:
# cd ~/public_html/api/backend

# Pull latest changes
git pull origin main

# Restart Passenger
touch tmp/restart.txt

# Done! Wait 5 seconds and test.
```

### Method 2: cPanel Git Deploy
1. Login to cPanel: https://digitstec.store:2083
2. Search for "Git Version Control"
3. Click "Manage" next to your backend repository
4. Click "Pull or Deploy" tab
5. Click "Update from Remote"
6. Click "Deploy HEAD commit"
7. Done!

### Method 3: cPanel File Manager (Manual Restart)
1. Login to cPanel
2. Open "File Manager"
3. Navigate to: `digitstec.store/backend/`
4. Create/Enter folder: `tmp`
5. Create or touch file: `restart.txt`
6. Right-click → "Edit" → Save (or create new file)
7. Wait 5 seconds - Passenger will auto-restart

### Method 4: Python App Manager
1. Login to cPanel
2. Go to "Setup Python App"
3. Find: `digitstec.store/backend`
4. Click "Stop" button
5. Wait 2 seconds
6. Click "Start" button
7. Done!

## 🔍 Verify Deployment Worked

Test the API:
```bash
curl https://api.digitstec.store/api/docs
```

Or visit in browser:
https://api.digitstec.store/api/docs

Should show Swagger documentation with updated timestamp.

## ⚡ Quick Test After Deploy

1. Login as shop keeper
2. Go to POS System
3. Should load products without 405 error
4. Go to My Transactions
5. Should load transaction history without 405 error

## 🆘 Still Not Working?

If you still get 405 errors after restarting:
1. Check server logs: `tail -f logs/error.log`
2. Verify git pull worked: `git log -n 1`
3. Check Python version: `python --version` (should be 3.11)
4. Restart manually: `systemctl restart passenger` (if root access)

## 📞 Contact Info
If you need help deploying, provide:
- Your hosting provider name
- cPanel access (or SSH access)
- We'll deploy it for you immediately

