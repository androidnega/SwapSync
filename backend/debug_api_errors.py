#!/usr/bin/env python3
"""
Debug script to identify API endpoint issues
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.product import Product
from app.models.user import User
from app.models.pending_resale import PendingResale
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError

def check_database_connection():
    """Check if database connection is working"""
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1"))
        print("✅ Database connection: OK")
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_tables_exist():
    """Check if required tables exist"""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        required_tables = [
            'products', 'users', 'customers', 'phones', 'swaps', 
            'sales', 'repairs', 'pending_resales', 'categories', 'brands'
        ]
        
        print("\n📋 Table Status:")
        for table in required_tables:
            if table in tables:
                print(f"✅ {table}: EXISTS")
            else:
                print(f"❌ {table}: MISSING")
        
        return all(table in tables for table in required_tables)
    except Exception as e:
        print(f"❌ Table check failed: {e}")
        return False

def check_product_table_structure():
    """Check Product table structure"""
    try:
        db = SessionLocal()
        
        # Check if we can query products
        product_count = db.query(Product).count()
        print(f"\n📦 Products table: {product_count} records")
        
        # Check for low stock products
        low_stock = db.query(Product).filter(
            Product.is_active == True,
            Product.quantity > 0,
            Product.quantity <= Product.min_stock_level
        ).count()
        print(f"📉 Low stock products: {low_stock}")
        
        # Check for out of stock products
        out_of_stock = db.query(Product).filter(
            Product.is_active == True,
            Product.quantity == 0
        ).count()
        print(f"📭 Out of stock products: {out_of_stock}")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Product table check failed: {e}")
        return False

def check_user_table():
    """Check User table"""
    try:
        db = SessionLocal()
        
        user_count = db.query(User).count()
        print(f"\n👥 Users table: {user_count} records")
        
        # Check for different user roles
        from app.models.user import UserRole
        for role in UserRole:
            count = db.query(User).filter(User.role == role).count()
            print(f"   {role.value}: {count}")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ User table check failed: {e}")
        return False

def check_pending_resales_table():
    """Check PendingResale table"""
    try:
        db = SessionLocal()
        
        resale_count = db.query(PendingResale).count()
        print(f"\n🔄 Pending Resales table: {resale_count} records")
        
        # Check for different statuses
        from app.models.pending_resale import PhoneSaleStatus
        for status in PhoneSaleStatus:
            count = db.query(PendingResale).filter(
                PendingResale.incoming_phone_status == status
            ).count()
            print(f"   {status.value}: {count}")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Pending Resales table check failed: {e}")
        return False

def test_low_stock_query():
    """Test the exact query used in low-stock endpoint"""
    try:
        db = SessionLocal()
        
        products = db.query(Product).filter(
            Product.is_active == True,
            Product.quantity > 0,
            Product.quantity <= Product.min_stock_level
        ).all()
        
        print(f"\n🔍 Low stock query test: {len(products)} products found")
        for product in products[:5]:  # Show first 5
            print(f"   - {product.name}: {product.quantity}/{product.min_stock_level}")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Low stock query test failed: {e}")
        return False

def test_dashboard_query():
    """Test dashboard queries"""
    try:
        db = SessionLocal()
        
        # Test customer count query
        from app.models.customer import Customer
        customer_count = db.query(Customer).count()
        print(f"\n📊 Dashboard query test:")
        print(f"   Total customers: {customer_count}")
        
        # Test pending resales query
        pending_count = db.query(PendingResale).filter(
            PendingResale.incoming_phone_id.isnot(None),
            PendingResale.incoming_phone_status != "sold"
        ).count()
        print(f"   Pending resales: {pending_count}")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Dashboard query test failed: {e}")
        return False

def main():
    """Run all diagnostic checks"""
    print("🔧 SwapSync API Diagnostic Tool")
    print("=" * 50)
    
    # Run all checks
    checks = [
        ("Database Connection", check_database_connection),
        ("Tables Exist", check_tables_exist),
        ("Product Table", check_product_table_structure),
        ("User Table", check_user_table),
        ("Pending Resales Table", check_pending_resales_table),
        ("Low Stock Query", test_low_stock_query),
        ("Dashboard Query", test_dashboard_query),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name} check crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 DIAGNOSTIC SUMMARY")
    print("=" * 50)
    
    passed = 0
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} checks passed")
    
    if passed == len(results):
        print("🎉 All checks passed! The API should be working.")
    else:
        print("⚠️  Some checks failed. Check the errors above.")
        print("\n💡 Common fixes:")
        print("   1. Run database migrations: python run_migrations.py")
        print("   2. Check database file permissions")
        print("   3. Verify all required tables exist")
        print("   4. Check for missing columns in tables")

if __name__ == "__main__":
    main()
