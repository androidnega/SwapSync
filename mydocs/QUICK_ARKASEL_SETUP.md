# 📱 QUICK ARKASEL SMS SETUP (5 Minutes)

## ✅ What You Need

1. Arkasel Account (Free to create)
2. API Key from Arkasel
3. Credits/Top-up (GH₵10-20 to start)

---

## 🚀 Super Quick Setup (3 Steps)

### **Step 1: Get Arkasel API Key** (2 minutes)

1. Go to: **https://sms.arkesel.com**
2. **Sign Up** (if new) or **Login**
3. Go to **Settings** → **API Settings**
4. **Copy your API Key** (looks like: `aBcD123XyZ...`)
5. **Add Credits** (Buy GH₵10-20 worth of SMS)

---

### **Step 2: Configure SwapSync** (1 minute)

**Option A: Environment File (Recommended)**

1. Copy the template:
   ```bash
   cd swapsync-backend
   copy env.template .env
   ```

2. Edit `.env` file and update:
   ```env
   ARKASEL_API_KEY=paste-your-actual-api-key-here
   ARKASEL_SENDER_ID=SwapSync
   ```

**Option B: Test Script Only**

Edit `swapsync-backend/test_arkasel_sms.py`:
```python
ARKASEL_API_KEY = "your-actual-api-key"
TEST_PHONE_NUMBER = "233241234567"  # Your phone number
```

---

### **Step 3: Test It!** (1 minute)

```bash
cd swapsync-backend
python test_arkasel_sms.py
```

You should receive a test SMS! 📱

---

## ✅ That's It!

Your SwapSync will now send SMS automatically when:
- ✅ Repair is completed
- ✅ Sale is recorded
- ✅ Swap is completed

---

## 📋 Phone Number Format

**Important**: Use Ghana format!

❌ Wrong: `0241234567`
✅ Correct: `233241234567`

SwapSync auto-converts for you! ✨

---

## 💰 Costs

- **SMS Cost**: ~GH₵0.03 per SMS
- **Starting Balance**: GH₵10-20 (300-600 SMS)
- **Monthly (估): ~GH₵5-15 (typical usage)

---

## 🔧 Troubleshooting

**SMS not sending?**

1. ✅ Check API key is correct
2. ✅ Check account has credits
3. ✅ Phone number in format: `233XXXXXXXXX`
4. ✅ Restart backend after adding `.env`

**Still not working?**

Run the test script:
```bash
python test_arkasel_sms.py
```

Check the error message and follow the troubleshooting tips.

---

## 📚 Full Documentation

For detailed setup, see: **ARKASEL_SMS_SETUP.md**

---

**Need help?** 
- Arkasel Support: support@arkesel.com
- Dashboard: https://sms.arkesel.com

---

**Ready to go! Your SMS service is configured! 🎉**

