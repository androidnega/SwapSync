# Protected Endpoints - Implementation Guide

## 🔒 How to Protect Endpoints

### Option 1: Using Dependency Injection (Recommended)

```python
from app.core.auth import (
    get_current_user,
    get_current_shop_keeper_or_admin,
    get_current_repairer_or_admin,
    get_current_active_admin
)

# Example: Protect swap endpoints for shop keepers
@router.post("/", response_model=SwapResponse)
def create_swap(
    swap: SwapCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_shop_keeper_or_admin)  # ← ADD THIS
):
    # Only shop keepers and admins can access
    pass
```

### Option 2: Manual Role Check

```python
@router.get("/")
def list_swaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SHOP_KEEPER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # ... rest of code
```

---

## 📋 Endpoints to Protect

### 🔵 Shop Keeper + Admin Only:

**Customers:**
- `POST /api/customers/`
- `PUT /api/customers/{id}`
- `DELETE /api/customers/{id}`
- `GET /api/customers/` (list)

**Phones:**
- `POST /api/phones/`
- `PUT /api/phones/{id}`
- `DELETE /api/phones/{id}`
- `GET /api/phones/` (list)

**Swaps:**
- `POST /api/swaps/`
- `GET /api/swaps/`
- `PUT /api/swaps/{id}/resale`
- `GET /api/swaps/pending-resales`
- `GET /api/swaps/sold-resales`
- `GET /api/swaps/profit-summary`

**Sales:**
- `POST /api/sales/`
- `GET /api/sales/`

### 🟢 Repairer + Admin Only:

**Repairs:**
- `POST /api/repairs/`
- `PUT /api/repairs/{id}`
- `PUT /api/repairs/{id}/status`
- `DELETE /api/repairs/{id}`
- `GET /api/repairs/`

### 🔴 Admin Only:

**Analytics:**
- `GET /api/analytics/*` (all analytics endpoints)

**Maintenance:**
- `POST /api/maintenance/backup/create`
- `POST /api/maintenance/backup/restore/{filename}`
- `DELETE /api/maintenance/backup/delete/{filename}`
- `POST /api/maintenance/export/save`
- `POST /api/maintenance/enable`
- `POST /api/maintenance/disable`

**Users:**
- `POST /api/auth/register`
- `GET /api/auth/users`
- `PUT /api/auth/users/{id}`
- `DELETE /api/auth/users/{id}`

### 🟡 Public (No Auth Required):

- `GET /ping`
- `POST /api/auth/login`
- `POST /api/auth/login-json`
- `GET /` (root)

---

## 🛠️ Implementation Steps

### Step 1: Update Swap Routes

```python
# app/api/routes/swap_routes.py
from app.core.auth import get_current_shop_keeper_or_admin

@router.post("/", response_model=SwapResponse)
def create_swap(
    swap: SwapCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_shop_keeper_or_admin)
):
    # ... existing code
```

### Step 2: Update Repair Routes

```python
# app/api/routes/repair_routes.py
from app.core.auth import get_current_repairer_or_admin

@router.post("/", response_model=RepairResponse)
def create_repair(
    repair: RepairCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_repairer_or_admin)
):
    # ... existing code
```

### Step 3: Update Analytics Routes

```python
# app/api/routes/analytics_routes.py
from app.core.auth import get_current_active_admin

@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    # ... existing code
```

---

## ⚙️ Configuration

### Environment Variables (.env):

```env
# Security
SECRET_KEY=your-super-secret-key-change-me
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Admin credentials (optional)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_EMAIL=admin@swapsync.local
```

---

## 🧪 Testing Authentication

### 1. Test Login:
```bash
curl -X POST "http://127.0.0.1:8000/api/auth/login-json" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Use Token:
```bash
TOKEN="your-token-here"

curl -X GET "http://127.0.0.1:8000/api/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Protected Endpoint:
```bash
# Without token (should fail)
curl -X GET "http://127.0.0.1:8000/api/analytics/overview"

# With token (should succeed if admin)
curl -X GET "http://127.0.0.1:8000/api/analytics/overview" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📱 Frontend Integration

### Store Token:
```typescript
// After login
localStorage.setItem('access_token', response.data.access_token);
localStorage.setItem('user', JSON.stringify(response.data.user));
```

### Add to Axios:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Handle 401 Unauthorized:
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 🎯 Current Status

- ✅ User model created
- ✅ JWT authentication implemented
- ✅ Auth endpoints created
- ✅ Role-based helpers ready
- ✅ Default admin created on startup
- ⚠️ Endpoints not yet protected (optional - can be added later)
- 📝 Frontend login page (next step)

---

## 💡 Recommendation

### For v1.0 (Current):
**Keep authentication OPTIONAL:**
- Allow the app to work without login
- Add authentication as an **optional feature**
- Shop owners can choose to enable it

### For v1.1 (Future):
**Make authentication REQUIRED:**
- Force login on startup
- Protect all sensitive endpoints
- Add user management UI
- Add session management

---

## 🔄 Enabling/Disabling Authentication

### Disable Auth (Current Default):
- Don't add `Depends(get_current_user)` to endpoints
- App works without login

### Enable Auth:
- Add authentication dependencies to endpoints
- Frontend shows login page
- Tokens required for all operations

---

**Authentication system is ready but NOT enforced yet.**

This gives you flexibility to:
1. Test the system without login first
2. Enable auth when ready for production
3. Gradually add protection to sensitive endpoints

Next: Frontend login page and role-based sidebar!

