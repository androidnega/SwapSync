# SwapSync - Deployment Guide

## 🎯 Overview

SwapSync is a desktop application that bundles:
- **Frontend:** React + Electron
- **Backend:** FastAPI (Python)
- **Database:** SQLite (local file)

---

## 🏗️ Architecture

### Development Mode:
```
Terminal 1: FastAPI Backend (manual start)
    ↓
Terminal 2: Vite Dev Server → Electron App
    ↓
Frontend talks to http://127.0.0.1:8000
```

### Production Mode:
```
Electron App Launches
    ↓
Spawns FastAPI Backend (subprocess)
    ↓
Waits for Backend Ready
    ↓
Loads Built React App
    ↓
Frontend talks to http://127.0.0.1:8000
```

---

## 📦 Building for Distribution

### 1. Prepare Backend

```bash
cd swapsync-backend

# Ensure all dependencies are in requirements.txt
pip freeze > requirements.txt

# Test backend runs correctly
python main.py
```

### 2. Prepare Frontend

```bash
cd swapsync-frontend

# Install dependencies
npm install

# Build React app
npm run build
```

### 3. Package Electron App

**For Windows:**
```bash
npm run dist:win
```

**For macOS:**
```bash
npm run dist:mac
```

**For Linux:**
```bash
npm run dist:linux
```

**For All Platforms:**
```bash
npm run dist
```

---

## 📂 What Gets Packaged

### Included in Build:
- ✅ React app (built, optimized)
- ✅ Electron shell
- ✅ FastAPI backend code
- ✅ Python dependencies
- ✅ SQLite database (empty)
- ✅ Configuration files

### Excluded from Build:
- ❌ `node_modules/` (bundled separately)
- ❌ Python `venv/` (too large)
- ❌ `__pycache__/` (Python cache)
- ❌ Test files
- ❌ `.env` files (user-specific)

---

## 🔐 Production Setup

### 1. Python Environment

**Option A: System Python (Recommended for deployment)**
- Install Python 3.10+ on target machine
- Install dependencies: `pip install -r requirements.txt`

**Option B: Embedded Python**
- Bundle Python with app (adds ~50MB)
- Use `python-embedded` for Windows
- Package Python in `extraResources`

### 2. Environment Configuration

Create `.env` file in app data directory:

**Windows:**
```
%APPDATA%/SwapSync/.env
```

**macOS:**
```
~/Library/Application Support/SwapSync/.env
```

**Linux:**
```
~/.config/SwapSync/.env
```

**Example `.env`:**
```env
ENABLE_SMS=True
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Database

**Auto-created on first run:**
- Windows: `%APPDATA%/SwapSync/swapsync.db`
- macOS: `~/Library/Application Support/SwapSync/swapsync.db`
- Linux: `~/.config/SwapSync/swapsync.db`

---

## 🚀 Installation Instructions (End User)

### Windows:

1. Download `SwapSync Setup.exe`
2. Run installer
3. Choose installation directory
4. Complete installation
5. Launch from desktop shortcut or Start Menu

### macOS:

1. Download `SwapSync.dmg`
2. Open DMG file
3. Drag SwapSync to Applications folder
4. Launch from Applications

### Linux:

1. Download `SwapSync.AppImage`
2. Make executable: `chmod +x SwapSync-*.AppImage`
3. Run: `./SwapSync-*.AppImage`

---

## ⚙️ First-Time Setup

### 1. **Launch Application**
- SwapSync window opens
- Backend starts automatically
- Database initialized

### 2. **Configure SMS (Optional)**
- Get Twilio credentials from https://www.twilio.com
- Create `.env` file in app data directory
- Add Twilio credentials
- Set `ENABLE_SMS=True`
- Restart app

### 3. **Start Using**
- Navigate to Customers → Add first customer
- Navigate to Phones → Add inventory
- Start recording sales, swaps, and repairs!

---

## 🔄 Updates and Backups

### Updating the App:
1. Download new version
2. Install over existing version
3. Database and settings preserved

### Backing Up Data:
**Backup the database file:**
- Windows: Copy `%APPDATA%/SwapSync/swapsync.db`
- macOS: Copy `~/Library/Application Support/SwapSync/swapsync.db`
- Linux: Copy `~/.config/SwapSync/swapsync.db`

**Restore:**
- Replace `swapsync.db` with backup file
- Restart application

---

## 🐛 Troubleshooting

### Backend Won't Start:
1. Check if Python is installed: `python --version`
2. Check port 8000 is available
3. View logs in app data directory
4. Reinstall Python dependencies

### Database Errors:
1. Check write permissions
2. Delete database file (will recreate)
3. Check disk space

### Connection Errors:
1. Ensure backend is running (check Task Manager/Activity Monitor)
2. Try restarting the app
3. Check firewall isn't blocking localhost

---

## 📊 File Sizes (Approximate)

- **Windows Installer:** ~150MB
- **macOS DMG:** ~140MB
- **Linux AppImage:** ~160MB

*(Sizes vary based on included Python and dependencies)*

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Test all CRUD operations
- [ ] Test SMS notifications (if enabled)
- [ ] Test backup and restore
- [ ] Verify analytics calculations
- [ ] Test on clean machine (no Python/Node)
- [ ] Check app launches without errors
- [ ] Verify database permissions
- [ ] Test offline functionality
- [ ] Document for end users
- [ ] Create user manual

---

## 📝 Known Limitations

- Requires Python to be installed on target machine (or bundle Python)
- SMS requires internet connection and Twilio account
- Multi-user mode not implemented (single-user per machine)
- Cloud sync not available (local-only)

---

## 🔮 Future Enhancements

Possible additions for v2.0:
- Cloud sync (PostgreSQL backend)
- Multi-shop support
- User authentication
- Mobile app companion
- Barcode scanning
- Receipt printing
- Cloud backups
- Web-based admin panel

---

## 📞 Support

For issues or questions:
1. Check logs in app data directory
2. Verify Python and dependencies
3. Check internet connection (for SMS)
4. Review this guide

---

**SwapSync v1.0.0 - Phone Swapping & Repair Management System**  
Built with React, FastAPI, Electron, and SQLite

