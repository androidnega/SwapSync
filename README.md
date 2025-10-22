# SwapSync - Professional Phone Swapping & Repair Shop Management System

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [User Roles & Permissions](#user-roles--permissions)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Migration to PHP/MySQL](#migration-to-phpmysql)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Deployment](#deployment)

## 🎯 System Overview

SwapSync is a comprehensive business management system designed specifically for phone swapping and repair shops. It provides end-to-end management of inventory, customer transactions, repairs, staff operations, and business analytics.

### Key Business Functions
- **Phone Swapping**: Complete swap transaction management with profit tracking
- **Repair Services**: Full repair workflow from booking to completion
- **Point of Sale (POS)**: Multi-item sales system for accessories and products
- **Inventory Management**: Phone and product inventory with stock tracking
- **Customer Management**: Complete customer database with transaction history
- **Staff Management**: Role-based access control and user management
- **Business Analytics**: Comprehensive reporting and profit analysis
- **SMS Notifications**: Automated customer notifications via SMS

## 🚀 Core Features

### 1. Phone Swapping System
- **Swap Transactions**: Customer trades old phone + money for new phone
- **Resale Tracking**: Track trade-in phones for resale with profit/loss calculation
- **IMEI Management**: Unique IMEI tracking for all phones
- **Condition Assessment**: Track phone conditions (New, Used, Refurbished)
- **Profit Analytics**: Calculate profit margins and business performance

### 2. Repair Management
- **Repair Booking**: Customer repair requests with detailed issue descriptions
- **Repair Tracking**: Status updates (Pending, In Progress, Completed, Delivered)
- **Repair Items**: Track repair parts and components used
- **Cost Management**: Service costs and parts costs tracking
- **SMS Notifications**: Automated repair status updates to customers
- **Repair Timeline**: Due dates and completion tracking

### 3. Point of Sale (POS) System
- **Multi-Item Sales**: Sell phones, accessories, and other products
- **Category Management**: Organize products by categories (Phones, Earbuds, Chargers, etc.)
- **Brand Management**: Track product brands (Samsung, Apple, Tecno, etc.)
- **Stock Management**: Real-time inventory tracking with low-stock alerts
- **Receipt Generation**: Professional receipts with company branding
- **Transaction History**: Complete sales history and analytics

### 4. Inventory Management
- **Product Catalog**: Comprehensive product database
- **Stock Tracking**: Real-time stock levels with movement history
- **Purchase Management**: Track product purchases and suppliers
- **Price Management**: Cost price, selling price, and discount pricing
- **Barcode Support**: Barcode scanning for quick product identification
- **Stock Alerts**: Low stock notifications and reorder suggestions

### 5. Customer Management
- **Customer Database**: Complete customer information and history
- **Transaction History**: All customer interactions (swaps, sales, repairs)
- **Contact Management**: Phone numbers, emails, and communication preferences
- **Customer Analytics**: Purchase patterns and customer value analysis
- **SMS Integration**: Automated customer notifications

### 6. Staff & User Management
- **Role-Based Access**: Multiple user roles with specific permissions
- **User Authentication**: Secure login with JWT tokens
- **Session Management**: Active session tracking and security
- **Audit Trails**: Complete activity logging for all users
- **Multi-Tenant Support**: Support for multiple business locations

### 7. Business Analytics & Reporting
- **Profit Reports**: Detailed profit/loss analysis
- **Sales Analytics**: Sales trends and performance metrics
- **Inventory Reports**: Stock levels, turnover, and valuation
- **Customer Analytics**: Customer behavior and value analysis
- **Staff Performance**: User activity and performance tracking
- **Financial Reports**: Revenue, expenses, and profitability analysis

### 8. SMS Notification System
- **Multi-Provider Support**: Arkasel (Primary) and Hubtel (Fallback)
- **Company Branding**: Custom sender IDs with company names
- **Automated Notifications**: Repair updates, swap confirmations, sale receipts
- **SMS Logging**: Complete SMS delivery tracking and history
- **Bulk SMS**: Mass messaging capabilities for marketing

### 9. System Administration
- **Database Management**: Complete database administration tools
- **System Maintenance**: Maintenance mode and system health monitoring
- **Backup & Recovery**: Data backup and restoration capabilities
- **System Cleanup**: Automated cleanup of old data and logs
- **Activity Logs**: Comprehensive system activity monitoring

## 🏗️ System Architecture

### Backend (Python/FastAPI)
- **Framework**: FastAPI with SQLAlchemy ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT tokens with role-based access control
- **API**: RESTful API with comprehensive endpoints
- **Real-time**: WebSocket support for live updates
- **Background Tasks**: APScheduler for automated tasks

### Frontend (React/TypeScript)
- **Framework**: React 19 with TypeScript
- **UI Library**: Tailwind CSS with custom components
- **State Management**: React hooks and context
- **Routing**: React Router for navigation
- **Charts**: Recharts for analytics visualization
- **Icons**: FontAwesome for consistent iconography

### Database Schema
- **SQLAlchemy Models**: 25+ database models
- **Relationships**: Complex foreign key relationships
- **Indexes**: Optimized database indexes for performance
- **Migrations**: Automated database migration system
- **Constraints**: Data integrity constraints and validations

## 📊 Database Schema

### Core Tables

#### Users & Authentication
- `users` - User accounts with roles and permissions
- `user_sessions` - Active user sessions
- `otp_sessions` - OTP verification sessions
- `audit_codes` - Manager audit access codes

#### Business Entities
- `customers` - Customer information and contact details
- `brands` - Phone/product brands (Samsung, Apple, etc.)
- `categories` - Product categories (Phones, Accessories, etc.)
- `products` - Universal product catalog
- `phones` - Phone-specific inventory (legacy, being migrated to products)

#### Transactions
- `swaps` - Phone swap transactions with resale tracking
- `sales` - Direct phone sales
- `product_sales` - Product sales (accessories, etc.)
- `pos_sales` - Point of sale transactions
- `pos_sale_items` - Individual items in POS transactions

#### Repair System
- `repairs` - Repair requests and tracking
- `repair_items` - Repair parts and components
- `repair_item_usage` - Track repair item consumption

#### System & Logging
- `activity_logs` - System activity tracking
- `sms_logs` - SMS delivery logs
- `invoices` - Invoice generation and tracking
- `pending_resales` - Trade-in phone resale tracking
- `sms_config` - SMS provider configuration

### Key Relationships
- Users can create customers, products, and transactions
- Customers have multiple transactions (swaps, sales, repairs)
- Products belong to categories and brands
- Swaps track both given and received phones
- Repairs link to customers and assigned staff
- All transactions generate invoices and activity logs

## 👥 User Roles & Permissions

### 1. Super Admin
- **Access**: Complete system access
- **Permissions**: 
  - System database management
  - User management (create managers)
  - System settings and configuration
  - SMS configuration
  - Activity logs and audit trails
  - System maintenance

### 2. Manager/CEO
- **Access**: Business operations and analytics
- **Permissions**:
  - Business reports and analytics
  - Staff management (create shop keepers/repairers)
  - Brand and category management
  - Audit code management
  - POS monitoring
  - Profit reports

### 3. Shop Keeper
- **Access**: Daily business operations
- **Permissions**:
  - Customer management
  - Phone and product management
  - Swap transactions
  - POS system operations
  - Sales management
  - Pending resales

### 4. Repairer
- **Access**: Repair operations only
- **Permissions**:
  - Repair management
  - Customer management (for repairs)
  - Repair item tracking
  - Repair status updates

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/otp/send` - Send OTP for verification
- `POST /api/otp/verify` - Verify OTP

### Customer Management
- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Phone Management
- `GET /api/phones/` - List phones
- `POST /api/phones/` - Add phone
- `PUT /api/phones/{id}` - Update phone
- `DELETE /api/phones/{id}` - Delete phone

### Product Management
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Swap Management
- `GET /api/swaps/` - List swaps
- `POST /api/swaps/` - Create swap
- `PUT /api/swaps/{id}` - Update swap
- `GET /api/swaps/{id}/invoice` - Generate swap invoice

### Repair Management
- `GET /api/repairs/` - List repairs
- `POST /api/repairs/` - Create repair
- `PUT /api/repairs/{id}` - Update repair
- `POST /api/repairs/{id}/complete` - Complete repair

### POS System
- `GET /api/pos/sales/` - List POS sales
- `POST /api/pos/sales/` - Create POS sale
- `GET /api/pos/sales/{id}/receipt` - Generate receipt

### Reports & Analytics
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/profit` - Profit reports
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/reports/inventory` - Inventory reports

### System Administration
- `GET /api/admin/users/` - List users
- `POST /api/admin/users/` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `GET /api/activity-logs/` - Activity logs
- `POST /api/maintenance/toggle` - Toggle maintenance mode

## 🎨 Frontend Components

### Main Pages
- **Dashboard**: Role-based dashboard with key metrics
- **SwappingHub**: Consolidated phone swapping operations
- **ProductsHub**: Product and inventory management
- **POSSystem**: Point of sale interface
- **Repairs**: Repair management interface
- **Customers**: Customer management
- **Reports**: Business analytics and reporting
- **Settings**: System configuration

### Key Components
- **Sidebar**: Navigation with role-based menu items
- **ProtectedRoute**: Route protection based on user roles
- **DataTable**: Reusable data table with sorting/filtering
- **Modal**: Reusable modal dialogs
- **Form**: Form components with validation
- **Charts**: Analytics charts using Recharts
- **Print**: Receipt and invoice printing

### UI Features
- **Responsive Design**: Mobile-friendly interface
- **Dark/Light Theme**: Theme switching capability
- **Real-time Updates**: Live data updates
- **Offline Support**: Offline data storage (planned)
- **Print Support**: Receipt and invoice printing
- **Export**: Data export capabilities

## 🔄 Migration to PHP/MySQL

### Overview
This guide provides a comprehensive approach to migrating SwapSync from Python/FastAPI/SQLite to PHP/MySQL while maintaining all functionality and features.

### 1. Technology Stack Migration

#### Current Stack → Target Stack
- **Backend**: Python/FastAPI → PHP 8.1+/Laravel 10+
- **Database**: SQLite → MySQL 8.0+
- **ORM**: SQLAlchemy → Eloquent ORM
- **Authentication**: JWT → Laravel Sanctum
- **Frontend**: React/TypeScript → Keep React/TypeScript (or migrate to Vue.js/PHP Blade)

### 2. Database Migration

#### MySQL Schema Creation
```sql
-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_id VARCHAR(20) UNIQUE,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    profile_picture TEXT,
    company_name VARCHAR(255),
    use_company_sms_branding TINYINT DEFAULT 0,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'manager', 'ceo', 'shop_keeper', 'repairer', 'admin') DEFAULT 'shop_keeper',
    parent_user_id INT,
    audit_code VARCHAR(6),
    is_active TINYINT DEFAULT 1,
    must_change_password TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    current_session_id INT,
    FOREIGN KEY (parent_user_id) REFERENCES users(id)
);

-- Customers table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_id VARCHAR(20) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INT,
    deletion_code VARCHAR(20),
    code_generated_at TIMESTAMP NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- Brands table
CREATE TABLE brands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table (Universal product catalog)
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_id VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    category_id INT NOT NULL,
    brand VARCHAR(255),
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 5,
    description TEXT,
    specs JSON,
    condition VARCHAR(50) DEFAULT 'New',
    imei VARCHAR(50) UNIQUE,
    is_phone BOOLEAN DEFAULT FALSE,
    is_swappable BOOLEAN DEFAULT FALSE,
    phone_condition VARCHAR(50),
    phone_specs JSON,
    phone_status VARCHAR(50) DEFAULT 'AVAILABLE',
    swapped_from_id INT,
    current_owner_id INT,
    current_owner_type VARCHAR(50) DEFAULT 'shop',
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    created_by_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (swapped_from_id) REFERENCES swaps(id),
    FOREIGN KEY (current_owner_id) REFERENCES customers(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- Swaps table
CREATE TABLE swaps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    given_phone_description TEXT NOT NULL,
    given_phone_value DECIMAL(10,2) NOT NULL,
    given_phone_imei VARCHAR(50),
    new_phone_id INT NOT NULL,
    balance_paid DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_price DECIMAL(10,2) NOT NULL,
    resale_status ENUM('pending', 'sold', 'swapped_again') DEFAULT 'pending',
    resale_value DECIMAL(10,2) DEFAULT 0.00,
    profit_or_loss DECIMAL(10,2) DEFAULT 0.00,
    linked_to_resale_id INT,
    invoice_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (new_phone_id) REFERENCES products(id),
    FOREIGN KEY (linked_to_resale_id) REFERENCES swaps(id)
);

-- Repairs table
CREATE TABLE repairs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_id VARCHAR(20) UNIQUE,
    customer_id INT NOT NULL,
    customer_name VARCHAR(255),
    phone_id INT,
    staff_id INT,
    created_by_user_id INT,
    phone_description VARCHAR(255) NOT NULL,
    issue_description TEXT NOT NULL,
    diagnosis TEXT,
    service_cost DECIMAL(10,2) DEFAULT 0.00,
    items_cost DECIMAL(10,2) DEFAULT 0.00,
    cost DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    due_date TIMESTAMP NULL,
    notify_at TIMESTAMP NULL,
    notify_sent BOOLEAN DEFAULT FALSE,
    delivery_notified BOOLEAN DEFAULT FALSE,
    tracking_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (phone_id) REFERENCES products(id),
    FOREIGN KEY (staff_id) REFERENCES users(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- POS Sales table
CREATE TABLE pos_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_id VARCHAR(20) UNIQUE,
    customer_id INT,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    created_by_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- POS Sale Items table
CREATE TABLE pos_sale_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pos_sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pos_sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Activity Logs table
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- SMS Logs table
CREATE TABLE sms_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    provider VARCHAR(50),
    message_id VARCHAR(100),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS Config table
CREATE TABLE sms_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    arkasel_api_key TEXT,
    arkasel_sender_id VARCHAR(50) DEFAULT 'SwapSync',
    arkasel_enabled BOOLEAN DEFAULT FALSE,
    hubtel_client_id TEXT,
    hubtel_client_secret TEXT,
    hubtel_sender_id VARCHAR(50) DEFAULT 'SwapSync',
    hubtel_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Laravel Backend Implementation

#### Project Structure
```
swapsync-php/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── CustomerController.php
│   │   │   ├── ProductController.php
│   │   │   ├── SwapController.php
│   │   │   ├── RepairController.php
│   │   │   ├── POSController.php
│   │   │   └── ReportController.php
│   │   ├── Middleware/
│   │   │   ├── RoleMiddleware.php
│   │   │   └── AuditMiddleware.php
│   │   └── Requests/
│   │       ├── CustomerRequest.php
│   │       ├── ProductRequest.php
│   │       └── SwapRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Customer.php
│   │   ├── Product.php
│   │   ├── Swap.php
│   │   ├── Repair.php
│   │   └── POSSale.php
│   ├── Services/
│   │   ├── SMSService.php
│   │   ├── ReportService.php
│   │   └── AuditService.php
│   └── Enums/
│       ├── UserRole.php
│       ├── PhoneStatus.php
│       └── ResaleStatus.php
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
└── config/
    └── swapsync.php
```

#### Key Laravel Models

**User Model (app/Models/User.php)**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'unique_id',
        'username',
        'email',
        'phone_number',
        'full_name',
        'display_name',
        'profile_picture',
        'company_name',
        'use_company_sms_branding',
        'password',
        'role',
        'parent_user_id',
        'audit_code',
        'is_active',
        'must_change_password'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'use_company_sms_branding' => 'boolean',
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    public function createdUsers()
    {
        return $this->hasMany(User::class, 'parent_user_id');
    }

    public function isSuperAdmin()
    {
        return in_array($this->role, ['admin', 'super_admin']);
    }

    public function isManager()
    {
        return in_array($this->role, ['manager', 'ceo']);
    }

    public function canCreateRole($targetRole)
    {
        if ($this->isSuperAdmin()) {
            return in_array($targetRole, ['manager', 'ceo']);
        } elseif ($this->isManager()) {
            return in_array($targetRole, ['shop_keeper', 'repairer']);
        }
        return false;
    }
}
```

**Product Model (app/Models/Product.php)**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'unique_id',
        'name',
        'sku',
        'barcode',
        'category_id',
        'brand',
        'cost_price',
        'selling_price',
        'discount_price',
        'quantity',
        'min_stock_level',
        'description',
        'specs',
        'condition',
        'imei',
        'is_phone',
        'is_swappable',
        'phone_condition',
        'phone_specs',
        'phone_status',
        'swapped_from_id',
        'current_owner_id',
        'current_owner_type',
        'is_active',
        'is_available',
        'created_by_user_id'
    ];

    protected $casts = [
        'specs' => 'array',
        'phone_specs' => 'array',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'is_phone' => 'boolean',
        'is_swappable' => 'boolean',
        'is_active' => 'boolean',
        'is_available' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function currentOwner()
    {
        return $this->belongsTo(Customer::class, 'current_owner_id');
    }

    public function getProfitMarginAttribute()
    {
        if ($this->cost_price > 0) {
            return (($this->selling_price - $this->cost_price) / $this->cost_price) * 100;
        }
        return 0;
    }

    public function isLowStock()
    {
        return $this->quantity <= $this->min_stock_level;
    }

    public function reduceStock($quantity = 1)
    {
        if ($this->quantity >= $quantity) {
            $this->quantity -= $quantity;
            if ($this->quantity == 0) {
                $this->is_available = false;
            }
            $this->save();
        } else {
            throw new \Exception("Insufficient stock. Available: {$this->quantity}, Requested: {$quantity}");
        }
    }
}
```

#### API Controllers

**SwapController (app/Http/Controllers/SwapController.php)**
```php
<?php

namespace App\Http\Controllers;

use App\Models\Swap;
use App\Models\Customer;
use App\Models\Product;
use App\Http\Requests\SwapRequest;
use App\Services\SMSService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SwapController extends Controller
{
    protected $smsService;

    public function __construct(SMSService $smsService)
    {
        $this->smsService = $smsService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Swap::with(['customer', 'newPhone']);

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('status')) {
            $query->where('resale_status', $request->status);
        }

        $swaps = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($swaps);
    }

    public function store(SwapRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Create swap
        $swap = Swap::create([
            'customer_id' => $validated['customer_id'],
            'given_phone_description' => $validated['given_phone_description'],
            'given_phone_value' => $validated['given_phone_value'],
            'given_phone_imei' => $validated['given_phone_imei'] ?? null,
            'new_phone_id' => $validated['new_phone_id'],
            'balance_paid' => $validated['balance_paid'] ?? 0,
            'discount_amount' => $validated['discount_amount'] ?? 0,
            'final_price' => $validated['final_price'],
            'invoice_number' => $this->generateInvoiceNumber(),
        ]);

        // Update phone status
        $phone = Product::find($validated['new_phone_id']);
        $phone->markAsSold($validated['customer_id']);

        // Send SMS notification
        $customer = Customer::find($validated['customer_id']);
        $this->smsService->sendSwapNotification(
            $customer->phone_number,
            $customer->full_name,
            auth()->user()->company_name ?? 'SwapSync',
            $validated['given_phone_description'],
            $phone->name,
            $validated['final_price']
        );

        return response()->json($swap->load(['customer', 'newPhone']), 201);
    }

    public function show(Swap $swap): JsonResponse
    {
        return response()->json($swap->load(['customer', 'newPhone']));
    }

    public function update(SwapRequest $request, Swap $swap): JsonResponse
    {
        $validated = $request->validated();
        $swap->update($validated);

        return response()->json($swap->load(['customer', 'newPhone']));
    }

    public function destroy(Swap $swap): JsonResponse
    {
        $swap->delete();
        return response()->json(['message' => 'Swap deleted successfully']);
    }

    private function generateInvoiceNumber(): string
    {
        $count = Swap::count() + 1;
        return 'SWAP-' . str_pad($count, 6, '0', STR_PAD_LEFT);
    }
}
```

#### SMS Service Implementation

**SMSService (app/Services/SMSService.php)**
```php
<?php

namespace App\Services;

use App\Models\SMSLog;
use App\Models\SMSConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SMSService
{
    protected $config;

    public function __construct()
    {
        $this->config = SMSConfig::first();
    }

    public function sendSMS(string $phoneNumber, string $message, string $companyName = 'SwapSync'): array
    {
        $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);

        // Try Arkasel first
        if ($this->config && $this->config->arkasel_enabled) {
            $result = $this->sendViaArkasel($normalizedPhone, $message, $companyName);
            if ($result['success']) {
                return $result;
            }
        }

        // Fallback to Hubtel
        if ($this->config && $this->config->hubtel_enabled) {
            $result = $this->sendViaHubtel($normalizedPhone, $message, $companyName);
            if ($result['success']) {
                return $result;
            }
        }

        return [
            'success' => false,
            'status' => 'failed',
            'error' => 'No SMS providers configured or all failed'
        ];
    }

    private function sendViaArkasel(string $phoneNumber, string $message, string $companyName): array
    {
        try {
            $senderId = $companyName !== 'SwapSync' ? $companyName : $this->config->arkasel_sender_id;

            $response = Http::withHeaders([
                'api-key' => $this->config->arkasel_api_key,
                'Content-Type' => 'application/json'
            ])->post('https://sms.arkesel.com/api/v2/sms/send', [
                'sender' => $senderId,
                'recipients' => [$phoneNumber],
                'message' => $message,
                'sandbox' => false
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $this->logSMS($phoneNumber, $message, 'sent', 'arkasel', $data['id'] ?? null);
                
                return [
                    'success' => true,
                    'status' => 'sent',
                    'provider' => 'arkasel',
                    'message_id' => $data['id'] ?? null
                ];
            }

            $this->logSMS($phoneNumber, $message, 'failed', 'arkasel', null, $response->body());
            return [
                'success' => false,
                'status' => 'failed',
                'provider' => 'arkasel',
                'error' => $response->body()
            ];

        } catch (\Exception $e) {
            $this->logSMS($phoneNumber, $message, 'failed', 'arkasel', null, $e->getMessage());
            return [
                'success' => false,
                'status' => 'failed',
                'provider' => 'arkasel',
                'error' => $e->getMessage()
            ];
        }
    }

    private function sendViaHubtel(string $phoneNumber, string $message, string $companyName): array
    {
        try {
            $senderId = $companyName !== 'SwapSync' ? $companyName : $this->config->hubtel_sender_id;

            $response = Http::withBasicAuth(
                $this->config->hubtel_client_id,
                $this->config->hubtel_client_secret
            )->post('https://api.hubtel.com/v1/messages/send', [
                'From' => $senderId,
                'To' => $phoneNumber,
                'Content' => $message,
                'RegisteredDelivery' => true
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $this->logSMS($phoneNumber, $message, 'sent', 'hubtel', $data['MessageId'] ?? null);
                
                return [
                    'success' => true,
                    'status' => 'sent',
                    'provider' => 'hubtel',
                    'message_id' => $data['MessageId'] ?? null
                ];
            }

            $this->logSMS($phoneNumber, $message, 'failed', 'hubtel', null, $response->body());
            return [
                'success' => false,
                'status' => 'failed',
                'provider' => 'hubtel',
                'error' => $response->body()
            ];

        } catch (\Exception $e) {
            $this->logSMS($phoneNumber, $message, 'failed', 'hubtel', null, $e->getMessage());
            return [
                'success' => false,
                'status' => 'failed',
                'provider' => 'hubtel',
                'error' => $e->getMessage()
            ];
        }
    }

    private function normalizePhoneNumber(string $phoneNumber): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phoneNumber);
        
        if (str_starts_with($phone, '0')) {
            $phone = '233' . substr($phone, 1);
        } elseif (!str_starts_with($phone, '233')) {
            $phone = '233' . $phone;
        }
        
        return $phone;
    }

    private function logSMS(string $phoneNumber, string $message, string $status, string $provider, ?string $messageId, ?string $errorMessage = null): void
    {
        SMSLog::create([
            'phone_number' => $phoneNumber,
            'message' => $message,
            'status' => $status,
            'provider' => $provider,
            'message_id' => $messageId,
            'error_message' => $errorMessage
        ]);
    }

    public function sendRepairCompletionSMS(string $phoneNumber, string $customerName, string $companyName, string $repairDescription, float $cost, ?string $invoiceNumber = null): array
    {
        $message = "Hi {$customerName},\n\n";
        $message .= "Your repair with {$companyName} has been successfully completed!\n\n";
        $message .= "Phone: {$repairDescription}\n";
        $message .= "Cost: GH₵" . number_format($cost, 2) . "\n";
        
        if ($invoiceNumber) {
            $message .= "Invoice: #{$invoiceNumber}\n";
        }
        
        $message .= "\nCollect from {$companyName}.";

        return $this->sendSMS($phoneNumber, $message, $companyName);
    }

    public function sendSwapNotification(string $phoneNumber, string $customerName, string $companyName, string $oldPhone, string $newPhone, ?float $amountPaid = null): array
    {
        $message = "Hi {$customerName},\n\n";
        $message .= "Your phone swap with {$companyName} is complete!\n\n";
        $message .= "Swapped: {$oldPhone}\n";
        $message .= "Received: {$newPhone}\n";
        
        if ($amountPaid) {
            $message .= "Amount Paid: GH₵" . number_format($amountPaid, 2) . "\n";
        }
        
        $message .= "\nThank you for choosing {$companyName}!";

        return $this->sendSMS($phoneNumber, $message, $companyName);
    }
}
```

### 4. API Routes Configuration

**routes/api.php**
```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SwapController;
use App\Http\Controllers\RepairController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ReportController;

// Authentication routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Customer management
    Route::apiResource('customers', CustomerController::class);
    
    // Product management
    Route::apiResource('products', ProductController::class);
    Route::get('products/category/{category}', [ProductController::class, 'byCategory']);
    Route::get('products/brand/{brand}', [ProductController::class, 'byBrand']);
    
    // Swap management
    Route::apiResource('swaps', SwapController::class);
    Route::get('swaps/{swap}/invoice', [SwapController::class, 'generateInvoice']);
    
    // Repair management
    Route::apiResource('repairs', RepairController::class);
    Route::post('repairs/{repair}/complete', [RepairController::class, 'complete']);
    Route::post('repairs/{repair}/update-status', [RepairController::class, 'updateStatus']);
    
    // POS system
    Route::apiResource('pos/sales', POSController::class);
    Route::get('pos/sales/{sale}/receipt', [POSController::class, 'generateReceipt']);
    
    // Reports and analytics
    Route::prefix('reports')->group(function () {
        Route::get('sales', [ReportController::class, 'sales']);
        Route::get('profit', [ReportController::class, 'profit']);
        Route::get('inventory', [ReportController::class, 'inventory']);
        Route::get('customers', [ReportController::class, 'customers']);
    });
    
    // Dashboard analytics
    Route::get('analytics/dashboard', [ReportController::class, 'dashboard']);
    
    // Role-based routes
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::get('admin/users', [UserController::class, 'index']);
        Route::post('admin/users', [UserController::class, 'store']);
        Route::put('admin/users/{user}', [UserController::class, 'update']);
        Route::delete('admin/users/{user}', [UserController::class, 'destroy']);
    });
    
    Route::middleware('role:manager,ceo')->group(function () {
        Route::get('reports/profit', [ReportController::class, 'profit']);
        Route::get('pos/monitor', [POSController::class, 'monitor']);
    });
});
```

### 5. Middleware Implementation

**RoleMiddleware (app/Http/Middleware/RoleMiddleware.php)**
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $userRole = auth()->user()->role;
        
        if (!in_array($userRole, $roles)) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        return $next($request);
    }
}
```

### 6. Data Migration Script

**Migration Script (database/migrations/2024_01_01_000000_migrate_from_python.php)**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class MigrateFromPython extends Migration
{
    public function up()
    {
        // This migration would handle data import from the Python system
        // You would need to export data from SQLite and import to MySQL
        
        // Example: Import customers
        $this->importCustomers();
        
        // Example: Import products
        $this->importProducts();
        
        // Example: Import swaps
        $this->importSwaps();
    }

    private function importCustomers()
    {
        // Read from exported CSV or JSON file
        $customers = json_decode(file_get_contents(storage_path('migration/customers.json')), true);
        
        foreach ($customers as $customer) {
            DB::table('customers')->insert([
                'unique_id' => $customer['unique_id'],
                'full_name' => $customer['full_name'],
                'phone_number' => $customer['phone_number'],
                'email' => $customer['email'],
                'created_at' => $customer['created_at'],
                'created_by_user_id' => $customer['created_by_user_id'],
            ]);
        }
    }

    private function importProducts()
    {
        $products = json_decode(file_get_contents(storage_path('migration/products.json')), true);
        
        foreach ($products as $product) {
            DB::table('products')->insert([
                'unique_id' => $product['unique_id'],
                'name' => $product['name'],
                'sku' => $product['sku'],
                'category_id' => $product['category_id'],
                'brand' => $product['brand'],
                'cost_price' => $product['cost_price'],
                'selling_price' => $product['selling_price'],
                'quantity' => $product['quantity'],
                'is_phone' => $product['is_phone'],
                'is_swappable' => $product['is_swappable'],
                'created_at' => $product['created_at'],
            ]);
        }
    }

    private function importSwaps()
    {
        $swaps = json_decode(file_get_contents(storage_path('migration/swaps.json')), true);
        
        foreach ($swaps as $swap) {
            DB::table('swaps')->insert([
                'customer_id' => $swap['customer_id'],
                'given_phone_description' => $swap['given_phone_description'],
                'given_phone_value' => $swap['given_phone_value'],
                'new_phone_id' => $swap['new_phone_id'],
                'balance_paid' => $swap['balance_paid'],
                'final_price' => $swap['final_price'],
                'resale_status' => $swap['resale_status'],
                'created_at' => $swap['created_at'],
            ]);
        }
    }

    public function down()
    {
        // Rollback migration if needed
        DB::table('swaps')->truncate();
        DB::table('products')->truncate();
        DB::table('customers')->truncate();
    }
}
```

### 7. Frontend Integration

The React frontend can remain largely unchanged, but you'll need to update the API endpoints and authentication:

**API Service Update (frontend/src/services/api.js)**
```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const customerAPI = {
  getAll: () => api.get('/customers'),
  create: (customer) => api.post('/customers', customer),
  update: (id, customer) => api.put(`/customers/${id}`, customer),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const productAPI = {
  getAll: () => api.get('/products'),
  create: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products/${id}`, product),
  delete: (id) => api.delete(`/products/${id}`),
  byCategory: (category) => api.get(`/products/category/${category}`),
  byBrand: (brand) => api.get(`/products/brand/${brand}`),
};

export const swapAPI = {
  getAll: () => api.get('/swaps'),
  create: (swap) => api.post('/swaps', swap),
  update: (id, swap) => api.put(`/swaps/${id}`, swap),
  delete: (id) => api.delete(`/swaps/${id}`),
  generateInvoice: (id) => api.get(`/swaps/${id}/invoice`),
};

export const repairAPI = {
  getAll: () => api.get('/repairs'),
  create: (repair) => api.post('/repairs', repair),
  update: (id, repair) => api.put(`/repairs/${id}`, repair),
  delete: (id) => api.delete(`/repairs/${id}`),
  complete: (id) => api.post(`/repairs/${id}/complete`),
  updateStatus: (id, status) => api.post(`/repairs/${id}/update-status`, { status }),
};

export const posAPI = {
  getAll: () => api.get('/pos/sales'),
  create: (sale) => api.post('/pos/sales', sale),
  generateReceipt: (id) => api.get(`/pos/sales/${id}/receipt`),
};

export const reportAPI = {
  sales: (params) => api.get('/reports/sales', { params }),
  profit: (params) => api.get('/reports/profit', { params }),
  inventory: (params) => api.get('/reports/inventory', { params }),
  customers: (params) => api.get('/reports/customers', { params }),
  dashboard: () => api.get('/analytics/dashboard'),
};

export default api;
```

### 8. Deployment Configuration

**Docker Configuration (docker-compose.yml)**
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
      - DB_CONNECTION=mysql
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_DATABASE=swapsync
      - DB_USERNAME=swapsync
      - DB_PASSWORD=your_password
    depends_on:
      - mysql
    volumes:
      - ./storage:/var/www/html/storage
      - ./bootstrap/cache:/var/www/html/bootstrap/cache

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=swapsync
      - MYSQL_USER=swapsync
      - MYSQL_PASSWORD=your_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  mysql_data:
```

**Dockerfile**
```dockerfile
FROM php:8.1-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy existing application directory contents
COPY . /var/www/html

# Copy existing application directory permissions
COPY --chown=www-data:www-data . /var/www/html

# Install dependencies
RUN composer install --no-dev --optimize-autoloader
RUN npm install && npm run build

# Change current user to www
USER www-data

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]
```

### 9. Migration Checklist

#### Pre-Migration
- [ ] Export all data from Python system (SQLite)
- [ ] Create MySQL database and user
- [ ] Set up Laravel project structure
- [ ] Configure environment variables
- [ ] Set up SMS provider credentials

#### Database Migration
- [ ] Create MySQL schema using migrations
- [ ] Import customer data
- [ ] Import product data
- [ ] Import user data
- [ ] Import transaction data (swaps, sales, repairs)
- [ ] Import system configuration
- [ ] Verify data integrity

#### Backend Migration
- [ ] Implement Laravel models
- [ ] Create API controllers
- [ ] Implement authentication system
- [ ] Set up SMS service
- [ ] Configure middleware
- [ ] Test all API endpoints

#### Frontend Updates
- [ ] Update API service URLs
- [ ] Update authentication flow
- [ ] Test all frontend functionality
- [ ] Update environment configuration

#### Testing & Deployment
- [ ] Run comprehensive tests
- [ ] Set up production environment
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Create backup procedures
- [ ] Train users on new system

### 10. Performance Optimization

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_imei ON products(imei);
CREATE INDEX idx_swaps_customer ON swaps(customer_id);
CREATE INDEX idx_swaps_created_at ON swaps(created_at);
CREATE INDEX idx_repairs_customer ON repairs(customer_id);
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
```

#### Laravel Optimization
```php
// config/database.php - MySQL optimization
'mysql' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE', 'swapsync'),
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => true,
    'engine' => 'InnoDB',
    'options' => [
        PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
    ],
],
```

#### Caching Strategy
```php
// Use Redis for caching
'cache' => [
    'default' => env('CACHE_DRIVER', 'redis'),
    'stores' => [
        'redis' => [
            'driver' => 'redis',
            'connection' => 'cache',
        ],
    ],
],
```

### 11. Security Considerations

#### Authentication Security
- Use Laravel Sanctum for API authentication
- Implement proper password hashing
- Set up session management
- Configure CORS properly

#### Data Security
- Use database transactions for critical operations
- Implement proper input validation
- Set up audit logging
- Configure backup encryption

#### API Security
- Rate limiting for API endpoints
- Input sanitization
- SQL injection prevention
- XSS protection

## 🚀 Installation & Setup

### Prerequisites
- PHP 8.1 or higher
- MySQL 8.0 or higher
- Composer
- Node.js and npm
- Web server (Apache/Nginx)

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/your-org/swapsync-php.git
cd swapsync-php
```

2. **Install PHP dependencies**
```bash
composer install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
npm run build
cd ..
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database and SMS credentials
```

5. **Generate application key**
```bash
php artisan key:generate
```

6. **Run database migrations**
```bash
php artisan migrate
```

7. **Seed initial data**
```bash
php artisan db:seed
```

8. **Set up storage permissions**
```bash
chmod -R 775 storage bootstrap/cache
```

9. **Start the application**
```bash
php artisan serve
```

## ⚙️ Configuration

### Environment Variables
```env
APP_NAME=SwapSync
APP_ENV=production
APP_KEY=base64:your-app-key
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=swapsync
DB_USERNAME=swapsync
DB_PASSWORD=your_password

# SMS Configuration
ARKASEL_API_KEY=your_arkasel_api_key
ARKASEL_SENDER_ID=SwapSync
ARKASEL_ENABLED=true

HUBTEL_CLIENT_ID=your_hubtel_client_id
HUBTEL_CLIENT_SECRET=your_hubtel_client_secret
HUBTEL_SENDER_ID=SwapSync
HUBTEL_ENABLED=true

# Cache Configuration
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Session Configuration
SESSION_DRIVER=redis
SESSION_LIFETIME=120
```

### SMS Provider Setup

#### Arkasel Setup
1. Register at [Arkasel](https://arkesel.com)
2. Get your API key
3. Configure sender ID
4. Add credentials to environment

#### Hubtel Setup
1. Register at [Hubtel](https://hubtel.com)
2. Get client ID and secret
3. Configure sender ID
4. Add credentials to environment

## 🚀 Deployment

### Production Deployment

1. **Server Requirements**
   - Ubuntu 20.04+ or CentOS 8+
   - PHP 8.1+ with extensions
   - MySQL 8.0+
   - Nginx or Apache
   - SSL certificate

2. **Deployment Steps**
```bash
# Clone repository
git clone https://github.com/your-org/swapsync-php.git
cd swapsync-php

# Install dependencies
composer install --no-dev --optimize-autoloader

# Build frontend
cd frontend && npm install && npm run build && cd ..

# Configure environment
cp .env.example .env
# Edit .env with production values

# Generate key and run migrations
php artisan key:generate
php artisan migrate --force

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Configure web server
# Copy nginx.conf or apache configuration
```

3. **Nginx Configuration**
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name your-domain.com;
    root /var/www/swapsync-php/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Docker Deployment

1. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

2. **Run migrations**
```bash
docker-compose exec app php artisan migrate
```

3. **Seed data**
```bash
docker-compose exec app php artisan db:seed
```

## 📊 Monitoring & Maintenance

### Log