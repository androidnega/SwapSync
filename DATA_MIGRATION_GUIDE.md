# 📦 Data Migration Guide

## Choose Your Path:

### 🆕 **Option 1: Start Fresh (Recommended)**
Just use the production app! Login and start adding data. It will automatically save to the PostgreSQL database.

**Pros:**
- ✅ Clean start
- ✅ No migration needed
- ✅ No conflicts

**Cons:**
- ❌ Loses local test data (but you can keep testing locally)

---

### 📤 **Option 2: Migrate Local Data to Production**

If you have important data in your local SQLite database, follow these steps:

#### **Step 1: Export Local Data**

1. **Open terminal in the backend folder:**
   ```bash
   cd backend
   ```

2. **Activate virtual environment (if using one):**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Run the export script:**
   ```bash
   python export_data.py
   ```

4. **This creates `data_export.json`** with all your local data

---

#### **Step 2: Import to Production**

**Method A: Import Directly to Railway (Recommended)**

1. **In your Railway project dashboard:**
   - Go to your backend service
   - Click "Settings" → "Service Variables"
   - Copy the `DATABASE_URL` value

2. **Set the DATABASE_URL in your terminal:**
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL="your_railway_postgres_url_here"
   
   # Mac/Linux/Git Bash
   export DATABASE_URL="your_railway_postgres_url_here"
   ```

3. **Run the import script:**
   ```bash
   python import_data.py
   ```

**Method B: Upload Export File to Railway**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link to your project:**
   ```bash
   railway link
   ```

4. **Upload and run the import:**
   ```bash
   railway run python import_data.py
   ```

---

## 🔍 **Verify Your Data**

After importing:

1. **Login to your production app:**
   - Frontend: https://swap-sync.vercel.app
   - Login with your admin credentials

2. **Check the dashboard:**
   - You should see your migrated data
   - Check products, customers, sales, etc.

3. **Verify in Railway:**
   - Go to Railway dashboard
   - Open your PostgreSQL database
   - Click "Data" tab to browse tables

---

## ⚠️ **Important Notes:**

1. **Passwords:** User passwords from SQLite will be migrated as-is (already hashed)
2. **IDs:** Database IDs will be preserved from the export
3. **Timestamps:** All timestamps will be preserved
4. **Foreign Keys:** The import respects relationships between tables
5. **Backup:** Keep your `data_export.json` file as a backup!

---

## 🆘 **Troubleshooting:**

**"No module named 'app'"**
- Make sure you're in the `backend` directory
- Run: `pip install -r requirements.txt`

**"Export file not found"**
- Run `export_data.py` first before `import_data.py`

**"Connection error"**
- Check your DATABASE_URL is correct
- Ensure Railway database is accessible

**"Duplicate key error"**
- Your production database already has data
- Either clear it first or use a fresh database

---

## 🎯 **Recommendation:**

For a **production launch**, I recommend:
1. ✅ **Start fresh** on production
2. ✅ **Keep local SQLite** for development/testing
3. ✅ **Create a proper admin user** on production
4. ✅ **Add real data** as you go

This keeps your production data clean and prevents any test data pollution!

