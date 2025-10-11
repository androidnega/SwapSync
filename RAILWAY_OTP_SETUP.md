# 🚀 Railway OTP Setup Guide

## Step 1: Run Database Migration

Your Railway backend needs to create the `otp_sessions` table.

### Method A: Railway CLI (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migration
railway run python migrate_add_otp_sessions.py
```

### Method B: Add to Railway Start Command
In Railway dashboard:
1. Go to your backend service
2. Click "Settings"
3. Update "Start Command" to:
   ```
   python migrate_add_otp_sessions.py && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Redeploy

### Method C: Run Locally Against Production DB
```bash
# Get your Railway DATABASE_URL
# From Railway dashboard → PostgreSQL → Variables → DATABASE_URL

# Set environment variable
$env:DATABASE_URL="your_railway_postgres_url"

# Run migration
cd backend
python migrate_add_otp_sessions.py
```

---

## Step 2: Verify SMS Configuration

Your SMS service is already configured! Just make sure your `sms_config.json` has:

```json
{
  "arkasel": {
    "api_key": "your_arkasel_key",
    "sender_id": "SwapSync"
  },
  "hubtel": {
    "client_id": "your_hubtel_id",
    "client_secret": "your_hubtel_secret",
    "sender_id": "SwapSync"
  }
}
```

If SMS isn't configured, OTP codes will print to console (for testing).

---

## Step 3: Test the System

### On Production (Vercel):
1. Go to: https://swap-sync.vercel.app
2. Click "📱 SMS OTP" button
3. Enter a username (must have phone number registered)
4. Receive 4-digit code via SMS
5. Enter code (auto-submits after 4th digit)
6. Logged in! ✅

### Locally:
```bash
# Backend
cd backend
uvicorn main:app --reload

# Frontend
cd frontend
npm run dev

# Visit: http://localhost:5173
```

---

## Step 4: How Users Get Phone Numbers

Users need phone numbers registered during account creation:

### For Existing Users (Add Phone Number):
Update user records manually in database:
```sql
UPDATE users 
SET phone_number = '0241234567' 
WHERE username = 'john_doe';
```

### For New Users:
When CEO creates accounts (`/api/auth/register`), ensure `phone_number` is included:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "password": "securepass",
  "phone_number": "0241234567",
  "role": "shop_keeper"
}
```

---

## 🔐 Security Features

✅ **5-minute expiration** - OTP codes expire quickly  
✅ **Maximum 3 attempts** - Prevents brute force  
✅ **One-time use** - Each OTP works only once  
✅ **Rate limiting** - Can't spam OTP requests  
✅ **IP tracking** - Security audit trail  
✅ **Phone masking** - Only shows last 4 digits  

---

## 🎯 User Experience

### Login Flow:
1. **Toggle to SMS OTP**
2. **Enter username**
3. **Receive SMS** (4-digit code)
4. **Enter code** (auto-submits!)
5. **Logged in!** ✨

### Features:
- ✅ Beautiful 4-box input
- ✅ Auto-focus and auto-advance
- ✅ Backspace support
- ✅ Paste support
- ✅ Real-time countdown (5:00 → 0:00)
- ✅ Resend OTP button
- ✅ Error shake animation
- ✅ Color feedback (gray → green → blue)

---

## 🧪 Testing Without SMS

For testing/development without SMS service:

The OTP code will print to console:
```
📱 OTP Code (Testing): 1234 for 0241234567
```

Just enter this code on the frontend.

---

## 📊 Monitoring

Check OTP sessions in database:
```sql
SELECT * FROM otp_sessions 
ORDER BY created_at DESC 
LIMIT 10;
```

Monitor SMS delivery:
```sql
SELECT * FROM sms_logs 
WHERE message LIKE '%login code%'
ORDER BY sent_at DESC;
```

---

## 🎨 Customization

### Change OTP Length (default 4):
Edit `backend/app/models/otp_session.py`:
```python
@staticmethod
def generate_otp():
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])  # 6 digits
```

Update frontend `OTPInput` length:
```typescript
<OTPInput length={6} ... />
```

### Change Expiration Time (default 5 minutes):
Edit `backend/app/models/otp_session.py`:
```python
expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=10))
```

### Customize SMS Message:
Edit `backend/app/api/routes/otp_routes.py`:
```python
message = f"Your {company_name} login code is: {otp_code}\n\nValid for 5 minutes."
```

---

## ✅ Deployment Checklist

- [ ] Database migration run on Railway
- [ ] SMS service configured (or console logging for testing)
- [ ] Users have phone numbers in database
- [ ] Frontend deployed on Vercel (auto-deployed)
- [ ] Backend deployed on Railway (auto-deployed)
- [ ] Test login with SMS OTP
- [ ] Monitor SMS delivery
- [ ] Check error handling

---

## 🚨 Troubleshooting

**"No phone number registered"**
→ User needs phone number in database

**"Failed to send OTP"**
→ Check SMS configuration in `sms_config.json`

**"OTP expired"**
→ Code is only valid for 5 minutes, request new one

**"Too many failed attempts"**
→ User tried 3 times, need to request new OTP

**"Invalid OTP code"**
→ Check SMS logs for actual code sent

---

## 🎉 You're Done!

Your SMS OTP login system is now production-ready!

Users can now login with:
- 🔑 **Password** (traditional)
- 📱 **SMS OTP** (modern, secure)

Both methods work seamlessly! 🚀

