# 📍 SMS Configuration Storage Location

## ❓ Where is SMS Config Stored?

Your Arkasel API credentials are stored in a file called `sms_config.json`.

---

## 📂 **Storage Locations:**

### **On Railway (Production):**
```
/app/sms_config.json
```

### **Locally (Development):**
```
backend/sms_config.json
```

---

## 🔍 **Why You Can't See It:**

The `sms_config.json` file is:
- ✅ **Stored on the server** (Railway or your local machine)
- ✅ **NOT in Git** (it's in `.gitignore` for security)
- ✅ **Created when you save** SMS settings via admin panel

**This is correct behavior!** API keys should NEVER be in Git.

---

## 📊 **How to Check Your Configuration:**

### **Option 1: Via Admin Panel**

1. Login to your production app
2. Go to **Settings** or **SMS Configuration**
3. You should see:
   - "Arkasel API Key: ****" (masked)
   - "Arkasel Sender ID: SwapSync"
   - Status: Enabled/Disabled

### **Option 2: Via Railway File System**

1. Go to Railway dashboard
2. Open your backend service
3. Click "Settings" → "Deploy Logs"
4. Look for: `✅ SMS service configured from sms_config.json`

### **Option 3: Check File Directly on Railway**

```bash
# Using Railway CLI
railway run cat sms_config.json
```

---

## 📝 **File Format:**

When you save SMS config via admin panel, it creates this file:

```json
{
  "arkasel_api_key": "your_actual_api_key_here",
  "arkasel_sender_id": "SwapSync",
  "hubtel_client_id": "",
  "hubtel_client_secret": "",
  "hubtel_sender_id": "SwapSync",
  "enabled": true
}
```

---

## 🔄 **How It Works:**

### **When You Update via Admin Panel:**

1. **Frontend sends:** POST to `/api/sms-config/`
   ```json
   {
     "arkasel_api_key": "your_key",
     "arkasel_sender_id": "SwapSync",
     "enabled": true
   }
   ```

2. **Backend saves to:** `sms_config.json` file
3. **Backend reconfigures:** SMS service with new credentials
4. **SMS service** is now ready to send messages!

---

## ✅ **How to Verify It's Working:**

### **Test OTP Login:**

1. Go to: https://swap-sync.vercel.app
2. Click "📱 SMS OTP"
3. Enter your user ID
4. Click "Send OTP Code"
5. **Check your phone!**

If you receive the SMS, your Arkasel configuration is working! ✅

---

## 🚨 **Troubleshooting:**

### **"Can't see my configuration"**

**Check the admin panel:**
- The API key should show as `****` (masked for security)
- The sender ID should show: "SwapSync"
- Status should show: "Enabled"

**If showing as "Not Set":**
- Your POST request might have failed
- Check browser console for errors
- Check Railway logs for error messages

### **"SMS not sending"**

**For testing, check Railway logs:**
```bash
railway logs
```

Look for:
```
📱 OTP Code (Testing): 1234 for 0241234567
```

Or for production:
```
✅ SMS sent successfully via Arkasel
```

### **"How do I view actual API key"**

For security, the API key is never displayed after saving. Only shows `****`.

If you need to see it:
1. SSH into Railway (if possible)
2. Run: `cat sms_config.json`

---

## 🎯 **File Locations Summary:**

| Environment | File Path | Access Method |
|------------|-----------|---------------|
| **Railway Production** | `/app/sms_config.json` | Railway CLI or logs |
| **Local Development** | `backend/sms_config.json` | File explorer |
| **Git Repository** | ❌ NOT stored | .gitignore excludes it |

---

## 💡 **Pro Tip:**

To test if your Arkasel credentials work, try the OTP login:
1. Make sure a user has a phone number
2. Try SMS OTP login
3. Check if SMS arrives

If SMS arrives = Configuration working! ✅

---

## 📞 **Need Help?**

If SMS still not working:
1. Check Railway logs for errors
2. Verify Arkasel API key is valid
3. Ensure phone number format is correct (+233 or 0)
4. Check if Arkasel account has credits

Your configuration is stored safely on Railway in `sms_config.json`! 🔒

