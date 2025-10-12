# 🚨 URGENT: Database Migration Required

Your production server is crashing because the database is missing the new `use_company_sms_branding` column.

## Quick Fix (2 minutes)

### Option 1: Automatic Migration (Recommended)

The migration will run automatically when you restart your server. The `run_migrations.py` script runs on startup.

**Just restart your backend:**

```bash
# If using Railway:
# Push to git (already done) - Railway will auto-deploy and run migrations

# If using PM2:
pm2 restart swapsync

# If using systemd:
systemctl restart swapsync

# If running manually:
# Stop the server
# Start it again: python main.py
```

The startup sequence will:
1. Run `run_migrations.py`
2. Execute `migrate_add_sms_branding.py`
3. Add the missing column
4. Start the server successfully

---

### Option 2: Manual Migration (If automatic fails)

**SSH into your production server:**

```bash
cd /app  # Your backend directory

# Run the migration
python migrate_add_sms_branding.py

# Expected output:
# ============================================================
# MIGRATION: Add SMS Branding Toggle
# ============================================================
# 
# Adding use_company_sms_branding column...
# ✅ Added use_company_sms_branding column (default: 0 = SwapSync branding)
# 
# ✅ Migration completed successfully!

# Then restart your backend
pm2 restart swapsync  # or your restart command
```

---

## What This Migration Does

Adds a new column to the `users` table:

```sql
ALTER TABLE users 
ADD COLUMN use_company_sms_branding INTEGER DEFAULT 0
```

- `0` = Use "SwapSync" branding (default)
- `1` = Use company's custom branding

---

## After Migration

### Enable SMS Branding for Companies

1. Login as **Admin**
2. Go to **Staff Management** > **All Companies** tab
3. Find each company (e.g., DailyCoins, ABC Shop, etc.)
4. Toggle **"SMS Branding"** ON for companies that want custom branding
5. SMS will now use: "DailyCoins", "ABC Shop", etc.

### How It Works

- **Transaction SMS** (repairs, swaps, sales):
  - If toggle ON: Uses company name (e.g., "DailyCoins")
  - If toggle OFF: Uses "SwapSync"
  
- **System SMS** (monthly wishes, holidays, admin broadcasts):
  - Always uses "SwapSync" regardless of toggle

---

## Troubleshooting

If you still see the error after migration:

1. Check if column was added:
   ```sql
   -- In PostgreSQL:
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'use_company_sms_branding';
   ```

2. Verify migration ran:
   ```bash
   python migrate_add_sms_branding.py
   ```

3. Check server logs for migration output

4. Restart backend again

---

## Contact

If issues persist, the migration script is designed to work with both:
- SQLite (local development)
- PostgreSQL (production)

Check the logs and let me know what you see!

