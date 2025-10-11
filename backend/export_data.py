"""
Export data from SQLite database to JSON for migration
"""
import json
import sys
import os
from datetime import datetime

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from app.models import *
from app.core.database import Base

# SQLite database path
SQLITE_DB = "sqlite:///./swapsync.db"

def datetime_handler(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def export_table(session, model, table_name):
    """Export a single table to dict"""
    print(f"📦 Exporting {table_name}...")
    records = session.query(model).all()
    data = []
    
    for record in records:
        record_dict = {}
        for column in inspect(record).mapper.column_attrs:
            record_dict[column.key] = getattr(record, column.key)
        data.append(record_dict)
    
    print(f"   ✅ Exported {len(data)} records from {table_name}")
    return data

def main():
    # Create SQLite engine
    engine = create_engine(SQLITE_DB, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Tables to export (in order to respect foreign keys)
    tables_to_export = [
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
    
    export_data = {}
    
    try:
        for model, table_name in tables_to_export:
            try:
                export_data[table_name] = export_table(session, model, table_name)
            except Exception as e:
                print(f"   ⚠️ Error exporting {table_name}: {e}")
                export_data[table_name] = []
        
        # Save to JSON file
        output_file = "data_export.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, default=datetime_handler, ensure_ascii=False)
        
        print(f"\n🎉 Export complete! Saved to {output_file}")
        
        # Print summary
        print("\n📊 Export Summary:")
        for table_name, records in export_data.items():
            if records:
                print(f"   • {table_name}: {len(records)} records")
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    main()

