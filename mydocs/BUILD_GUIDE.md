# SwapSync - Build & Deployment Guide

## 📦 Building Standalone Desktop App

SwapSync can be packaged as a standalone desktop application for Windows, macOS, and Linux.

---

## 🔧 Prerequisites

### Required:
1. **Node.js** (v18+) - For React frontend
2. **Python** (3.10+) - For FastAPI backend
3. **Installed Dependencies:**
   - Backend: `cd swapsync-backend && pip install -r requirements.txt`
   - Frontend: `cd swapsync-frontend && npm install`

---

## 🚀 Development Mode

### Terminal 1 - Backend:
```bash
cd swapsync-backend
.\venv\Scripts\activate   # Windows
source venv/bin/activate  # Mac/Linux
uvicorn main:app --reload
```

### Terminal 2 - Frontend:
```bash
cd swapsync-frontend
npm run electron:dev
```

**Result:** Electron app launches with hot-reload for both frontend and backend.

---

## 📦 Production Build

### Build for Current Platform:
```bash
cd swapsync-frontend
npm run electron:build
```

### Build for Specific Platform:

**Windows (.exe):**
```bash
npm run dist:win
```

**macOS (.dmg):**
```bash
npm run dist:mac
```

**Linux (.AppImage):**
```bash
npm run dist:linux
```

**All Platforms:**
```bash
npm run dist
```

---

## 📁 Build Output

Built applications will be in:
```
swapsync-frontend/release/
├── SwapSync Setup 0.0.0.exe        # Windows installer
├── SwapSync-0.0.0.dmg              # macOS disk image
└── SwapSync-0.0.0.AppImage         # Linux app image
```

---

## 🏗️ What Gets Packaged

### Frontend:
- ✅ Built React app (from `dist/`)
- ✅ Electron main process
- ✅ Node modules (production only)

### Backend:
- ✅ FastAPI Python code (`app/` folder)
- ✅ Main application (`main.py`)
- ✅ Requirements (`requirements.txt`)
- ✅ SQLite database (empty, will be created on first run)
- ❌ Virtual environment (excluded - will be created on install)
- ❌ Test files (excluded)
- ❌ `.env` file (excluded - user creates their own)

---

## 🔒 Production Considerations

### Backend Integration:

**In Production Build:**
1. Electron spawns Python subprocess
2. FastAPI starts on `http://127.0.0.1:8000`
3. Frontend communicates with local backend
4. Data stored in local SQLite database

**Database Location:**
- Windows: `%APPDATA%/SwapSync/swapsync.db`
- macOS: `~/Library/Application Support/SwapSync/swapsync.db`
- Linux: `~/.config/SwapSync/swapsync.db`

### Security:
- ✅ All data stored locally
- ✅ No internet required (except for SMS)
- ✅ Backend only accessible on localhost
- ⚠️ User should set secure `SECRET_KEY` in `.env`

---

## 🛠️ Build Customization

### Change App Version:
Edit `package.json`:
```json
{
  "version": "1.0.0"
}
```

### Add App Icon:
Place icons in `public/`:
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon
- `icon.png` - Linux icon (512x512px recommended)

### Configure Installer:
Edit `package.json` → `build` section:
```json
{
  "build": {
    "productName": "SwapSync",
    "appId": "com.swapsync.app",
    ...
  }
}
```

---

## 📝 Pre-Build Checklist

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] App version updated in `package.json`
- [ ] App icons created (optional)
- [ ] `.env.example` copied to `.env` with production values
- [ ] Database migrations tested
- [ ] All features tested in development mode

---

## 🚀 Distribution

### Windows:
- `.exe` installer with NSIS
- Supports custom installation directory
- Creates desktop shortcut
- Creates Start Menu entry

### macOS:
- `.dmg` disk image
- Drag-and-drop installation
- Code signing recommended (requires Apple Developer account)

### Linux:
- `.AppImage` - Portable, no installation needed
- Run with: `chmod +x SwapSync-*.AppImage && ./SwapSync-*.AppImage`

---

## 🐛 Troubleshooting

### "Backend failed to start"
- Ensure Python is installed on target machine
- Check `requirements.txt` dependencies are available
- Verify port 8000 is not in use

### "Database error"
- Check write permissions for app data directory
- Ensure SQLite is supported on platform
- Delete old database and restart

### "Build failed"
- Clear `node_modules` and reinstall
- Clear `dist/` folder
- Check disk space (builds can be large)

---

## 📚 Additional Resources

- **Electron Builder:** https://www.electron.build/
- **FastAPI Deployment:** https://fastapi.tiangolo.com/deployment/
- **SQLite:** https://www.sqlite.org/

---

**For Support:** Check logs in:
- Windows: `%APPDATA%/SwapSync/logs/`
- macOS: `~/Library/Logs/SwapSync/`
- Linux: `~/.config/SwapSync/logs/`

