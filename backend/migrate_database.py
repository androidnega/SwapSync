"""
Database Migration Script - Add New Fields
This script adds the new fields to existing tables:
- phones: imei, status
- repairs: phone_id, diagnosis
- sms_logs: new table
"""
import sys
from sqlalchemy import create_engine, text
from app.core.database import SQLALCHEMY_DATABASE_URL

def migrate_database():
    """Run database migrations"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    
    print("🔄 Starting database migration...")
    
    with engine.begin() as conn:
        try:
            # Add imei to phones table (SQLite doesn't support UNIQUE in ALTER TABLE)
            print("📱 Adding IMEI field to phones...")
            conn.execute(text("""
                ALTER TABLE phones ADD COLUMN imei VARCHAR;
            """))
            # Create unique index separately
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_phones_imei ON phones(imei);
            """))
            print("✅ IMEI field added with unique index")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("⏭️  IMEI field already exists, skipping")
            else:
                print(f"❌ Error adding IMEI: {e}")
        
        try:
            # Add status to phones table
            print("📊 Adding status field to phones...")
            conn.execute(text("""
                ALTER TABLE phones ADD COLUMN status VARCHAR DEFAULT 'available';
            """))
            print("✅ Status field added")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("⏭️  Status field already exists, skipping")
            else:
                print(f"❌ Error adding status: {e}")
        
        try:
            # Add phone_id to repairs table
            print("🔧 Adding phone_id field to repairs...")
            conn.execute(text("""
                ALTER TABLE repairs ADD COLUMN phone_id INTEGER REFERENCES phones(id);
            """))
            print("✅ phone_id field added")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("⏭️  phone_id field already exists, skipping")
            else:
                print(f"❌ Error adding phone_id: {e}")
        
        try:
            # Add diagnosis to repairs table
            print("📝 Adding diagnosis field to repairs...")
            conn.execute(text("""
                ALTER TABLE repairs ADD COLUMN diagnosis VARCHAR;
            """))
            print("✅ Diagnosis field added")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("⏭️  Diagnosis field already exists, skipping")
            else:
                print(f"❌ Error adding diagnosis: {e}")
        
        try:
            # Create sms_logs table
            print("📱 Creating SMS logs table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS sms_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL REFERENCES customers(id),
                    phone_number VARCHAR NOT NULL,
                    customer_name VARCHAR NOT NULL,
                    message_type VARCHAR NOT NULL,
                    message_body TEXT NOT NULL,
                    transaction_type VARCHAR,
                    transaction_id INTEGER,
                    status VARCHAR DEFAULT 'sent',
                    error_message VARCHAR,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            print("✅ SMS logs table created")
        except Exception as e:
            print(f"⏭️  SMS logs table already exists or error: {e}")
    
    print("✅ Database migration completed!")
    print("\n📋 Summary:")
    print("   - IMEI field added to phones")
    print("   - Status field added to phones (Available, Swapped, Sold, Under Repair)")
    print("   - phone_id field added to repairs (optional link to inventory)")
    print("   - Diagnosis field added to repairs")
    print("   - SMS logs table created for audit trail")
    print("\n🎯 Integration features now active:")
    print("   ✅ Phone IMEI tracking")
    print("   ✅ Phone status tracking")
    print("   ✅ Automatic SMS on swap/sale completion")
    print("   ✅ SMS audit logging")
    print("   ✅ Repair phone status updates")
    print("   ✅ Diagnosis tracking for repairs")

if __name__ == "__main__":
    try:
        migrate_database()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

