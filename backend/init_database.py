#!/usr/bin/env python3
"""
Initialize database with all required tables
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models import *

def init_database():
    """Create all database tables"""
    print("🔄 Initializing database...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        required_tables = [
            'users', 'customers', 'phones', 'swaps', 'sales', 'repairs',
            'products', 'categories', 'brands', 'pending_resales',
            'product_sales', 'pos_sales', 'pos_sale_items', 'repair_items',
            'repair_item_usage', 'stock_movements', 'sms_logs', 'sms_configs',
            'activity_logs', 'invoices', 'user_sessions', 'audit_codes',
            'otp_sessions'
        ]
        
        print("\n📋 Table Status:")
        for table in required_tables:
            if table in tables:
                print(f"✅ {table}")
            else:
                print(f"❌ {table} - MISSING")
        
        print(f"\n🎯 Total tables created: {len(tables)}")
        print("✅ Database initialization completed!")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    init_database()
