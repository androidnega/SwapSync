# CORS Fix & Deployment Guide

## Problem Summary
The frontend at `https://swapsync.digitstec.store` cannot access the backend API at `https://api.digitstec.store` due to CORS (Cross-Origin Resource Sharing) errors.

## Changes Made

### 1. Backend CORS Configuration (`backend/vercel.json`)
Updated the Vercel configuration to explicitly set CORS headers:
- Added `Access-Control-Allow-Origin: *`
- Added `Access-Control-Allow-Methods: GET,OPTIONS,PATCH,DELETE,POST,PUT`
- Added `Access-Control-Allow-Headers` for authorization and content-type
- Added `Access-Control-Allow-Credentials: true`

### 2. FastAPI OPTIONS Handler (`backend/main.py`)
Added an explicit OPTIONS handler for CORS preflight requests:
```python
@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
        }
    )
```

### 3. VSCode Settings (`.vscode/settings.json`)
Added settings to suppress false CSS warnings for Tailwind directives:
```json
{
  "css.lint.unknownAtRules": "ignore"
}
```

## Deployment Steps

### Step 1: Commit Changes
```bash
git add .
git commit -m "Fix CORS issues for production deployment"
git push origin main
```

### Step 2: Deploy Backend
The backend needs to be redeployed to `api.digitstec.store` with the new configuration:

**If using Vercel:**
```bash
cd backend
vercel --prod
```

**If using another platform:**
- Redeploy the backend application
- Ensure environment variables are properly set
- Verify the database is accessible

### Step 3: Verify CORS Headers
After deployment, test the CORS headers:
```bash
curl -I -X OPTIONS https://api.digitstec.store/api/swaps/ \
  -H "Origin: https://swapsync.digitstec.store" \
  -H "Access-Control-Request-Method: GET"
```

You should see these headers in the response:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`

### Step 4: Test the Frontend
1. Open `https://swapsync.digitstec.store`
2. Log in to the application
3. Navigate to the swap pages
4. Check browser console - CORS errors should be gone
5. Data should load successfully

## About the "Missing Swap" Issue

The swap is showing in the statistics (Total Swaps: 1, Pending Resale: 1) but not in the Completed Swaps list because:

1. **Completed Swaps Page filters out pending swaps**
   - The page only shows swaps with `resale_status !== 'pending'`
   - Your swap has status `'pending'` so it's hidden

2. **To see pending swaps:**
   - Go to **Swapping Hub** or **Swap Manager** page
   - These pages show ALL swaps including pending ones

3. **To mark a swap as completed:**
   - The trade-in phone needs to be resold
   - Use the "Mark as Resold" feature in the Swap Manager
   - Once marked as sold with a resale value, it will appear in Completed Swaps

## Troubleshooting

### If CORS errors persist:
1. Clear browser cache and reload
2. Check that backend redeployment was successful
3. Verify domain configuration in hosting platform
4. Check backend logs for any errors

### If 500 errors occur:
1. Check backend database connection
2. Verify all migrations have run
3. Check backend logs for detailed error messages
4. Ensure all required tables exist (phones, swaps, customers, etc.)

### If data still doesn't load:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Check API requests:
   - Status should be 200 (not 500 or CORS errors)
   - Response should contain data
5. If authentication errors occur, try logging out and back in

## Additional Notes

- The backend already had the correct CORS domains in `settings.ALLOWED_ORIGINS`
- The issue was that Vercel wasn't applying these headers consistently
- The explicit `vercel.json` configuration ensures headers are always sent
- The OPTIONS handler in FastAPI provides an additional layer of CORS support

## Next Steps After Deployment

1. ✅ Verify no CORS errors in browser console
2. ✅ Test all swap-related pages load correctly
3. ✅ Verify pending swaps appear in Swap Manager
4. ✅ Test creating new swaps
5. ✅ Test marking swaps as completed

