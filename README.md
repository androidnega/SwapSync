# SwapSync - Professional Phone Swapping & Repair Shop Management System

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/manuelcode/swapsync)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-19.1.1-blue.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/fastapi-0.104.1-green.svg)](https://fastapi.tiangolo.com)

## 📱 Overview

SwapSync is a comprehensive business management system designed specifically for phone swapping and repair shops. It provides a complete solution for managing inventory, customer transactions, repairs, staff, and business analytics with real-time SMS notifications and multi-role access control.

### 🎯 Key Features

- **Phone Swapping Management** - Complete swap transaction tracking with profit/loss calculations
- **Repair Service Management** - Track repair jobs, parts usage, and customer notifications
- **Point of Sale (POS) System** - Multi-item sales with inventory management
- **Customer Management** - Comprehensive customer database with transaction history
- **Inventory Management** - Track phones, accessories, and repair parts
- **Staff Management** - Role-based access control with audit trails
- **SMS Notifications** - Automated customer notifications via Arkasel/Hubtel
- **Business Analytics** - Profit reports, sales analytics, and performance metrics
- **Multi-tenant Support** - Company isolation with branded SMS
- **Real-time Dashboard** - Live updates and WebSocket support

## 🏗️ System Architecture

### Backend (Python/FastAPI)
- **Framework**: FastAPI 0.104.1
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT with role-based access control
- **SMS Integration**: Arkasel (primary) + Hubtel (fallback)
- **Background Tasks**: APScheduler for automated notifications
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

### Frontend (React/TypeScript)
- **Framework**: React 19.1.1 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Hooks
- **Charts**: Recharts for analytics
- **Icons**: FontAwesome
- **Build Tool**: Vite

### Database Schema

#### Core Models
- **Users** - Staff authentication and role management
- **Customers** - Client information and transaction history
- **Phones** - Phone inventory with specifications
- **Products** - Universal product catalog (phones, accessories, parts)
- **Swaps** - Phone swap transactions with resale tracking
- **Sales** - Direct phone sales
- **Repairs** - Repair job management
- **Categories** - Product categorization
- **Brands** - Phone brand management

#### Supporting Models
- **POSSales** - Point of sale transactions
- **RepairItems** - Repair parts inventory
- **SMSLogs** - SMS notification tracking
- **ActivityLogs** - System audit trail
- **Invoices** - Transaction invoicing
- **UserSessions** - Session management

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/manuelcode/swapsync.git
cd swapsync/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Unix/MacOS
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run the server**
```bash
python main.py
```

The API will be available at: http://127.0.0.1:8000
API Documentation: http://127.0.0.1:8000/docs

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

## 👥 User Roles & Permissions

### Super Admin
- System-wide access and configuration
- User management and role assignment
- Database management and maintenance
- SMS configuration and broadcasting

### Manager/CEO
- Business analytics and reports
- Staff management
- Brand and category management
- Audit code generation
- POS transaction monitoring

### Shop Keeper
- Customer management
- Phone and product sales
- Swap transactions
- POS system operations
- Inventory management

### Repairer
- Repair job management
- Customer notifications
- Repair parts tracking
- Repair status updates

## 📊 Core Features

### 1. Phone Swapping System
- **Swap Transactions**: Track customer trade-ins with new phone purchases
- **Resale Management**: Monitor trade-in phones for resale opportunities
- **Profit Tracking**: Calculate profit/loss on swap chains
- **IMEI Tracking**: Unique phone identification and history

### 2. Repair Management
- **Job Tracking**: Complete repair workflow from booking to delivery
- **Parts Management**: Track repair item usage and costs
- **Customer Notifications**: Automated SMS updates on repair status
- **Cost Calculation**: Service fees + parts costs with profit margins

### 3. Point of Sale (POS)
- **Multi-item Sales**: Sell phones, accessories, and repair parts
- **Inventory Integration**: Real-time stock updates
- **Receipt Generation**: Professional invoice printing
- **Transaction History**: Complete sales audit trail

### 4. Customer Management
- **Customer Database**: Comprehensive client information
- **Transaction History**: Complete purchase and repair history
- **SMS Integration**: Automated notifications and updates
- **Unique IDs**: Customer identification system (CUST-0001)

### 5. Inventory Management
- **Product Catalog**: Universal product management
- **Stock Tracking**: Real-time inventory levels
- **Low Stock Alerts**: Automated reorder notifications
- **Brand & Category Management**: Organized product hierarchy

### 6. SMS Notifications
- **Multi-provider Support**: Arkasel (primary) + Hubtel (fallback)
- **Company Branding**: Custom sender IDs per company
- **Automated Triggers**: Repair updates, swap confirmations, sale receipts
- **Delivery Tracking**: Repair completion notifications

### 7. Business Analytics
- **Profit Reports**: Detailed profit/loss analysis
- **Sales Analytics**: Performance metrics and trends
- **Staff Performance**: Individual and team metrics
- **Inventory Reports**: Stock movement and turnover

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=sqlite:///./swapsync.db  # or PostgreSQL URL

# Security
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# SMS Configuration (Optional)
ARKASEL_API_KEY=your-arkasel-api-key
ARKASEL_SENDER_ID=YourCompany
HUBTEL_CLIENT_ID=your-hubtel-client-id
HUBTEL_CLIENT_SECRET=your-hubtel-client-secret
```

### SMS Setup
1. **Arkasel (Recommended)**
   - Register at https://arkesel.com
   - Get API key and configure sender ID
   - Set `ARKASEL_API_KEY` environment variable

2. **Hubtel (Fallback)**
   - Register at https://hubtel.com
   - Get client credentials
   - Set `HUBTEL_CLIENT_ID` and `HUBTEL_CLIENT_SECRET`

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Core Operations
- `GET /api/phones/` - List phones
- `POST /api/phones/` - Add new phone
- `GET /api/swaps/` - List swap transactions
- `POST /api/swaps/` - Create swap transaction
- `GET /api/repairs/` - List repair jobs
- `POST /api/repairs/` - Create repair job

### Management
- `GET /api/customers/` - List customers
- `GET /api/reports/` - Business reports
- `GET /api/analytics/` - Performance analytics
- `POST /api/sms/send` - Send SMS notification

## 🗄️ Database Schema

### Key Tables

#### users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    role VARCHAR NOT NULL, -- super_admin, manager, shop_keeper, repairer
    company_name VARCHAR,
    use_company_sms_branding INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### customers
```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE,
    full_name VARCHAR NOT NULL,
    phone_number VARCHAR UNIQUE NOT NULL,
    email VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### phones
```sql
CREATE TABLE phones (
    id INTEGER PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE,
    imei VARCHAR UNIQUE,
    brand VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    condition VARCHAR NOT NULL,
    value DECIMAL NOT NULL,
    cost_price DECIMAL,
    specs JSON,
    status VARCHAR DEFAULT 'AVAILABLE',
    is_swappable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### swaps
```sql
CREATE TABLE swaps (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    given_phone_description VARCHAR NOT NULL,
    given_phone_value DECIMAL NOT NULL,
    new_phone_id INTEGER REFERENCES phones(id),
    balance_paid DECIMAL NOT NULL,
    final_price DECIMAL NOT NULL,
    resale_status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Migration to PHP/MySQL

### Overview
This guide provides a comprehensive roadmap for migrating SwapSync from Python/FastAPI/SQLite to PHP/MySQL while maintaining all functionality and features.

### 1. Technology Stack Migration

#### Current Stack → Target Stack
- **Backend**: Python/FastAPI → PHP 8.1+/Laravel 10+ or Symfony 6+
- **Database**: SQLite → MySQL 8.0+
- **Frontend**: React/TypeScript → Keep React or migrate to Vue.js/Angular
- **Authentication**: JWT → Laravel Sanctum or Symfony Security
- **SMS**: Python requests → Guzzle HTTP or cURL

### 2. Database Migration

#### MySQL Schema Creation
```sql
-- Create database
CREATE DATABASE swapsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE swapsync;

-- Users table
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

-- Phones table
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

-- Swaps table
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

### 3. PHP Framework Setup

#### Option A: Laravel 10+ (Recommended)
```bash
# Create new Laravel project
composer create-project laravel/laravel swapsync-php

# Install required packages
composer require laravel/sanctum
composer require guzzlehttp/guzzle
composer require spatie/laravel-permission
composer require barryvdh/laravel-dompdf
```

#### Option B: Symfony 6+
```bash
# Create new Symfony project
composer create-project symfony/skeleton swapsync-php

# Install required packages
composer require symfony/security-bundle
composer require symfony/orm-pack
composer require symfony/maker-bundle
composer require guzzlehttp/guzzle
```

### 4. Data Migration Script

#### Python to MySQL Data Export
```python
# export_data.py
import sqlite3
import json
import csv
from datetime import datetime

def export_to_mysql_format():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    # Export users
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    
    with open('users_export.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'unique_id', 'username', 'email', 'phone_number', 
                        'full_name', 'display_name', 'company_name', 
                        'use_company_sms_branding', 'role', 'parent_user_id', 
                        'audit_code', 'is_active', 'created_at'])
        for user in users:
            writer.writerow(user)
    
    # Export customers
    cursor.execute("SELECT * FROM customers")
    customers = cursor.fetchall()
    
    with open('customers_export.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'unique_id', 'full_name', 'phone_number', 
                        'email', 'created_at', 'created_by_user_id'])
        for customer in customers:
            writer.writerow(customer)
    
    # Continue for all tables...
    conn.close()

if __name__ == "__main__":
    export_to_mysql_format()
```

#### PHP Data Import Script
```php
<?php
// import_data.php
require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DataImporter {
    public function importUsers($csvFile) {
        $handle = fopen($csvFile, 'r');
        $header = fgetcsv($handle);
        
        while (($data = fgetcsv($handle)) !== FALSE) {
            DB::table('users')->insert([
                'id' => $data[0],
                'unique_id' => $data[1],
                'username' => $data[2],
                'email' => $data[3],
                'phone_number' => $data[4],
                'full_name' => $data[5],
                'display_name' => $data[6],
                'company_name' => $data[7],
                'use_company_sms_branding' => $data[8],
                'password' => Hash::make('defaultpassword123'), // Reset passwords
                'role' => $data[9],
                'parent_user_id' => $data[10],
                'audit_code' => $data[11],
                'is_active' => $data[12],
                'created_at' => $data[13],
                'updated_at' => now()
            ]);
        }
        fclose($handle);
    }
    
    public function importCustomers($csvFile) {
        // Similar implementation for customers
    }
    
    // Continue for all tables...
}

$importer = new DataImporter();
$importer->importUsers('users_export.csv');
$importer->importCustomers('customers_export.csv');
```

### 5. API Endpoint Migration

#### Laravel Routes Example
```php
// routes/api.php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PhoneController;
use App\Http\Controllers\SwapController;
use App\Http\Controllers\RepairController;

Route::prefix('api')->group(function () {
    // Authentication
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        // Phones
        Route::get('phones', [PhoneController::class, 'index']);
        Route::post('phones', [PhoneController::class, 'store']);
        Route::get('phones/{id}', [PhoneController::class, 'show']);
        Route::put('phones/{id}', [PhoneController::class, 'update']);
        Route::delete('phones/{id}', [PhoneController::class, 'destroy']);
        
        // Swaps
        Route::get('swaps', [SwapController::class, 'index']);
        Route::post('swaps', [SwapController::class, 'store']);
        Route::get('swaps/{id}', [SwapController::class, 'show']);
        
        // Repairs
        Route::get('repairs', [RepairController::class, 'index']);
        Route::post('repairs', [RepairController::class, 'store']);
        Route::put('repairs/{id}', [RepairController::class, 'update']);
    });
});
```

#### Laravel Controller Example
```php
<?php
// app/Http/Controllers/PhoneController.php
namespace App\Http\Controllers;

use App\Models\Phone;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PhoneController extends Controller
{
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
        
        $phone = Phone::create([
            ...$validated,
            'created_by_user_id' => auth()->id(),
            'unique_id' => $this->generateUniqueId('PHON')
        ]);
        
        return response()->json($phone->load(['brand', 'category']), 201);
    }
    
    private function generateUniqueId(string $prefix): string
    {
        $count = Phone::count() + 1;
        return $prefix . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
```

### 6. SMS Service Migration

#### Laravel SMS Service
```php
<?php
// app/Services/SmsService.php
namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class SmsService
{
    private $arkaselApiKey;
    private $arkaselSenderId;
    private $hubtelClientId;
    private $hubtelClientSecret;
    private $hubtelSenderId;
    
    public function __construct()
    {
        $this->arkaselApiKey = config('sms.arkasel_api_key');
        $this->arkaselSenderId = config('sms.arkasel_sender_id');
        $this->hubtelClientId = config('sms.hubtel_client_id');
        $this->hubtelClientSecret = config('sms.hubtel_client_secret');
        $this->hubtelSenderId = config('sms.hubtel_sender_id');
    }
    
    public function sendSms(string $phoneNumber, string $message, string $companyName = 'SwapSync'): array
    {
        $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);
        
        // Try Arkasel first
        if ($this->arkaselApiKey) {
            $result = $this->sendViaArkasel($normalizedPhone, $message, $companyName);
            if ($result['success']) {
                return $result;
            }
        }
        
        // Fallback to Hubtel
        if ($this->hubtelClientId && $this->hubtelClientSecret) {
            $result = $this->sendViaHubtel($normalizedPhone, $message, $companyName);
            if ($result['success']) {
                return $result;
            }
        }
        
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
}
```

### 7. Frontend Migration Options

#### Option A: Keep React (Recommended)
- Update API endpoints to point to PHP backend
- Modify authentication to use Laravel Sanctum tokens
- Update API service layer for new response formats

#### Option B: Migrate to Vue.js
```bash
# Create Vue.js project
npm create vue@latest swapsync-vue
cd swapsync-vue
npm install axios vue-router pinia
```

#### Option C: Migrate to Angular
```bash
# Create Angular project
ng new swapsync-angular
cd swapsync-angular
npm install @angular/material
```

### 8. Deployment Configuration

#### Laravel Deployment
```bash
# Production setup
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/swapsync/public;
    
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 9. Migration Checklist

#### Pre-Migration
- [ ] Backup existing SQLite database
- [ ] Export all data to CSV/JSON format
- [ ] Document current API endpoints and responses
- [ ] List all custom configurations and settings
- [ ] Test SMS functionality with current providers

#### Database Migration
- [ ] Create MySQL database and user
- [ ] Run schema creation scripts
- [ ] Import data using PHP scripts
- [ ] Verify data integrity and relationships
- [ ] Update auto-increment sequences

#### Backend Migration
- [ ] Set up PHP framework (Laravel/Symfony)
- [ ] Create models and relationships
- [ ] Implement authentication system
- [ ] Migrate all API endpoints
- [ ] Implement SMS service
- [ ] Set up background job processing
- [ ] Configure logging and monitoring

#### Frontend Migration
- [ ] Update API service endpoints
- [ ] Modify authentication flow
- [ ] Test all user interfaces
- [ ] Update environment configurations
- [ ] Verify responsive design

#### Testing & Deployment
- [ ] Run comprehensive testing suite
- [ ] Performance testing and optimization
- [ ] Security audit and penetration testing
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] Monitor system performance
- [ ] Train users on new system

### 10. Performance Optimization

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_phones_brand_model ON phones(brand, model);
CREATE INDEX idx_swaps_customer_date ON swaps(customer_id, created_at);
CREATE INDEX idx_repairs_status_date ON repairs(status, created_at);
CREATE INDEX idx_pos_sales_date ON pos_sales(created_at);

-- Optimize queries
EXPLAIN SELECT * FROM phones WHERE brand = 'Samsung' AND status = 'AVAILABLE';
```

#### PHP Optimization
```php
// Use eager loading to prevent N+1 queries
$phones = Phone::with(['brand', 'category', 'createdBy'])->get();

// Use database transactions for bulk operations
DB::transaction(function () {
    // Multiple database operations
});

// Cache frequently accessed data
Cache::remember('brands', 3600, function () {
    return Brand::all();
});
```

### 11. Security Considerations

#### Laravel Security Features
```php
// CSRF Protection (built-in)
// SQL Injection Protection (Eloquent ORM)
// XSS Protection (Blade templating)

// Rate Limiting
Route::middleware('throttle:60,1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);
});

// Input Validation
$validated = $request->validate([
    'email' => 'required|email|max:255',
    'password' => 'required|min:8',
]);

// Password Hashing
$hashedPassword = Hash::make($password);
```

#### MySQL Security
```sql
-- Create dedicated database user
CREATE USER 'swapsync'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON swapsync.* TO 'swapsync'@'localhost';
FLUSH PRIVILEGES;

-- Enable SSL connections
ALTER USER 'swapsync'@'localhost' REQUIRE SSL;
```

### 12. Monitoring and Maintenance

#### Laravel Monitoring
```php
// Log important events
Log::info('User login', ['user_id' => $user->id]);
Log::error('SMS failed', ['phone' => $phoneNumber, 'error' => $error]);

// Health checks
Route::get('health', function () {
    return response()->json([
        'status' => 'healthy',
        'database' => DB::connection()->getPdo() ? 'connected' : 'disconnected',
        'timestamp' => now()
    ]);
});
```

#### MySQL Monitoring
```sql
-- Monitor slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'swapsync'
ORDER BY (data_length + index_length) DESC;
```

## 📞 Support & Contact

- **Developer**: Manuel Code
- **Email**: info@manuelcode.info
- **Website**: https://www.manuelcode.info
- **Documentation**: [API Docs](http://127.0.0.1:8000/docs)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📈 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Barcode scanning integration
- [ ] Advanced reporting features
- [ ] API rate limiting
- [ ] Webhook support
- [ ] Backup automation

---

**SwapSync** - Streamlining phone business operations with modern technology.