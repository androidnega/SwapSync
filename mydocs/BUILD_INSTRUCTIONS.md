# SwapSync - Build Instructions

## 🚀 Building SwapSync for Production

This guide explains how to build SwapSync installers for Windows, macOS, and Linux.

---

## Prerequisites

Before building, ensure you have:

### Required:
- ✅ **Node.js** 18+ installed
- ✅ **Python** 3.10+ installed
- ✅ **npm** or **yarn**
- ✅ All dependencies installed

### Platform-Specific:
- **Windows:** Requires NSIS (auto-installed by electron-builder)
- **macOS:** Requires Xcode Command Line Tools
- **Linux:** Requires `fuse` and `rpm`/`deb` tools

---

## Step 1: Prepare Backend

```bash
cd swapsync-backend

# Create/activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Test backend starts correctly
python main.py
# Should see: "INFO: Application startup complete."
# Press Ctrl+C to stop

cd ..
```

---

## Step 2: Prepare Frontend

```bash
cd swapsync-frontend

# Install dependencies
npm install

# Test development build
npm run electron:dev
# App should launch
# Close the app

# Build React app for production
npm run build
# Should create 'dist/' folder
```

---

## Step 3: Build for Your Platform

### Option A: Build for Current Platform Only

```bash
# Still in swapsync-frontend directory

# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

### Option B: Build for All Platforms

```bash
npm run dist
```

**Note:** Cross-platform building has limitations:
- Windows → Can build for Windows only
- macOS → Can build for macOS and Linux
- Linux → Can build for Linux and Windows

---

## Step 4: Locate Build Output

Built installers will be in:
```
swapsync-frontend/release/
├── SwapSync-Setup-1.0.0.exe        # Windows installer (~150MB)
├── SwapSync-1.0.0.dmg              # macOS disk image (~140MB)
└── SwapSync-1.0.0.AppImage         # Linux portable app (~160MB)
```

---

## Step 5: Test the Build

### Windows:
1. Run `SwapSync-Setup-1.0.0.exe`
2. Complete installation
3. Launch SwapSync from desktop or Start Menu
4. Verify backend starts (check console output)
5. Test all features

### macOS:
1. Open `SwapSync-1.0.0.dmg`
2. Drag to Applications
3. Right-click → Open (first time)
4. Verify backend starts
5. Test all features

### Linux:
1. Make AppImage executable:
   ```bash
   chmod +x SwapSync-1.0.0.AppImage
   ```
2. Run:
   ```bash
   ./SwapSync-1.0.0.AppImage
   ```
3. Verify backend starts
4. Test all features

---

## Common Build Issues

### Issue: "electron-builder: command not found"

**Solution:**
```bash
npm install electron-builder --save-dev
```

### Issue: Backend not starting in packaged app

**Causes:**
1. Python not installed on target machine
2. Dependencies not installed
3. Wrong Python path in electron/main.js

**Solution:**
- Ensure Python 3.10+ is installed
- Install requirements:
  ```bash
  cd resources/backend
  pip install -r requirements.txt
  ```

### Issue: Build fails with "out of memory"

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS=--max_old_space_size=4096
npm run dist
```

### Issue: macOS "App is damaged" error

**Solution:**
```bash
xattr -cr /Applications/SwapSync.app
```

### Issue: Windows Defender blocks installer

**Solution:**
- This is normal for unsigned apps
- Click "More info" → "Run anyway"
- For distribution, consider code signing

---

## Build Configuration

### Changing Version Number:

Edit `swapsync-frontend/package.json`:
```json
{
  "version": "1.0.0"  // Change this
}
```

### Changing App Name:

Edit `swapsync-frontend/electron-builder.yml`:
```yaml
productName: SwapSync  # Change this
appId: com.swapsync.app  # Change this
```

### Adding App Icons:

Replace placeholder icons in `swapsync-frontend/public/`:
- `icon.ico` - Windows (256x256px)
- `icon.icns` - macOS (512x512px)
- `icon.png` - Linux (512x512px)

**Create icons from PNG:**
```bash
# Windows ICO
npm install -g png-to-ico
png-to-ico icon.png icon.ico

# macOS ICNS
# Use Icon Composer or online converter

# Linux PNG
# Just use PNG directly
```

---

## Code Signing (Optional)

### Windows:

1. Get code signing certificate
2. Add to electron-builder.yml:
   ```yaml
   win:
     certificateFile: path/to/cert.pfx
     certificatePassword: ${env.CERT_PASSWORD}
   ```

### macOS:

1. Get Apple Developer account
2. Install developer certificate
3. Add to electron-builder.yml:
   ```yaml
   mac:
     identity: "Developer ID Application: Your Name"
   ```

### Linux:

Not typically required for Linux distributions.

---

## Distribution

### For Single Shop:

1. Copy installer to USB drive
2. Install on shop computer
3. Follow INSTALLATION_GUIDE.md
4. Configure SMS credentials
5. Create initial backup

### For Multiple Shops:

1. Create installation package with:
   - Installer
   - INSTALLATION_GUIDE.md
   - Quick start guide
   - Support contact info
2. Test on clean machine first
3. Provide training materials
4. Setup remote support if needed

---

## Build Scripts Reference

All scripts in `swapsync-frontend/package.json`:

```json
{
  "scripts": {
    "dev": "vite",                              // Dev server only
    "build": "vite build",                      // Build React app
    "electron:dev": "concurrently ...",         // Full dev mode
    "electron:build": "npm run build && electron-builder",  // Build current platform
    "dist": "npm run build && electron-builder --win --mac --linux",  // All platforms
    "dist:win": "npm run build && electron-builder --win",    // Windows only
    "dist:mac": "npm run build && electron-builder --mac",    // macOS only
    "dist:linux": "npm run build && electron-builder --linux" // Linux only
  }
}
```

---

## Debugging Build Issues

### Enable Verbose Logging:

```bash
DEBUG=electron-builder npm run dist
```

### Check Electron Console:

In development:
- Press `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (macOS)
- View console for errors

### Check Backend Logs:

Backend logs print to Electron console:
```
[Backend] INFO: Application startup complete.
[Backend] ✅ Database initialized successfully!
```

If backend fails, errors will appear here.

---

## Clean Build

If builds are acting strange:

```bash
cd swapsync-frontend

# Remove old builds
rm -rf dist/
rm -rf release/
rm -rf node_modules/.vite/

# Reinstall dependencies
rm -rf node_modules/
npm install

# Try building again
npm run dist:win  # or your platform
```

---

## Build Checklist

Before building for production:

- [ ] Backend tested and working
- [ ] Frontend tested and working
- [ ] Version number updated
- [ ] All dependencies installed
- [ ] App icons created (or using placeholders)
- [ ] INSTALLATION_GUIDE.md reviewed
- [ ] Test on clean machine planned
- [ ] Backup/restore tested
- [ ] SMS configured (if needed)
- [ ] Documentation reviewed

---

## Post-Build Testing

After building, test on a **clean machine** (no dev tools):

1. **Installation:**
   - [ ] Installer runs without errors
   - [ ] App installs to correct location
   - [ ] Shortcuts created properly

2. **First Launch:**
   - [ ] App opens without errors
   - [ ] Backend starts automatically
   - [ ] Database created successfully
   - [ ] No console errors

3. **Functionality:**
   - [ ] Dashboard loads and displays data
   - [ ] Can create customers/phones
   - [ ] Can record swaps
   - [ ] Can record sales
   - [ ] Analytics display correctly
   - [ ] Backups can be created
   - [ ] Data can be exported
   - [ ] Settings page works

4. **Performance:**
   - [ ] App starts in < 10 seconds
   - [ ] UI responds quickly
   - [ ] No memory leaks
   - [ ] Backend API responds in < 500ms

---

## Success Criteria

Build is successful when:

✅ Installer created without errors  
✅ App runs on clean machine  
✅ Backend starts automatically  
✅ Database initializes  
✅ All features work  
✅ No critical errors in console  
✅ Performance is acceptable  

---

## Support

If you encounter issues:

1. Check this guide
2. Review error logs
3. Test in development mode first
4. Check all dependencies installed
5. Try clean build

---

**SwapSync Build Instructions - v1.0.0**  
**Last Updated:** October 8, 2025

