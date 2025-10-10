# SwapSync - Installation & User Guide

## 📦 System Requirements

### Minimum Requirements:
- **Operating System:** Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 500MB free space
- **Python:** 3.10 or higher (required for backend)
- **Screen Resolution:** 1280x800 or higher

### Software Dependencies:
- **Python 3.10+** with pip
- **SQLite** (usually included with Python)
- Internet connection (only for SMS notifications - optional)

---

## 🚀 Installation

### Windows Installation

1. **Download the installer:**
   - Download `SwapSync-Setup-1.0.0.exe` from the release package

2. **Run the installer:**
   - Double-click the `.exe` file
   - If Windows Defender SmartScreen appears, click "More info" → "Run anyway"
   - Choose installation directory (default: `C:\Program Files\SwapSync`)
   - Select "Create desktop shortcut" (recommended)
   - Click "Install"

3. **Install Python dependencies:**
   ```powershell
   cd "C:\Program Files\SwapSync\resources\backend"
   python -m pip install -r requirements.txt
   ```

4. **Launch SwapSync:**
   - Double-click the desktop shortcut, or
   - Find "SwapSync" in Start Menu

### macOS Installation

1. **Download the DMG:**
   - Download `SwapSync-1.0.0.dmg`

2. **Install:**
   - Double-click the `.dmg` file
   - Drag SwapSync icon to Applications folder
   - Eject the DMG

3. **First launch:**
   - Right-click SwapSync in Applications → "Open"
   - Click "Open" in the security dialog (first launch only)

4. **Install Python dependencies:**
   ```bash
   cd /Applications/SwapSync.app/Contents/Resources/backend
   pip3 install -r requirements.txt
   ```

### Linux Installation (AppImage)

1. **Download AppImage:**
   - Download `SwapSync-1.0.0.AppImage`

2. **Make executable:**
   ```bash
   chmod +x SwapSync-1.0.0.AppImage
   ```

3. **Run:**
   ```bash
   ./SwapSync-1.0.0.AppImage
   ```

4. **Optional - Create desktop entry:**
   ```bash
   cp SwapSync-1.0.0.AppImage ~/Applications/
   # Create .desktop file for your desktop environment
   ```

---

## ⚙️ First-Time Setup

### 1. Launch Application

When you first launch SwapSync:
- The FastAPI backend starts automatically
- Database is created automatically (`swapsync.db`)
- The admin dashboard opens in the main window

### 2. Configure SMS Notifications (Optional)

SwapSync can send SMS notifications for repair updates using Twilio.

**Steps:**

1. **Get Twilio credentials:**
   - Sign up at [twilio.com](https://www.twilio.com)
   - Get your Account SID, Auth Token, and Phone Number

2. **Create `.env` file:**
   
   **Windows:**
   ```
   %APPDATA%\SwapSync\.env
   ```
   
   **macOS:**
   ```
   ~/Library/Application Support/SwapSync/.env
   ```
   
   **Linux:**
   ```
   ~/.config/SwapSync/.env
   ```

3. **Add credentials:**
   ```env
   ENABLE_SMS=True
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Restart SwapSync**

### 3. Create Your First Records

1. **Navigate to Dashboard** (automatically opens)
2. **Add a Customer:**
   - Click "Customers" (Coming Soon page)
   - Manual database entry for now (future UI update)
3. **Add Phone Inventory:**
   - Click "Phones" (Coming Soon page)
4. **Start Recording Transactions:**
   - **Swaps:** Click "Swaps" to record trade-in transactions
   - **Sales:** Click "Sales" to record direct sales

---

## 📖 User Guide

### Dashboard Overview

The main dashboard shows:
- **Total Customers:** Number of registered customers
- **Total Repairs:** All repair bookings
- **Completed Repairs:** Finished repairs
- **Total Revenue:** Sum of all transactions
- **Weekly Charts:** Repairs and revenue trends
- **Customer Insights:** Retention rates
- **Recent Repairs:** Latest 5 repairs

### Recording a Swap Transaction

1. Navigate to **Swaps** page
2. Fill in the form:
   - **Customer Phone:** Customer's phone number
   - **Given Phone Description:** Details of phone being traded in
   - **Given Phone Value:** Valuation of trade-in
   - **Cash Balance:** Additional cash paid by customer
   - **New Phone:** Phone customer is receiving
3. Click **Record Swap**
4. System automatically:
   - Marks new phone as unavailable
   - Tracks trade-in phone for resale
   - Calculates potential profit/loss

### Recording a Direct Sale

1. Navigate to **Sales** page
2. Fill in:
   - **Customer Phone:** Customer's contact
   - **Phone Selection:** Phone being sold
   - **Sale Price:** Amount received
3. Click **Record Sale**
4. System calculates profit automatically

### Updating Resale Information

When you resell a trade-in phone:
1. Go to **Swaps** page
2. View **Pending Resales** section
3. Enter resale price
4. System calculates final profit/loss

### Managing Repairs (Coming Soon)

Full repair management with SMS notifications will be available in next update.

---

## 🔧 Settings & Maintenance

### Accessing Settings

1. Click **Settings** in navigation menu
2. Available options:
   - **Maintenance Mode:** Disable transactions during updates
   - **Database Backups:** Create, restore, or delete backups
   - **Data Export:** Export all data as JSON

### Creating Backups

**Automatic Backups (Recommended):**
- Configure automatic daily backups in Settings

**Manual Backups:**
1. Go to **Settings** → **Database Backups**
2. Click **Create Backup**
3. Backup saved to `/backups` folder with timestamp

**Backup Location:**
- **Windows:** `%APPDATA%\SwapSync\backups\`
- **macOS:** `~/Library/Application Support/SwapSync/backups/`
- **Linux:** `~/.config/SwapSync/backups/`

### Restoring from Backup

1. Go to **Settings** → **Database Backups**
2. Select backup file
3. Click **Restore**
4. **⚠️ Warning:** This overwrites your current database!
5. Restart application

### Exporting Data

1. Go to **Settings** → **Data Export**
2. Click **Export All Data (JSON)**
3. JSON file saved to `/exports` folder
4. Use for:
   - Reporting
   - Archiving
   - Data analysis
   - Migration to other systems

---

## 🆘 Troubleshooting

### Backend Won't Start

**Symptoms:** App opens but shows "Backend connection error"

**Solutions:**
1. Check if Python is installed: `python --version`
2. Ensure port 8000 is not in use
3. Check logs in app data directory
4. Reinstall Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Database Errors

**Symptoms:** "Database file not found" or "Permission denied"

**Solutions:**
1. Check write permissions for app data directory
2. Ensure sufficient disk space (at least 100MB)
3. Try deleting and recreating database:
   - Close app
   - Delete `swapsync.db`
   - Restart (database recreates automatically)

### SMS Not Sending

**Symptoms:** Repairs created but no SMS received

**Solutions:**
1. Verify `.env` file exists in correct location
2. Check Twilio credentials are correct
3. Ensure `ENABLE_SMS=True`
4. Verify phone number format includes country code (+233...)
5. Check Twilio account has sufficient credits
6. Restart application

### App Won't Launch

**Windows:**
1. Check Windows Defender didn't quarantine app
2. Run as Administrator
3. Check Event Viewer for errors

**macOS:**
1. Check System Preferences → Security & Privacy
2. Allow app from unidentified developer
3. Remove quarantine flag:
   ```bash
   xattr -d com.apple.quarantine /Applications/SwapSync.app
   ```

**Linux:**
1. Ensure AppImage is executable
2. Check if FUSE is installed: `fusermount --version`
3. Try running from terminal to see errors

### Performance Issues

**Symptoms:** App is slow or unresponsive

**Solutions:**
1. Close unused applications
2. Check database size (Settings → System Info)
3. Create backup and vacuum database:
   ```bash
   sqlite3 swapsync.db "VACUUM;"
   ```
4. Clear old backups (keep only recent ones)
5. Restart computer

---

## 📊 Database Location

**Important:** Know where your data is stored!

- **Windows:** `%APPDATA%\SwapSync\swapsync.db`
- **macOS:** `~/Library/Application Support/SwapSync/swapsync.db`
- **Linux:** `~/.config/SwapSync/swapsync.db`

**Backup this file regularly!**

---

## 🔄 Updating SwapSync

### Manual Update Process:

1. **Create a backup** (Settings → Create Backup)
2. **Download new version**
3. **Close SwapSync**
4. **Install new version** (installs over old version)
5. **Launch SwapSync**
6. **Verify data** (all transactions should be intact)

**Note:** Database and settings are preserved during updates.

---

## 🗑️ Uninstalling SwapSync

### Windows:

1. **Backup your data first!**
2. Go to **Settings** → **Apps** → **SwapSync**
3. Click **Uninstall**
4. Choose whether to delete app data (database)

### macOS:

1. **Backup your data first!**
2. Drag SwapSync from Applications to Trash
3. Remove app data (optional):
   ```bash
   rm -rf ~/Library/Application\ Support/SwapSync
   ```

### Linux:

1. **Backup your data first!**
2. Delete the AppImage file
3. Remove app data (optional):
   ```bash
   rm -rf ~/.config/SwapSync
   ```

---

## 📞 Support & Help

### Getting Help:

1. **Check this guide first**
2. **Review logs:**
   - Windows: `%APPDATA%\SwapSync\logs\`
   - macOS: `~/Library/Logs/SwapSync/`
   - Linux: `~/.config/SwapSync/logs/`
3. **Check documentation:**
   - `BUILD_GUIDE.md` - Build from source
   - `DEPLOYMENT_GUIDE.md` - Deployment details
   - `PROJECT_SETUP.md` - Technical overview

### Known Limitations:

- Single-user per machine (no multi-user login yet)
- SMS requires internet connection
- Cloud sync not available (local-only for now)
- Some pages still in development (marked "Coming Soon")

---

## 🎯 Best Practices

### Daily Operations:

1. ✅ **Start with dashboard** - Check overview
2. ✅ **Record transactions immediately** - Don't delay
3. ✅ **Verify swap calculations** - Check profit/loss makes sense
4. ✅ **Update resales promptly** - When trade-ins are sold

### Weekly Tasks:

1. ✅ **Create manual backup** - Before major data entry
2. ✅ **Review analytics** - Check business trends
3. ✅ **Update repair statuses** - Keep customers informed
4. ✅ **Export data** - For external reporting

### Monthly Tasks:

1. ✅ **Clean old backups** - Keep only 3-6 months
2. ✅ **Review inventory** - Check available phones
3. ✅ **Analyze profit/loss** - Adjust valuations
4. ✅ **Update SMS credits** - Ensure Twilio has balance

---

## 🔐 Security Notes

- ✅ **All data stored locally** - No cloud uploads
- ✅ **Backend only on localhost** - Not accessible from network
- ✅ **No passwords stored** - Customer data is minimal
- ⚠️ **Protect your backups** - They contain business data
- ⚠️ **Secure your .env file** - Contains Twilio credentials

---

## 📝 Version Information

- **SwapSync Version:** 1.0.0
- **Release Date:** October 2025
- **Backend:** FastAPI (Python)
- **Frontend:** React + Electron
- **Database:** SQLite
- **Platform:** Desktop (Windows, macOS, Linux)

---

## 🎉 You're All Set!

SwapSync is now ready to manage your phone shop operations.

**Quick Start:**
1. ✅ Application installed
2. ✅ Database initialized
3. ✅ SMS configured (optional)
4. ✅ First backup created
5. ✅ Ready to record transactions!

**Happy Swapping! 📱💰**

