# SwapSync - Phone Shop Management System

A comprehensive phone shop management system for tracking inventory, repairs, swaps, sales, and customer information.

## 🚀 Features

- **Inventory Management**: Track phones, accessories, and products with categories and brands
- **Repair Management**: Complete repair workflow with timeline tracking and SMS notifications
- **Swap System**: Handle phone trade-ins and swaps with pricing calculations
- **Sales Management**: Point-of-sale system with receipt generation
- **Customer Management**: Track customer information and transaction history
- **User Management**: Multi-user system with role-based permissions (Admin, Manager, Staff, Repairer)
- **Analytics & Reports**: Comprehensive reporting and profit tracking
- **SMS Notifications**: Automated SMS notifications for repairs and sales
- **Audit System**: Track all operations with audit codes
- **Invoice Generation**: Professional PDF invoices and receipts

## 📦 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Database**: SQLite (production ready)
- **Authentication**: JWT tokens with bcrypt password hashing
- **ORM**: SQLAlchemy
- **PDF Generation**: ReportLab
- **SMS**: Arkassel/Hubtel integration
- **WebSocket**: Real-time updates

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Hooks
- **Routing**: React Router
- **Icons**: Lucide React

## 🔧 Local Development Setup

### Prerequisites
- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from template:
```bash
cp env.template .env
```

5. Update `.env` with your configuration (see Configuration section below)

6. Run the backend:
```bash
python main.py
```

Backend will run at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run at `http://localhost:5173`

## 🌐 Production Deployment (cPanel)

Complete deployment guide available in [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md)

### Quick Deployment Steps:

1. **Clone repository on your cPanel**:
   - Use cPanel Git Version Control
   - Clone URL: `https://github.com/androidnega/SwapSync.git`

2. **Build Frontend**:
```bash
cd frontend
npm install
npm run build
```

3. **Setup Python Application**:
   - Use cPanel "Setup Python App"
   - Application Root: `your-domain/backend`
   - Startup File: `passenger_wsgi.py`
   - Python Version: 3.9+

4. **Install Backend Dependencies**:
```bash
cd backend
source /path/to/virtualenv/bin/activate
pip install -r requirements.txt
```

5. **Configure Environment**:
   - Copy `backend/env.template` to `backend/.env`
   - Update SECRET_KEY, CORS_ORIGINS, and other settings

6. **Deploy Frontend**:
   - Copy `frontend/dist/*` to your public directory
   - Update API base URL in frontend config

See [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env` file with these settings:

```env
# JWT Secret (generate with: openssl rand -hex 32)
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=sqlite:///./swapsync.db

# CORS (update with your domains)
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Default Admin User
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=change-this-password

# SMS Configuration (optional)
ARKASEL_API_KEY=your-api-key
ARKASEL_SENDER_ID=SwapSync

# Environment
ENVIRONMENT=development
DEBUG=True
PORT=8000
```

### Frontend Configuration

Update API base URL in `frontend/src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://yourdomain.com/api' 
  : 'http://localhost:8000';
```

## 👥 Default User Roles

1. **Admin**: Full system access, user management
2. **Manager**: Business operations, reports, sales management
3. **Staff**: Customer service, sales, repairs
4. **Repairer**: Repair management only

## 📱 SMS Integration

SwapSync supports SMS notifications via:
- **Arkassel SMS** (Primary)
- **Hubtel SMS** (Fallback)

Configure in `backend/.env` or via Admin Settings panel.

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Audit code system for sensitive operations
- Session management
- CORS protection
- SQL injection protection via ORM

## 📊 Database Migrations

Database migrations are handled automatically on startup. Manual migrations available in `backend/migrate_*.py` files.

## 🧪 API Documentation

Once the backend is running, access interactive API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 📝 License

See [LICENSE.txt](frontend/public/LICENSE.txt) for license information.

## 🆘 Support

For deployment issues or questions:
1. Check [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md)
2. Review API documentation at `/docs`
3. Check application logs

## 🔄 Updates

To update your deployment:

```bash
# Pull latest changes
git pull origin main

# Update backend dependencies
cd backend
pip install -r requirements.txt --upgrade

# Rebuild frontend
cd ../frontend
npm install
npm run build

# Restart Python application in cPanel
```

## 📈 Version

Current Version: 1.0.0

---

**Built with ❤️ for phone shop management**

