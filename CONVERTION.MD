# 📱 SwapSync PHP/MySQL/Tailwind Implementation Guide

## 🎯 Project Overview

This guide provides a comprehensive roadmap for building a professional phone swapping and repair shop management system using **PHP 8.1+**, **MySQL 8.0+**, and **Tailwind CSS** in a clean **MVC architecture** without `.php` extensions in URLs.

### 🏗️ System Architecture

```
SwapSync PHP System
├── Backend (PHP 8.1+)
│   ├── Framework: Laravel 10+ or Custom MVC
│   ├── Database: MySQL 8.0+
│   ├── Authentication: Laravel Sanctum or Custom JWT
│   └── API: RESTful with JSON responses
├── Frontend (Modern Web)
│   ├── HTML5 + Tailwind CSS
│   ├── Vanilla JavaScript or Alpine.js
│   ├── Progressive Web App (PWA)
│   └── Mobile-responsive design
└── Infrastructure
    ├── Web Server: Nginx/Apache
    ├── SSL/TLS: Let's Encrypt
    ├── Backup: Automated MySQL dumps
    └── Monitoring: Log files + health checks
```

---

## 📋 Core Features & Modules

### 1. 🔐 Authentication & User Management
- **Multi-role System**: Super Admin, Manager, Shop Keeper, Repairer
- **JWT Authentication**: Secure token-based auth
- **Session Management**: Auto-refresh, logout, password reset
- **Company Isolation**: Multi-tenant data separation
- **Audit Trails**: Complete user activity logging

### 2. 📱 Phone Swapping System
- **Swap Transactions**: Customer trade-ins with new phone purchases
- **Resale Management**: Track trade-in phones for resale
- **Profit Tracking**: Calculate profit/loss on swap chains
- **IMEI Tracking**: Unique phone identification and history
- **Invoice Generation**: Professional swap receipts

### 3. 🔧 Repair Management
- **Job Tracking**: Complete repair workflow from booking to delivery
- **Parts Management**: Track repair item usage and costs
- **Customer Notifications**: Automated SMS updates
- **Cost Calculation**: Service fees + parts costs with profit margins
- **Status Updates**: Real-time repair progress tracking

### 4. 🛒 Point of Sale (POS) System
- **Multi-item Sales**: Sell phones, accessories, and repair parts
- **Inventory Integration**: Real-time stock updates
- **Receipt Generation**: Professional invoice printing
- **Transaction History**: Complete sales audit trail
- **Payment Methods**: Cash, mobile money, card support

### 5. 👥 Customer Management
- **Customer Database**: Comprehensive client information
- **Transaction History**: Complete purchase and repair history
- **SMS Integration**: Automated notifications and updates
- **Unique IDs**: Customer identification system (CUST-0001)
- **Contact Management**: Phone, email, address tracking

### 6. 📦 Inventory Management
- **Product Catalog**: Universal product management
- **Stock Tracking**: Real-time inventory levels
- **Low Stock Alerts**: Automated reorder notifications
- **Brand & Category Management**: Organized product hierarchy
- **Barcode Support**: Product scanning capabilities

### 7. 📱 SMS Notifications
- **Multi-provider Support**: Arkasel (primary) + Hubtel (fallback)
- **Company Branding**: Custom sender IDs per company
- **Automated Triggers**: Repair updates, swap confirmations, sale receipts
- **Delivery Tracking**: Repair completion notifications
- **Bulk Messaging**: Customer communication campaigns

### 8. 📊 Business Analytics
- **Profit Reports**: Detailed profit/loss analysis
- **Sales Analytics**: Performance metrics and trends
- **Staff Performance**: Individual and team metrics
- **Inventory Reports**: Stock movement and turnover
- **Dashboard Widgets**: Real-time business insights

---

## 🗄️ Database Schema (MySQL)

### Core Tables Structure

```sql
-- Create database
CREATE DATABASE swapsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE swapsync;

-- Users table (Staff management)
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    profile_picture TEXT,
    company_name VARCHAR(255),
    use_company_sms_branding TINYINT(1) DEFAULT 0,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'manager', 'shop_keeper', 'repairer') DEFAULT 'shop_keeper',
    parent_user_id BIGINT UNSIGNED,
    audit_code VARCHAR(6),
    is_active TINYINT(1) DEFAULT 1,
    must_change_password TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    current_session_id BIGINT UNSIGNED,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Customers table
CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id BIGINT UNSIGNED,
    deletion_code VARCHAR(20),
    code_generated_at TIMESTAMP NULL,
    INDEX idx_phone (phone_number),
    INDEX idx_unique_id (unique_id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Brands table
CREATE TABLE brands (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Categories table
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Phones table (Phone inventory)
CREATE TABLE phones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE,
    imei VARCHAR(50) UNIQUE,
    brand VARCHAR(255) NOT NULL,
    brand_id BIGINT UNSIGNED,
    model VARCHAR(255) NOT NULL,
    category_id BIGINT UNSIGNED,
    condition VARCHAR(100) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    specs JSON,
    status ENUM('AVAILABLE', 'SOLD', 'UNDER_REPAIR') DEFAULT 'AVAILABLE',
    is_available BOOLEAN DEFAULT TRUE,
    is_swappable BOOLEAN DEFAULT TRUE,
    swapped_from_id BIGINT UNSIGNED,
    created_by_user_id BIGINT UNSIGNED,
    current_owner_id BIGINT UNSIGNED,
    current_owner_type VARCHAR(20) DEFAULT 'shop',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_imei (imei),
    INDEX idx_brand (brand),
    INDEX idx_status (status),
    INDEX idx_unique_id (unique_id),
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (current_owner_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Swaps table (Phone swap transactions)
CREATE TABLE swaps (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    given_phone_description TEXT NOT NULL,
    given_phone_value DECIMAL(10,2) NOT NULL,
    given_phone_imei VARCHAR(50),
    new_phone_id BIGINT UNSIGNED NOT NULL,
    balance_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_price DECIMAL(10,2) NOT NULL,
    resale_status ENUM('pending', 'sold', 'swapped_again') DEFAULT 'pending',
    resale_value DECIMAL(10,2) DEFAULT 0.00,
    profit_or_loss DECIMAL(10,2) DEFAULT 0.00,
    linked_to_resale_id BIGINT UNSIGNED,
    invoice_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer (customer_id),
    INDEX idx_new_phone (new_phone_id),
    INDEX idx_resale_status (resale_status),
    INDEX idx_invoice (invoice_number),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (new_phone_id) REFERENCES phones(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_to_resale_id) REFERENCES swaps(id) ON DELETE SET NULL
);

-- Products table (Universal product catalog)
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    category_id BIGINT UNSIGNED NOT NULL,
    brand VARCHAR(255),
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 5,
    description TEXT,
    specs JSON,
    condition VARCHAR(100) DEFAULT 'New',
    imei VARCHAR(50) UNIQUE,
    is_phone BOOLEAN DEFAULT FALSE,
    is_swappable BOOLEAN DEFAULT FALSE,
    phone_condition VARCHAR(100),
    phone_specs JSON,
    phone_status VARCHAR(50) DEFAULT 'AVAILABLE',
    swapped_from_id BIGINT UNSIGNED,
    current_owner_id BIGINT UNSIGNED,
    current_owner_type VARCHAR(20) DEFAULT 'shop',
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    created_by_user_id BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_sku (sku),
    INDEX idx_barcode (barcode),
    INDEX idx_category (category_id),
    INDEX idx_brand (brand),
    INDEX idx_is_phone (is_phone),
    INDEX idx_imei (imei),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (current_owner_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (swapped_from_id) REFERENCES swaps(id) ON DELETE SET NULL
);

-- Repairs table
CREATE TABLE repairs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE,
    customer_id BIGINT UNSIGNED NOT NULL,
    customer_name VARCHAR(255),
    phone_id BIGINT UNSIGNED,
    staff_id BIGINT UNSIGNED,
    created_by_user_id BIGINT UNSIGNED,
    phone_description TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    diagnosis TEXT,
    service_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    items_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cost DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    due_date TIMESTAMP NULL,
    notify_at TIMESTAMP NULL,
    notify_sent BOOLEAN DEFAULT FALSE,
    delivery_notified BOOLEAN DEFAULT FALSE,
    tracking_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer (customer_id),
    INDEX idx_staff (staff_id),
    INDEX idx_status (status),
    INDEX idx_tracking (tracking_code),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- POS Sales table
CREATE TABLE pos_sales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE,
    customer_id BIGINT UNSIGNED,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer (customer_id),
    INDEX idx_created_by (created_by_user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- POS Sale Items table
CREATE TABLE pos_sale_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pos_sale_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    INDEX idx_pos_sale (pos_sale_id),
    INDEX idx_product (product_id),
    FOREIGN KEY (pos_sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- SMS Configuration table
CREATE TABLE sms_configs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    arkasel_api_key_encrypted TEXT,
    arkasel_sender_id VARCHAR(50) DEFAULT 'SwapSync',
    arkasel_enabled BOOLEAN DEFAULT FALSE,
    hubtel_client_id_encrypted TEXT,
    hubtel_client_secret_encrypted TEXT,
    hubtel_sender_id VARCHAR(50) DEFAULT 'SwapSync',
    hubtel_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SMS Logs table
CREATE TABLE sms_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    provider VARCHAR(50),
    message_id VARCHAR(100),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
);

-- Activity Logs table
CREATE TABLE activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id BIGINT UNSIGNED,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_table (table_name),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation Setup (Week 1-2)

#### 1.1 Environment Setup
```bash
# Server Requirements
- PHP 8.1+ with extensions: PDO, JSON, OpenSSL, Tokenizer, XML, Ctype, BCMath
- MySQL 8.0+ or MariaDB 10.4+
- Nginx 1.18+ or Apache 2.4+
- Composer 2.0+
- Node.js 16+ (for asset compilation)

# Project Structure
swapsync-php/
├── app/
│   ├── Controllers/
│   ├── Models/
│   ├── Views/
│   ├── Middleware/
│   ├── Services/
│   └── Helpers/
├── config/
├── database/
│   ├── migrations/
│   └── seeders/
├── public/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── index.php
├── resources/
│   ├── views/
│   └── assets/
├── routes/
├── storage/
└── vendor/
```

#### 1.2 Framework Choice & Setup

**Option A: Laravel 10+ (Recommended)**
```bash
# Create Laravel project
composer create-project laravel/laravel swapsync-php

# Install required packages
composer require laravel/sanctum
composer require guzzlehttp/guzzle
composer require spatie/laravel-permission
composer require barryvdh/laravel-dompdf
composer require intervention/image
composer require pusher/pusher-php-server
```

**Option B: Custom MVC Framework**
```bash
# Create custom MVC structure
mkdir swapsync-php
cd swapsync-php
composer init
composer require vlucas/phpdotenv
composer require firebase/php-jwt
composer require guzzlehttp/guzzle
composer require phpmailer/phpmailer
```

#### 1.3 Database Setup
```bash
# Create database and user
mysql -u root -p
CREATE DATABASE swapsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'swapsync'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON swapsync.* TO 'swapsync'@'localhost';
FLUSH PRIVILEGES;
```

### Phase 2: Core Models & Database (Week 3-4)

#### 2.1 Model Implementation

**User Model (Laravel Example)**
```php
<?php
// app/Models/User.php
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
        'company_name',
        'use_company_sms_branding',
        'password',
        'role',
        'parent_user_id',
        'audit_code',
        'is_active',
        'must_change_password'
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'use_company_sms_branding' => 'boolean',
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
        'last_login' => 'datetime'
    ];

    // Relationships
    public function customers()
    {
        return $this->hasMany(Customer::class, 'created_by_user_id');
    }

    public function phones()
    {
        return $this->hasMany(Phone::class, 'created_by_user_id');
    }

    public function repairs()
    {
        return $this->hasMany(Repair::class, 'staff_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    // Helper methods
    public function isManagerOrAbove()
    {
        return in_array($this->role, ['manager', 'ceo', 'admin', 'super_admin']);
    }

    public function canManageSwaps()
    {
        return in_array($this->role, ['shop_keeper', 'manager', 'ceo', 'admin', 'super_admin']);
    }

    public function canManageRepairs()
    {
        return in_array($this->role, ['repairer', 'shop_keeper', 'manager', 'ceo', 'admin', 'super_admin']);
    }
}
```

**Phone Model**
```php
<?php
// app/Models/Phone.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Phone extends Model
{
    use HasFactory;

    protected $fillable = [
        'unique_id',
        'imei',
        'brand',
        'brand_id',
        'model',
        'category_id',
        'condition',
        'value',
        'cost_price',
        'specs',
        'status',
        'is_available',
        'is_swappable',
        'swapped_from_id',
        'created_by_user_id',
        'current_owner_id',
        'current_owner_type'
    ];

    protected $casts = [
        'specs' => 'array',
        'value' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'is_available' => 'boolean',
        'is_swappable' => 'boolean'
    ];

    // Relationships
    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

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

    public function swaps()
    {
        return $this->hasMany(Swap::class, 'new_phone_id');
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)->where('status', 'AVAILABLE');
    }

    public function scopeSwappable($query)
    {
        return $query->where('is_swappable', true);
    }

    public function scopeByBrand($query, $brand)
    {
        return $query->where('brand', $brand);
    }

    // Helper methods
    public function generateUniqueId()
    {
        $count = self::count() + 1;
        return 'PHON-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    public function getProfitMargin()
    {
        if (!$this->cost_price) return 0;
        return (($this->value - $this->cost_price) / $this->cost_price) * 100;
    }
}
```

#### 2.2 Database Migrations
```php
<?php
// database/migrations/2024_01_01_000001_create_users_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('unique_id', 20)->unique();
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->string('phone_number', 20)->nullable();
            $table->string('full_name');
            $table->string('display_name')->nullable();
            $table->text('profile_picture')->nullable();
            $table->string('company_name')->nullable();
            $table->boolean('use_company_sms_branding')->default(false);
            $table->string('password');
            $table->enum('role', ['super_admin', 'manager', 'shop_keeper', 'repairer'])->default('shop_keeper');
            $table->unsignedBigInteger('parent_user_id')->nullable();
            $table->string('audit_code', 6)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('must_change_password')->default(true);
            $table->timestamp('last_login')->nullable();
            $table->unsignedBigInteger('current_session_id')->nullable();
            $table->timestamps();

            $table->index(['username', 'email', 'role']);
            $table->foreign('parent_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};
```

### Phase 3: Authentication & Security (Week 5-6)

#### 3.1 JWT Authentication Service
```php
<?php
// app/Services/AuthService.php
namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    private $secretKey;
    private $algorithm = 'HS256';
    private $expirationTime = 3600; // 1 hour

    public function __construct()
    {
        $this->secretKey = config('app.jwt_secret');
    }

    public function login(string $username, string $password): array
    {
        $user = User::where('username', $username)
                   ->orWhere('email', $username)
                   ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw new \Exception('Invalid credentials');
        }

        if (!$user->is_active) {
            throw new \Exception('Account is deactivated');
        }

        $token = $this->generateToken($user);
        
        // Update last login
        $user->update(['last_login' => now()]);

        return [
            'user' => $user,
            'token' => $token,
            'expires_in' => $this->expirationTime
        ];
    }

    public function generateToken(User $user): string
    {
        $payload = [
            'iss' => config('app.url'),
            'aud' => config('app.url'),
            'iat' => time(),
            'exp' => time() + $this->expirationTime,
            'sub' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'company_name' => $user->company_name
        ];

        return JWT::encode($payload, $this->secretKey, $this->algorithm);
    }

    public function validateToken(string $token): array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secretKey, $this->algorithm));
            return (array) $decoded;
        } catch (\Exception $e) {
            throw new \Exception('Invalid token');
        }
    }

    public function refreshToken(string $token): string
    {
        $payload = $this->validateToken($token);
        $user = User::find($payload['sub']);
        
        if (!$user || !$user->is_active) {
            throw new \Exception('User not found or inactive');
        }

        return $this->generateToken($user);
    }
}
```

#### 3.2 Authentication Middleware
```php
<?php
// app/Middleware/AuthMiddleware.php
namespace App\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\AuthService;

class AuthMiddleware
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken() ?? $request->header('Authorization');
        
        if (!$token) {
            return response()->json(['error' => 'Token required'], 401);
        }

        // Remove "Bearer " prefix if present
        $token = str_replace('Bearer ', '', $token);

        try {
            $payload = $this->authService->validateToken($token);
            $request->merge(['user_payload' => $payload]);
            return $next($request);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid token'], 401);
        }
    }
}
```

#### 3.3 Role-based Access Control
```php
<?php
// app/Middleware/RoleMiddleware.php
namespace App\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $userPayload = $request->get('user_payload');
        
        if (!$userPayload || !in_array($userPayload['role'], $roles)) {
            return response()->json([
                'error' => 'Access denied. Required roles: ' . implode(', ', $roles)
            ], 403);
        }

        return $next($request);
    }
}
```

### Phase 4: API Controllers (Week 7-8)

#### 4.1 Phone Controller
```php
<?php
// app/Controllers/PhoneController.php
namespace App\Controllers;

use App\Models\Phone;
use App\Models\Brand;
use App\Models\Category;
use App\Services\PhoneService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PhoneController extends Controller
{
    protected $phoneService;

    public function __construct(PhoneService $phoneService)
    {
        $this->phoneService = $phoneService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Phone::with(['brand', 'category', 'createdBy']);
        
        // Apply filters
        if ($request->has('brand')) {
            $query->where('brand', $request->brand);
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('model', 'like', "%{$search}%")
                  ->orWhere('imei', 'like', "%{$search}%");
            });
        }

        $phones = $query->paginate(20);
        
        return response()->json($phones);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'condition' => 'required|string|max:100',
            'value' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'imei' => 'nullable|string|unique:phones,imei',
            'specs' => 'nullable|array'
        ]);

        $phone = $this->phoneService->createPhone($validated, $request->get('user_payload')['sub']);
        
        return response()->json($phone->load(['brand', 'category']), 201);
    }

    public function show(int $id): JsonResponse
    {
        $phone = Phone::with(['brand', 'category', 'createdBy', 'currentOwner'])
                     ->findOrFail($id);
        
        return response()->json($phone);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $phone = Phone::findOrFail($id);
        
        $validated = $request->validate([
            'brand' => 'sometimes|string|max:255',
            'model' => 'sometimes|string|max:255',
            'condition' => 'sometimes|string|max:100',
            'value' => 'sometimes|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'specs' => 'nullable|array'
        ]);

        $phone->update($validated);
        
        return response()->json($phone->load(['brand', 'category']));
    }

    public function destroy(int $id): JsonResponse
    {
        $phone = Phone::findOrFail($id);
        $phone->delete();
        
        return response()->json(['message' => 'Phone deleted successfully']);
    }
}
```

#### 4.2 Swap Controller
```php
<?php
// app/Controllers/SwapController.php
namespace App\Controllers;

use App\Models\Swap;
use App\Models\Customer;
use App\Models\Phone;
use App\Services\SwapService;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SwapController extends Controller
{
    protected $swapService;
    protected $smsService;

    public function __construct(SwapService $swapService, SmsService $smsService)
    {
        $this->swapService = $swapService;
        $this->smsService = $smsService;
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'given_phone_description' => 'required|string',
            'given_phone_value' => 'required|numeric|min:0',
            'given_phone_imei' => 'nullable|string',
            'new_phone_id' => 'required|exists:phones,id',
            'balance_paid' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0'
        ]);

        $userId = $request->get('user_payload')['sub'];
        
        try {
            $swap = $this->swapService->createSwap($validated, $userId);
            
            // Send SMS notification in background
            $this->smsService->sendSwapCompletionSms($swap);
            
            return response()->json($swap->load(['customer', 'newPhone']), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = Swap::with(['customer', 'newPhone']);
        
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        
        if ($request->has('resale_status')) {
            $query->where('resale_status', $request->resale_status);
        }

        $swaps = $query->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json($swaps);
    }

    public function updateResaleStatus(Request $request, int $id): JsonResponse
    {
        $swap = Swap::findOrFail($id);
        
        $validated = $request->validate([
            'resale_status' => 'required|in:pending,sold,swapped_again',
            'resale_value' => 'nullable|numeric|min:0'
        ]);

        $swap = $this->swapService->updateResaleStatus($swap, $validated);
        
        return response()->json($swap);
    }
}
```

### Phase 5: Frontend Implementation (Week 9-12)

#### 5.1 HTML Structure with Tailwind CSS
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SwapSync - Phone Business Management</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#3B82F6',
                        secondary: '#1E40AF',
                        success: '#10B981',
                        warning: '#F59E0B',
                        danger: '#EF4444'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <img class="h-8 w-8" src="/assets/logo.svg" alt="SwapSync">
                    <span class="ml-2 text-xl font-bold text-gray-900">SwapSync</span>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-gray-700" id="user-name">Loading...</span>
                    <button onclick="logout()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="flex">
        <!-- Sidebar -->
        <div class="w-64 bg-white shadow-lg min-h-screen">
            <div class="p-4">
                <ul class="space-y-2">
                    <li>
                        <a href="#dashboard" class="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
                            <i class="fas fa-tachometer-alt mr-3"></i>
                            Dashboard
                        </a>
                    </li>
                    <li>
                        <a href="#phones" class="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
                            <i class="fas fa-mobile-alt mr-3"></i>
                            Phones
                        </a>
                    </li>
                    <li>
                        <a href="#swaps" class="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
                            <i class="fas fa-exchange-alt mr-3"></i>
                            Swaps
                        </a>
                    </li>
                    <li>
                        <a href="#repairs" class="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
                            <i class="fas fa-tools mr-3"></i>
                            Repairs
                        </a>
                    </li>
                    <li>
                        <a href="#customers" class="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
                            <i class="fas fa-users mr-3"></i>
                            Customers
                        </a>
                    </li>
                    <li>
                        <a href="#pos" class="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
                            <i class="fas fa-cash-register mr-3"></i>
                            POS System
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Content Area -->
        <div class="flex-1 p-6">
            <div id="content">
                <!-- Content will be loaded here -->
            </div>
        </div>
    </div>

    <script src="/js/app.js"></script>
</body>
</html>
```

#### 5.2 JavaScript Application Structure
```javascript
// public/js/app.js
class SwapSyncApp {
    constructor() {
        this.apiBase = '/api';
        this.token = localStorage.getItem('auth_token');
        this.currentUser = null;
        this.init();
    }

    async init() {
        if (!this.token) {
            this.showLogin();
            return;
        }

        try {
            await this.loadUser();
            this.setupEventListeners();
            this.loadDashboard();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showLogin();
        }
    }

    async loadUser() {
        const response = await this.apiCall('/auth/me');
        this.currentUser = response.user;
        document.getElementById('user-name').textContent = this.currentUser.full_name;
    }

    async apiCall(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const config = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        const response = await fetch(url, config);
        
        if (response.status === 401) {
            this.logout();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API call failed');
        }

        return await response.json();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href').substring(1);
                this.loadPage(href);
            });
        });
    }

    async loadPage(page) {
        const content = document.getElementById('content');
        
        switch (page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'phones':
                await this.loadPhones();
                break;
            case 'swaps':
                await this.loadSwaps();
                break;
            case 'repairs':
                await this.loadRepairs();
                break;
            case 'customers':
                await this.loadCustomers();
                break;
            case 'pos':
                await this.loadPOS();
                break;
            default:
                content.innerHTML = '<div class="text-center text-gray-500">Page not found</div>';
        }
    }

    async loadDashboard() {
        try {
            const stats = await this.apiCall('/dashboard/stats');
            const content = document.getElementById('content');
            
            content.innerHTML = `
                <div class="mb-6">
                    <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p class="text-gray-600">Welcome back, ${this.currentUser.full_name}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center">
                            <div class="p-2 bg-blue-100 rounded-lg">
                                <i class="fas fa-mobile-alt text-blue-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Total Phones</p>
                                <p class="text-2xl font-bold text-gray-900">${stats.total_phones}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center">
                            <div class="p-2 bg-green-100 rounded-lg">
                                <i class="fas fa-exchange-alt text-green-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Total Swaps</p>
                                <p class="text-2xl font-bold text-gray-900">${stats.total_swaps}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center">
                            <div class="p-2 bg-yellow-100 rounded-lg">
                                <i class="fas fa-tools text-yellow-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Active Repairs</p>
                                <p class="text-2xl font-bold text-gray-900">${stats.active_repairs}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex items-center">
                            <div class="p-2 bg-purple-100 rounded-lg">
                                <i class="fas fa-dollar-sign text-purple-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Total Profit</p>
                                <p class="text-2xl font-bold text-gray-900">₵${stats.total_profit}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-4">Recent Swaps</h3>
                        <div id="recent-swaps">
                            <!-- Recent swaps will be loaded here -->
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-4">Recent Repairs</h3>
                        <div id="recent-repairs">
                            <!-- Recent repairs will be loaded here -->
                        </div>
                    </div>
                </div>
            `;

            // Load recent data
            await this.loadRecentSwaps();
            await this.loadRecentRepairs();
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    }

    async loadPhones() {
        try {
            const phones = await this.apiCall('/phones');
            const content = document.getElementById('content');
            
            content.innerHTML = `
                <div class="mb-6 flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-900">Phone Inventory</h1>
                    <button onclick="app.showAddPhoneModal()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>Add Phone
                    </button>
                </div>

                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <div class="flex space-x-4">
                                <input type="text" id="phone-search" placeholder="Search phones..." 
                                       class="border border-gray-300 rounded-lg px-3 py-2">
                                <select id="brand-filter" class="border border-gray-300 rounded-lg px-3 py-2">
                                    <option value="">All Brands</option>
                                    <option value="Apple">Apple</option>
                                    <option value="Samsung">Samsung</option>
                                    <option value="Tecno">Tecno</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200" id="phones-table-body">
                                ${this.renderPhonesTable(phones.data)}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            this.setupPhoneFilters();
        } catch (error) {
            console.error('Failed to load phones:', error);
        }
    }

    renderPhonesTable(phones) {
        return phones.map(phone => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <i class="fas fa-mobile-alt text-gray-500"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${phone.brand} ${phone.model}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${phone.imei || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${phone.condition}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₵${phone.value}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusColor(phone.status)}">
                        ${phone.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="app.editPhone(${phone.id})" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button onclick="app.deletePhone(${phone.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    getStatusColor(status) {
        switch (status) {
            case 'AVAILABLE':
                return 'bg-green-100 text-green-800';
            case 'SOLD':
                return 'bg-red-100 text-red-800';
            case 'UNDER_REPAIR':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    showLogin() {
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8">
                    <div>
                        <img class="mx-auto h-12 w-auto" src="/assets/logo.svg" alt="SwapSync">
                        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Sign in to SwapSync
                        </h2>
                    </div>
                    <form class="mt-8 space-y-6" onsubmit="app.handleLogin(event)">
                        <div class="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input id="username" name="username" type="text" required 
                                       class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                                       placeholder="Username or Email">
                            </div>
                            <div>
                                <input id="password" name="password" type="password" required 
                                       class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                                       placeholder="Password">
                            </div>
                        </div>

                        <div>
                            <button type="submit" 
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Sign in
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            this.token = data.token;
            localStorage.setItem('auth_token', this.token);
            
            // Reload the app
            location.reload();
        } catch (error) {
            alert('Login failed. Please check your credentials.');
        }
    }

    logout() {
        localStorage.removeItem('auth_token');
        this.token = null;
        this.currentUser = null;
        this.showLogin();
    }
}

// Initialize the app
const app = new SwapSyncApp();

// Global functions for HTML onclick handlers
function logout() {
    app.logout();
}
```

### Phase 6: SMS Integration (Week 13-14)

#### 6.1 SMS Service Implementation
```php
<?php
// app/Services/SmsService.php
namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use App\Models\SmsLog;
use App\Models\SmsConfig;

class SmsService
{
    private $arkaselApiKey;
    private $arkaselSenderId;
    private $hubtelClientId;
    private $hubtelClientSecret;
    private $hubtelSenderId;
    
    public function __construct()
    {
        $config = SmsConfig::first();
        if ($config) {
            $this->arkaselApiKey = $config->arkasel_api_key_encrypted ? decrypt($config->arkasel_api_key_encrypted) : null;
            $this->arkaselSenderId = $config->arkasel_sender_id;
            $this->hubtelClientId = $config->hubtel_client_id_encrypted ? decrypt($config->hubtel_client_id_encrypted) : null;
            $this->hubtelClientSecret = $config->hubtel_client_secret_encrypted ? decrypt($config->hubtel_client_secret_encrypted) : null;
            $this->hubtelSenderId = $config->hubtel_sender_id;
        }
    }
    
    public function sendSms(string $phoneNumber, string $message, string $companyName = 'SwapSync'): array
    {
        $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);
        
        // Try Arkasel first
        if ($this->arkaselApiKey) {
            $result = $this->sendViaArkasel($normalizedPhone, $message, $companyName);
            if ($result['success']) {
                $this->logSms($phoneNumber, $message, 'sent', 'arkasel', $result['message_id']);
                return $result;
            }
        }
        
        // Fallback to Hubtel
        if ($this->hubtelClientId && $this->hubtelClientSecret) {
            $result = $this->sendViaHubtel($normalizedPhone, $message, $companyName);
            if ($result['success']) {
                $this->logSms($phoneNumber, $message, 'sent', 'hubtel', $result['message_id']);
                return $result;
            }
        }
        
        $this->logSms($phoneNumber, $message, 'failed', null, null, 'All SMS providers failed');
        return [
            'success' => false,
            'status' => 'failed',
            'error' => 'All SMS providers failed'
        ];
    }
    
    private function sendViaArkasel(string $phoneNumber, string $message, string $companyName): array
    {
        try {
            $client = new Client();
            $senderId = $companyName !== 'SwapSync' ? $companyName : $this->arkaselSenderId;
            
            $response = $client->post('https://sms.arkesel.com/api/v2/sms/send', [
                'headers' => [
                    'api-key' => $this->arkaselApiKey,
                    'Content-Type' => 'application/json'
                ],
                'json' => [
                    'sender' => $senderId,
                    'recipients' => [$phoneNumber],
                    'message' => $message,
                    'sandbox' => false
                ]
            ]);
            
            if ($response->getStatusCode() === 200) {
                $data = json_decode($response->getBody(), true);
                return [
                    'success' => true,
                    'status' => 'sent',
                    'provider' => 'arkasel',
                    'message_id' => $data['id'] ?? null,
                    'response' => $data
                ];
            }
        } catch (\Exception $e) {
            Log::error('Arkasel SMS failed: ' . $e->getMessage());
        }
        
        return ['success' => false, 'error' => 'Arkasel failed'];
    }
    
    private function sendViaHubtel(string $phoneNumber, string $message, string $companyName): array
    {
        try {
            $client = new Client();
            $senderId = $companyName !== 'SwapSync' ? $companyName : $this->hubtelSenderId;
            
            $response = $client->post('https://api.hubtel.com/v1/messages/send', [
                'auth' => [$this->hubtelClientId, $this->hubtelClientSecret],
                'json' => [
                    'From' => $senderId,
                    'To' => $phoneNumber,
                    'Content' => $message,
                    'RegisteredDelivery' => true
                ]
            ]);
            
            if ($response->getStatusCode() === 200) {
                $data = json_decode($response->getBody(), true);
                return [
                    'success' => true,
                    'status' => 'sent',
                    'provider' => 'hubtel',
                    'message_id' => $data['MessageId'] ?? null,
                    'response' => $data
                ];
            }
        } catch (\Exception $e) {
            Log::error('Hubtel SMS failed: ' . $e->getMessage());
        }
        
        return ['success' => false, 'error' => 'Hubtel failed'];
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
    
    private function logSms(string $phoneNumber, string $message, string $status, ?string $provider, ?string $messageId, ?string $errorMessage = null)
    {
        SmsLog::create([
            'phone_number' => $phoneNumber,
            'message' => $message,
            'status' => $status,
            'provider' => $provider,
            'message_id' => $messageId,
            'error_message' => $errorMessage
        ]);
    }
    
    // Specific SMS templates
    public function sendSwapCompletionSms($swap)
    {
        $message = "Hello {$swap->customer->full_name}, your phone swap is complete! " .
                  "You received: {$swap->newPhone->brand} {$swap->newPhone->model}. " .
                  "Amount paid: ₵{$swap->final_price}. Thank you for choosing us!";
        
        return $this->sendSms($swap->customer->phone_number, $message, $swap->customer->company_name ?? 'SwapSync');
    }
    
    public function sendRepairUpdateSms($repair, $status)
    {
        $message = "Hello {$repair->customer_name}, your repair status has been updated to: {$status}. " .
                  "Repair ID: {$repair->tracking_code}. Contact us for more info.";
        
        return $this->sendSms($repair->customer->phone_number, $message, 'SwapSync');
    }
    
    public function sendRepairCompletionSms($repair)
    {
        $message = "Hello {$repair->customer_name}, your repair is complete and ready for pickup! " .
                  "Repair ID: {$repair->tracking_code}. Total cost: ₵{$repair->cost}. " .
                  "Please visit us to collect your device.";
        
        return $this->sendSms($repair->customer->phone_number, $message, 'SwapSync');
    }
}
```

### Phase 7: URL Rewriting & Clean URLs (Week 15)

#### 7.1 Apache .htaccess Configuration
```apache
# .htaccess file for clean URLs without .php extensions
RewriteEngine On

# Handle Angular and React routes (if using SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/).*$ /index.php [QSA,L]

# API routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ /api/index.php [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</FilesMatch>
```

#### 7.2 Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/swapsync/public;
    index index.php index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle clean URLs
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # API routes
    location /api/ {
        try_files $uri $uri/ /api/index.php?$query_string;
    }

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Static assets caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /(config|storage|vendor)/ {
        deny all;
    }
}
```

#### 7.3 Router Implementation
```php
<?php
// public/index.php
require_once '../vendor/autoload.php';

use App\Core\Router;
use App\Core\Database;
use App\Services\AuthService;

// Initialize database connection
Database::connect();

// Initialize router
$router = new Router();

// API Routes
$router->group('/api', function($router) {
    // Authentication routes
    $router->post('/auth/login', 'AuthController@login');
    $router->post('/auth/logout', 'AuthController@logout');
    $router->get('/auth/me', 'AuthController@me');
    
    // Protected routes
    $router->group('', ['middleware' => 'auth'], function($router) {
        // Phone routes
        $router->get('/phones', 'PhoneController@index');
        $router->post('/phones', 'PhoneController@store');
        $router->get('/phones/{id}', 'PhoneController@show');
        $router->put('/phones/{id}', 'PhoneController@update');
        $router->delete('/phones/{id}', 'PhoneController@destroy');
        
        // Swap routes
        $router->get('/swaps', 'SwapController@index');
        $router->post('/swaps', 'SwapController@store');
        $router->get('/swaps/{id}', 'SwapController@show');
        $router->put('/swaps/{id}/resale', 'SwapController@updateResaleStatus');
        
        // Repair routes
        $router->get('/repairs', 'RepairController@index');
        $router->post('/repairs', 'RepairController@store');
        $router->put('/repairs/{id}', 'RepairController@update');
        $router->post('/repairs/{id}/items', 'RepairController@addItem');
        
        // Customer routes
        $router->get('/customers', 'CustomerController@index');
        $router->post('/customers', 'CustomerController@store');
        $router->get('/customers/{id}', 'CustomerController@show');
        
        // Dashboard routes
        $router->get('/dashboard/stats', 'DashboardController@stats');
        $router->get('/dashboard/repairer-sales', 'DashboardController@repairerSales');
        
        // POS routes
        $router->get('/pos/products', 'POSController@products');
        $router->post('/pos/sales', 'POSController@createSale');
    });
});

// Web routes (for serving the frontend)
$router->get('/', function() {
    include '../resources/views/index.html';
});

$router->get('/{path}', function($path) {
    // Serve static files or return 404
    $file = "../public/{$path}";
    if (file_exists($file) && is_file($file)) {
        return file_get_contents($file);
    }
    http_response_code(404);
    return 'Page not found';
});

// Handle the request
$router->dispatch();
```

### Phase 8: Advanced Features (Week 16-18)

#### 8.1 Real-time Notifications with WebSockets
```php
<?php
// app/Services/WebSocketService.php
namespace App\Services;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

class WebSocketService implements MessageComponentInterface
{
    protected $clients;
    protected $userConnections;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        $this->userConnections = [];
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $data = json_decode($msg, true);
        
        switch ($data['type']) {
            case 'auth':
                $this->authenticateUser($from, $data['token']);
                break;
            case 'subscribe':
                $this->subscribeToChannel($from, $data['channel']);
                break;
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        $this->removeUserConnection($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    public function broadcastToUser($userId, $message)
    {
        if (isset($this->userConnections[$userId])) {
            foreach ($this->userConnections[$userId] as $conn) {
                $conn->send(json_encode($message));
            }
        }
    }

    public function broadcastToChannel($channel, $message)
    {
        foreach ($this->clients as $client) {
            if (isset($client->channels[$channel])) {
                $client->send(json_encode($message));
            }
        }
    }
}

// WebSocket server startup
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new WebSocketService()
        )
    ),
    8080
);

echo "WebSocket server running on port 8080\n";
$server->run();
```

#### 8.2 Background Job Processing
```php
<?php
// app/Services/JobService.php
namespace App\Services;

use App\Models\Job;
use App\Models\SmsLog;

class JobService
{
    public function processSmsQueue()
    {
        $pendingJobs = Job::where('type', 'sms')
                          ->where('status', 'pending')
                          ->orderBy('created_at')
                          ->limit(10)
                          ->get();

        foreach ($pendingJobs as $job) {
            try {
                $this->processSmsJob($job);
                $job->update(['status' => 'completed']);
            } catch (\Exception $e) {
                $job->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage()
                ]);
            }
        }
    }

    private function processSmsJob(Job $job)
    {
        $data = json_decode($job->payload, true);
        $smsService = new SmsService();
        
        $result = $smsService->sendSms(
            $data['phone_number'],
            $data['message'],
            $data['company_name'] ?? 'SwapSync'
        );

        if (!$result['success']) {
            throw new \Exception($result['error'] ?? 'SMS sending failed');
        }
    }

    public function processRepairNotifications()
    {
        $repairs = Repair::where('notify_at', '<=', now())
                         ->where('notify_sent', false)
                         ->get();

        foreach ($repairs as $repair) {
            $this->queueRepairNotification($repair);
            $repair->update(['notify_sent' => true]);
        }
    }

    private function queueRepairNotification($repair)
    {
        Job::create([
            'type' => 'sms',
            'payload' => json_encode([
                'phone_number' => $repair->customer->phone_number,
                'message' => "Your repair {$repair->tracking_code} is ready for pickup!",
                'company_name' => 'SwapSync'
            ]),
            'status' => 'pending'
        ]);
    }
}
```

#### 8.3 Advanced Reporting System
```php
<?php
// app/Services/ReportService.php
namespace App\Services;

use App\Models\Swap;
use App\Models\Repair;
use App\Models\POSSale;
use Carbon\Carbon;

class ReportService
{
    public function generateProfitReport($startDate, $endDate, $userId = null)
    {
        $query = Swap::whereBetween('created_at', [$startDate, $endDate]);
        
        if ($userId) {
            $query->whereHas('newPhone', function($q) use ($userId) {
                $q->where('created_by_user_id', $userId);
            });
        }

        $swaps = $query->get();
        
        $report = [
            'period' => [
                'start' => $startDate,
                'end' => $endDate
            ],
            'summary' => [
                'total_swaps' => $swaps->count(),
                'total_revenue' => $swaps->sum('final_price'),
                'total_profit' => $swaps->sum('profit_or_loss'),
                'average_profit_per_swap' => $swaps->avg('profit_or_loss')
            ],
            'daily_breakdown' => $this->getDailyBreakdown($swaps),
            'brand_performance' => $this->getBrandPerformance($swaps),
            'top_customers' => $this->getTopCustomers($swaps)
        ];

        return $report;
    }

    public function generateInventoryReport()
    {
        $phones = Phone::with(['brand', 'category'])->get();
        
        return [
            'total_phones' => $phones->count(),
            'available_phones' => $phones->where('is_available', true)->count(),
            'sold_phones' => $phones->where('status', 'SOLD')->count(),
            'under_repair' => $phones->where('status', 'UNDER_REPAIR')->count(),
            'brand_distribution' => $phones->groupBy('brand')->map->count(),
            'category_distribution' => $phones->groupBy('category.name')->map->count(),
            'value_breakdown' => [
                'total_value' => $phones->sum('value'),
                'average_value' => $phones->avg('value'),
                'highest_value' => $phones->max('value'),
                'lowest_value' => $phones->min('value')
            ]
        ];
    }

    private function getDailyBreakdown($swaps)
    {
        return $swaps->groupBy(function($swap) {
            return Carbon::parse($swap->created_at)->format('Y-m-d');
        })->map(function($daySwaps) {
            return [
                'count' => $daySwaps->count(),
                'revenue' => $daySwaps->sum('final_price'),
                'profit' => $daySwaps->sum('profit_or_loss')
            ];
        });
    }

    private function getBrandPerformance($swaps)
    {
        return $swaps->groupBy('newPhone.brand')->map(function($brandSwaps) {
            return [
                'count' => $brandSwaps->count(),
                'revenue' => $brandSwaps->sum('final_price'),
                'profit' => $brandSwaps->sum('profit_or_loss'),
                'average_profit' => $brandSwaps->avg('profit_or_loss')
            ];
        });
    }

    private function getTopCustomers($swaps)
    {
        return $swaps->groupBy('customer_id')->map(function($customerSwaps) {
            $customer = $customerSwaps->first()->customer;
            return [
                'customer_name' => $customer->full_name,
                'phone_number' => $customer->phone_number,
                'swap_count' => $customerSwaps->count(),
                'total_spent' => $customerSwaps->sum('final_price'),
                'last_swap' => $customerSwaps->max('created_at')
            ];
        })->sortByDesc('total_spent')->take(10);
    }
}
```

### Phase 9: Testing & Quality Assurance (Week 19-20)

#### 9.1 Unit Testing Setup
```php
<?php
// tests/Unit/PhoneServiceTest.php
namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\PhoneService;
use App\Models\Phone;

class PhoneServiceTest extends TestCase
{
    private $phoneService;

    protected function setUp(): void
    {
        $this->phoneService = new PhoneService();
    }

    public function testCreatePhoneWithValidData()
    {
        $phoneData = [
            'brand' => 'Apple',
            'model' => 'iPhone 14',
            'condition' => 'Good',
            'value' => 2500.00,
            'cost_price' => 2000.00,
            'imei' => '123456789012345'
        ];

        $phone = $this->phoneService->createPhone($phoneData, 1);
        
        $this->assertInstanceOf(Phone::class, $phone);
        $this->assertEquals('Apple', $phone->brand);
        $this->assertEquals('iPhone 14', $phone->model);
        $this->assertEquals(2500.00, $phone->value);
    }

    public function testCreatePhoneWithInvalidData()
    {
        $this->expectException(\InvalidArgumentException::class);
        
        $phoneData = [
            'brand' => '', // Invalid: empty brand
            'model' => 'iPhone 14',
            'condition' => 'Good',
            'value' => 2500.00
        ];

        $this->phoneService->createPhone($phoneData, 1);
    }

    public function testCalculateProfitMargin()
    {
        $phone = new Phone([
            'value' => 2500.00,
            'cost_price' => 2000.00
        ]);

        $margin = $this->phoneService->calculateProfitMargin($phone);
        
        $this->assertEquals(25.0, $margin); // 25% profit margin
    }
}
```

#### 9.2 Integration Testing
```php
<?php
// tests/Integration/SwapControllerTest.php
namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use App\Controllers\SwapController;
use App\Models\Customer;
use App\Models\Phone;
use App\Models\User;

class SwapControllerTest extends TestCase
{
    private $swapController;
    private $testCustomer;
    private $testPhone;
    private $testUser;

    protected function setUp(): void
    {
        $this->swapController = new SwapController();
        
        // Create test data
        $this->testUser = User::create([
            'username' => 'testuser',
            'email' => 'test@example.com',
            'full_name' => 'Test User',
            'password' => bcrypt('password'),
            'role' => 'shop_keeper'
        ]);

        $this->testCustomer = Customer::create([
            'full_name' => 'Test Customer',
            'phone_number' => '0241234567',
            'created_by_user_id' => $this->testUser->id
        ]);

        $this->testPhone = Phone::create([
            'brand' => 'Samsung',
            'model' => 'Galaxy S21',
            'condition' => 'Excellent',
            'value' => 3000.00,
            'is_available' => true,
            'created_by_user_id' => $this->testUser->id
        ]);
    }

    public function testCreateSwapSuccessfully()
    {
        $request = new \stdClass();
        $request->customer_id = $this->testCustomer->id;
        $request->given_phone_description = 'iPhone 12, Good condition';
        $request->given_phone_value = 2000.00;
        $request->new_phone_id = $this->testPhone->id;
        $request->balance_paid = 1000.00;
        $request->discount_amount = 0.00;

        $response = $this->swapController->store($request);
        
        $this->assertEquals(201, $response->getStatusCode());
        
        $data = json_decode($response->getContent(), true);
        $this->assertEquals($this->testCustomer->id, $data['customer_id']);
        $this->assertEquals($this->testPhone->id, $data['new_phone_id']);
    }

    protected function tearDown(): void
    {
        // Clean up test data
        $this->testCustomer->delete();
        $this->testPhone->delete();
        $this->testUser->delete();
    }
}
```

### Phase 10: Deployment & Production Setup (Week 21-22)

#### 10.1 Production Environment Configuration
```bash
# .env.production
APP_NAME="SwapSync"
APP_ENV=production
APP_KEY=base64:your-32-character-secret-key
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=swapsync_production
DB_USERNAME=swapsync_user
DB_PASSWORD=your-secure-password

# SMS Configuration
ARKASEL_API_KEY=your-arkasel-api-key
ARKASEL_SENDER_ID=YourCompany
HUBTEL_CLIENT_ID=your-hubtel-client-id
HUBTEL_CLIENT_SECRET=your-hubtel-client-secret

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=3600

# Cache Configuration
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Queue Configuration
QUEUE_CONNECTION=redis
```

#### 10.2 Deployment Script
```bash
#!/bin/bash
# deploy.sh - Production deployment script

set -e

echo "🚀 Starting SwapSync deployment..."

# Variables
PROJECT_DIR="/var/www/swapsync"
BACKUP_DIR="/var/backups/swapsync"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
mysqldump -u root -p swapsync_production > $BACKUP_DIR/database_$DATE.sql
tar -czf $BACKUP_DIR/files_$DATE.tar.gz $PROJECT_DIR

# Pull latest code
echo "📥 Pulling latest code..."
cd $PROJECT_DIR
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
composer install --optimize-autoloader --no-dev
npm install --production
npm run build

# Run migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# Clear caches
echo "🧹 Clearing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 775 $PROJECT_DIR/storage
chmod -R 775 $PROJECT_DIR/bootstrap/cache

# Restart services
echo "🔄 Restarting services..."
systemctl restart nginx
systemctl restart php8.1-fpm
systemctl restart redis

echo "✅ Deployment completed successfully!"
echo "🌐 Application is now live at: https://your-domain.com"
```

#### 10.3 Monitoring & Logging Setup
```php
<?php
// app/Services/MonitoringService.php
namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Log;

class MonitoringService
{
    public function logSystemHealth()
    {
        $health = [
            'timestamp' => now(),
            'database' => $this->checkDatabaseConnection(),
            'redis' => $this->checkRedisConnection(),
            'disk_space' => $this->checkDiskSpace(),
            'memory_usage' => $this->getMemoryUsage(),
            'active_users' => $this->getActiveUsersCount()
        ];

        Log::info('System Health Check', $health);
        
        return $health;
    }

    private function checkDatabaseConnection()
    {
        try {
            \DB::connection()->getPdo();
            return ['status' => 'healthy', 'response_time' => microtime(true)];
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'error' => $e->getMessage()];
        }
    }

    private function checkRedisConnection()
    {
        try {
            \Redis::ping();
            return ['status' => 'healthy'];
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'error' => $e->getMessage()];
        }
    }

    private function checkDiskSpace()
    {
        $bytes = disk_free_space('/');
        $total = disk_total_space('/');
        
        return [
            'free' => $bytes,
            'total' => $total,
            'percentage_free' => round(($bytes / $total) * 100, 2)
        ];
    }

    private function getMemoryUsage()
    {
        return [
            'current' => memory_get_usage(true),
            'peak' => memory_get_peak_usage(true),
            'limit' => ini_get('memory_limit')
        ];
    }

    private function getActiveUsersCount()
    {
        return User::where('last_login', '>=', now()->subHours(24))->count();
    }

    public function generateDailyReport()
    {
        $report = [
            'date' => now()->format('Y-m-d'),
            'swaps' => Swap::whereDate('created_at', today())->count(),
            'repairs' => Repair::whereDate('created_at', today())->count(),
            'sales' => POSSale::whereDate('created_at', today())->count(),
            'revenue' => POSSale::whereDate('created_at', today())->sum('final_amount'),
            'sms_sent' => SmsLog::whereDate('sent_at', today())->where('status', 'sent')->count(),
            'errors' => Log::where('level', 'error')->whereDate('created_at', today())->count()
        ];

        Log::info('Daily Report', $report);
        return $report;
    }
}
```

### Phase 11: Security & Performance Optimization (Week 23-24)

#### 11.1 Security Middleware
```php
<?php
// app/Middleware/SecurityMiddleware.php
namespace App\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Content-Security-Policy', 
            "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " .
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " .
            "img-src 'self' data: https:; " .
            "font-src 'self' https://cdnjs.cloudflare.com;"
        );

        return $response;
    }
}
```

#### 11.2 Rate Limiting
```php
<?php
// app/Middleware/RateLimitMiddleware.php
namespace App\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RateLimitMiddleware
{
    public function handle(Request $request, Closure $next, $maxAttempts = 60, $decayMinutes = 1)
    {
        $key = $this->resolveRequestSignature($request);
        
        if (Cache::has($key)) {
            $attempts = Cache::get($key);
            if ($attempts >= $maxAttempts) {
                return response()->json([
                    'error' => 'Too many requests. Please try again later.'
                ], 429);
            }
            Cache::put($key, $attempts + 1, $decayMinutes * 60);
        } else {
            Cache::put($key, 1, $decayMinutes * 60);
        }

        return $next($request);
    }

    private function resolveRequestSignature(Request $request)
    {
        return 'rate_limit:' . $request->ip() . ':' . $request->path();
    }
}
```

#### 11.3 Database Optimization
```sql
-- Performance optimization queries
-- Add indexes for better performance
CREATE INDEX idx_phones_brand_model ON phones(brand, model);
CREATE INDEX idx_swaps_customer_date ON swaps(customer_id, created_at);
CREATE INDEX idx_repairs_status_date ON repairs(status, created_at);
CREATE INDEX idx_pos_sales_date ON pos_sales(created_at);
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at);

-- Optimize table storage
OPTIMIZE TABLE users, customers, phones, swaps, repairs, pos_sales, sms_logs;

-- Analyze table statistics
ANALYZE TABLE users, customers, phones, swaps, repairs, pos_sales, sms_logs;
```

---

## 📊 Implementation Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1-2** | Weeks 1-4 | Environment setup, Database schema, Core models |
| **Phase 3-4** | Weeks 5-8 | Authentication system, API controllers |
| **Phase 5** | Weeks 9-12 | Frontend implementation with Tailwind CSS |
| **Phase 6** | Weeks 13-14 | SMS integration and notifications |
| **Phase 7** | Week 15 | URL rewriting and clean URLs |
| **Phase 8** | Weeks 16-18 | Advanced features (WebSockets, Jobs, Reports) |
| **Phase 9** | Weeks 19-20 | Testing and quality assurance |
| **Phase 10** | Weeks 21-22 | Production deployment and monitoring |
| **Phase 11** | Weeks 23-24 | Security hardening and performance optimization |

**Total Development Time: 24 weeks (6 months)**

---

## 🎯 Key Success Metrics

### Performance Targets
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Database Query Time**: < 100ms
- **Uptime**: 99.9%
- **Concurrent Users**: 100+

### Security Standards
- **Authentication**: JWT with refresh tokens
- **Data Encryption**: AES-256 for sensitive data
- **HTTPS**: SSL/TLS encryption
- **Input Validation**: Comprehensive sanitization
- **Rate Limiting**: 60 requests per minute per IP

### Business Features
- **Multi-tenant Support**: Company data isolation
- **Role-based Access**: 4 user roles with granular permissions
- **Real-time Updates**: WebSocket notifications
- **SMS Integration**: Dual provider support
- **Comprehensive Reporting**: Profit/loss analytics

---

## 🚀 Getting Started

### Quick Start Commands
```bash
# 1. Clone and setup
git clone https://github.com/your-org/swapsync-php.git
cd swapsync-php
composer install
npm install

# 2. Environment setup
cp .env.example .env
php artisan key:generate

# 3. Database setup
mysql -u root -p
CREATE DATABASE swapsync;
php artisan migrate
php artisan db:seed

# 4. Start development
php artisan serve
npm run dev
```

### Production Deployment
```bash
# Run deployment script
chmod +x deploy.sh
./deploy.sh
```

---

## 📞 Support & Maintenance

### Documentation
- **API Documentation**: `/api/docs` (Swagger/OpenAPI)
- **User Manual**: `/docs/user-manual.pdf`
- **Admin Guide**: `/docs/admin-guide.pdf`
- **Developer Guide**: `/docs/developer-guide.pdf`

### Monitoring
- **Health Check**: `/health`
- **System Status**: `/status`
- **Performance Metrics**: `/metrics`
- **Error Logs**: `/logs`

### Backup Strategy
- **Database**: Daily automated backups
- **Files**: Weekly file system backups
- **Retention**: 30 days for daily, 12 months for weekly
- **Testing**: Monthly backup restoration tests

---

## 🎉 Conclusion

This comprehensive guide provides everything needed to build a professional phone swapping and repair shop management system using PHP, MySQL, and Tailwind CSS. The system includes:

✅ **Complete MVC Architecture**  
✅ **Clean URLs without .php extensions**  
✅ **Multi-role Authentication System**  
✅ **Comprehensive Business Features**  
✅ **Real-time Notifications**  
✅ **Advanced Reporting**  
✅ **Production-ready Security**  
✅ **Scalable Performance**  

The implementation follows industry best practices and provides a solid foundation for a successful business management system.

**Ready to build your SwapSync system!** 🚀
          