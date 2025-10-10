# Authentication System - Setup Guide

## ✅ Authentication System Implemented

### Components Created:

1. **User Model** (`app/models/user.py`)
   - Username, email, password (hashed)
   - Role: SHOP_KEEPER, REPAIRER, ADMIN
   - Password verification
   - Active/inactive status

2. **Auth Utilities** (`app/core/auth.py`)
   - JWT token creation
   - Token verification
   - User authentication middleware
   - Role-based access control helpers

3. **Auth Endpoints** (`app/api/routes/auth_routes.py`)
   - POST `/api/auth/register` - Register new user
   - POST `/api/auth/login` - Login (OAuth2 form)
   - POST `/api/auth/login-json` - Login (JSON body)
   - GET `/api/auth/me` - Get current user
   - GET `/api/auth/users` - List users (Admin only)
   - PUT `/api/auth/users/{id}` - Update user (Admin only)
   - DELETE `/api/auth/users/{id}` - Delete user (Admin only)
   - POST `/api/auth/change-password` - Change password

---

## 🔐 Default Admin Account

**On first startup, a default admin is created:**

- **Username:** `admin`
- **Password:** `admin123`
- **Role:** ADMIN
- **Email:** admin@swapsync.local

⚠️ **IMPORTANT: Change this password immediately after first login!**

---

## 🎯 Role-Based Access Control

### Roles:

| Role | Access |
|------|--------|
| **SHOP_KEEPER** | Swaps, Phones, Customers, Sales, Pending Resales |
| **REPAIRER** | Repairs only |
| **ADMIN** | Full access to everything + User management |

### Endpoint Protection:

**Public:**
- `/ping` - Health check
- `/api/auth/login` - Login
- `/api/auth/login-json` - Login (JSON)

**Protected (Any authenticated user):**
- `/api/auth/me` - Get current user
- `/api/auth/change-password` - Change password

**Shop Keeper + Admin:**
- `/api/customers/*` - Customer management
- `/api/phones/*` - Phone inventory
- `/api/swaps/*` - Swap transactions
- `/api/sales/*` - Sales
- `/api/swaps/pending-resales` - Pending resales

**Repairer + Admin:**
- `/api/repairs/*` - Repair management

**Admin Only:**
- `/api/analytics/*` - Analytics and reports
- `/api/maintenance/*` - System maintenance
- `/api/auth/users` - User management
- `/api/auth/register` - Register new users

---

## 🔧 How to Use

### 1. Start Backend:
```bash
cd swapsync-backend
.\venv\Scripts\activate
uvicorn main:app --reload
```

### 2. First Login:
```bash
# Visit API docs
http://127.0.0.1:8000/docs

# Or test with curl:
curl -X POST "http://127.0.0.1:8000/api/auth/login-json" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 3. Response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@swapsync.local",
    "full_name": "System Administrator",
    "role": "admin",
    "is_active": 1
  }
}
```

### 4. Use Token:
```bash
# Add to Authorization header
Authorization: Bearer eyJhbGc...
```

---

## 📝 Creating Additional Users

### Create Shop Keeper:
```bash
POST /api/auth/register
{
  "username": "keeper1",
  "email": "keeper@swapsync.local",
  "full_name": "Shop Keeper",
  "password": "keeper123",
  "role": "shop_keeper"
}
```

### Create Repairer:
```bash
POST /api/auth/register
{
  "username": "repairer1",
  "email": "repairer@swapsync.local",
  "full_name": "Phone Repairer",
  "password": "repair123",
  "role": "repairer"
}
```

---

## 🔒 Security Notes

1. **Secret Key:** Change `SECRET_KEY` in `.env` for production
2. **Default Password:** Change admin password immediately
3. **Token Expiry:** Tokens valid for 24 hours
4. **Password Requirements:** Minimum 6 characters
5. **HTTPS:** Use HTTPS in production

---

## 🧪 Testing Authentication

### Test Login:
```python
import requests

# Login
response = requests.post(
    "http://127.0.0.1:8000/api/auth/login-json",
    json={"username": "admin", "password": "admin123"}
)
token = response.json()["access_token"]

# Use token
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    "http://127.0.0.1:8000/api/auth/me",
    headers=headers
)
print(response.json())
```

---

## 🚀 Frontend Integration (Next Step)

Frontend needs to:
1. Show login page on app start
2. Store token in localStorage
3. Add token to all API requests
4. Show role-based sidebar
5. Handle token expiration
6. Logout functionality

---

## 📊 Database Changes

New table created:
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME,
    last_login DATETIME
);
```

---

**Authentication backend is ready!**

Next: Frontend login page and role-based UI

