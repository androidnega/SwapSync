"""
SMS System Diagnostic Tool
Run this to check entire SMS system end-to-end
"""
import os
import sys
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./swapsync.db")

def diagnose():
    print("\n" + "="*60)
    print("🔍 SMS SYSTEM DIAGNOSTIC TOOL")
    print("="*60 + "\n")
    
    engine = create_engine(DATABASE_URL, echo=False)
    inspector = inspect(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Check 1: Database Type
    print("1️⃣ DATABASE TYPE:")
    is_postgres = "postgresql" in DATABASE_URL.lower()
    print(f"   Database: {'PostgreSQL (Railway)' if is_postgres else 'SQLite (Local)'}")
    print(f"   URL: {DATABASE_URL[:30]}...")
    print()
    
    # Check 2: Table Existence
    print("2️⃣ SMS_CONFIG TABLE:")
    tables = inspector.get_table_names()
    if 'sms_config' in tables:
        print("   ✅ Table EXISTS")
        
        # Check columns
        columns = inspector.get_columns('sms_config')
        print(f"   Columns ({len(columns)}):")
        for col in columns:
            print(f"      - {col['name']}: {col['type']}")
        
        # Check records
        result = session.execute(text("SELECT COUNT(*) FROM sms_config")).scalar()
        print(f"   Records: {result}")
        
        if result > 0:
            # Get the record
            config = session.execute(text("""
                SELECT 
                    id, 
                    arkasel_api_key_encrypted,
                    arkasel_sender_id,
                    arkasel_enabled,
                    sms_enabled,
                    updated_by
                FROM sms_config 
                LIMIT 1
            """)).first()
            
            print(f"\n   📋 CONFIG RECORD:")
            print(f"      ID: {config[0]}")
            print(f"      Arkasel API Key encrypted: {bool(config[1])}")
            if config[1]:
                print(f"      Encrypted length: {len(config[1])} chars")
            print(f"      Sender ID: {config[2]}")
            print(f"      Arkasel enabled: {config[3]}")
            print(f"      SMS enabled: {config[4]}")
            print(f"      Updated by: {config[5]}")
    else:
        print("   ❌ Table DOES NOT EXIST!")
        print("   Solution: Run migrate_add_sms_config_table.py")
    print()
    
    # Check 3: Encryption Key
    print("3️⃣ ENCRYPTION KEY:")
    enc_key = os.getenv("SMS_ENCRYPTION_KEY")
    if enc_key:
        print(f"   ✅ Set in environment (length: {len(enc_key)})")
    else:
        print(f"   ⚠️ NOT set (using default)")
        print(f"   Recommendation: Set SMS_ENCRYPTION_KEY in Railway")
    print()
    
    # Check 4: Test Decryption (if config exists)
    if 'sms_config' in tables:
        result = session.execute(text("SELECT COUNT(*) FROM sms_config")).scalar()
        if result > 0:
            print("4️⃣ DECRYPTION TEST:")
            try:
                from app.models.sms_config import SMSConfig
                config = session.query(SMSConfig).first()
                
                if config.arkasel_api_key_encrypted:
                    decrypted = config.get_arkasel_api_key()
                    if decrypted:
                        print(f"   ✅ Decryption WORKS!")
                        print(f"   Decrypted length: {len(decrypted)} chars")
                    else:
                        print(f"   ❌ Decryption FAILED!")
                        print(f"   Encrypted value exists but can't decrypt")
                        print(f"   Likely: Encryption key changed")
                else:
                    print(f"   ⚠️ No API key saved yet")
            except Exception as e:
                print(f"   ❌ Error: {e}")
            print()
    
    # Check 5: SMS Service
    print("5️⃣ SMS SERVICE:")
    try:
        from app.core.sms import get_sms_service
        sms_service = get_sms_service()
        
        print(f"   Service exists: {bool(sms_service)}")
        print(f"   Enabled: {sms_service.enabled}")
        print(f"   Arkasel enabled: {sms_service.arkasel_enabled}")
        print(f"   Arkasel API key set: {bool(sms_service.arkasel_api_key)}")
        if sms_service.arkasel_api_key:
            print(f"   Arkasel API key length: {len(sms_service.arkasel_api_key)}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    print()
    
    print("="*60)
    print("DIAGNOSTIC COMPLETE!")
    print("="*60 + "\n")
    
    session.close()

if __name__ == "__main__":
    try:
        diagnose()
    except Exception as e:
        print(f"\n❌ DIAGNOSTIC FAILED: {e}")
        import traceback
        traceback.print_exc()

