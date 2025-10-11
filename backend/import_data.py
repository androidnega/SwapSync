"""
Import data from JSON export into PostgreSQL database
Run this on Railway or locally pointing to PostgreSQL
"""
import json
import sys
import os
from datetime import datetime

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import *
from app.core.database import Base
from app.core.config import settings

def parse_datetime(date_str):
    """Parse ISO datetime string"""
    if date_str:
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            return None
    return None

def import_table(session, model, table_name, records):
    """Import records into a table"""
    if not records:
        print(f"⏭️  Skipping {table_name} (no data)")
        return
    
    print(f"📥 Importing {len(records)} records into {table_name}...")
    
    # Convert datetime strings back to datetime objects
    datetime_fields = ['created_at', 'updated_at', 'date', 'repair_date', 
                       'completion_date', 'pickup_date', 'sale_date', 
                       'swap_date', 'timestamp', 'sent_at', 'expires_at',
                       'completed_at', 'login_time', 'last_activity']
    
    success_count = 0
    for record_dict in records:
        try:
            # Parse datetime fields
            for field in datetime_fields:
                if field in record_dict and record_dict[field]:
                    record_dict[field] = parse_datetime(record_dict[field])
            
            # Create model instance
            instance = model(**record_dict)
            session.add(instance)
            success_count += 1
        except Exception as e:
            print(f"   ⚠️ Error importing record: {e}")
            continue
    
    session.commit()
    print(f"   ✅ Imported {success_count} records into {table_name}")

def main():
    # Check if export file exists
    export_file = "data_export.json"
    if not os.path.exists(export_file):
        print(f"❌ Export file '{export_file}' not found!")
        print("   Run 'python export_data.py' first to create the export file.")
        return
    
    # Load export data
    print(f"📂 Loading data from {export_file}...")
    with open(export_file, 'r', encoding='utf-8') as f:
        export_data = json.load(f)
    
    # Create PostgreSQL engine (or use DATABASE_URL from env)
    database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    print(f"🔗 Connecting to database...")
    engine = create_engine(database_url, echo=False)
    
    # Create all tables
    print("🏗️  Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Tables to import (in order to respect foreign keys)
    tables_to_import = [
        (User, "users"),
        (Customer, "customers"),
        (Brand, "brands"),
        (Category, "categories"),
        (Phone, "phones"),
        (Product, "products"),
        (Sale, "sales"),
        (Swap, "swaps"),
        (Repair, "repairs"),
        (ProductSale, "product_sales"),
        (AuditCode, "audit_codes"),
        (Invoice, "invoices"),
        (ActivityLog, "activity_logs"),
        (SMSLog, "sms_logs"),
        (UserSession, "user_sessions"),
    ]
    
    try:
        for model, table_name in tables_to_import:
            try:
                records = export_data.get(table_name, [])
                import_table(session, model, table_name, records)
            except Exception as e:
                print(f"❌ Error importing {table_name}: {e}")
                session.rollback()
        
        print("\n🎉 Import complete!")
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    main()

