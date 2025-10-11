"""
MANUAL SMS SETUP SCRIPT
Run this directly on Railway to setup SMS once and for all!

Usage: railway run python MANUAL_SMS_SETUP.py
"""
import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./swapsync.db")

def main():
    print("\n" + "="*70)
    print("🚀 MANUAL SMS SETUP - ONE-TIME CONFIGURATION")
    print("="*70 + "\n")
    
    # Get user input
    print("📝 Enter your SMS configuration:\n")
    arkasel_api_key = input("Arkasel API Key: ").strip()
    
    if not arkasel_api_key:
        print("\n❌ API Key is required! Exiting.")
        return
    
    arkasel_sender_id = input("Sender ID (default: SwapSync): ").strip() or "SwapSync"
    
    print("\n" + "-"*70)
    print("🔧 STEP 1: Creating sms_config table...")
    print("-"*70)
    
    engine = create_engine(DATABASE_URL, echo=False)
    is_postgres = "postgresql" in DATABASE_URL.lower()
    
    # Create table if doesn't exist
    with engine.connect() as conn:
        try:
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS sms_config (
                        id SERIAL PRIMARY KEY,
                        arkasel_api_key_encrypted TEXT,
                        arkasel_sender_id TEXT DEFAULT 'SwapSync',
                        arkasel_enabled BOOLEAN DEFAULT FALSE,
                        hubtel_client_id_encrypted TEXT,
                        hubtel_client_secret_encrypted TEXT,
                        hubtel_sender_id TEXT DEFAULT 'SwapSync',
                        hubtel_enabled BOOLEAN DEFAULT FALSE,
                        sms_enabled BOOLEAN DEFAULT FALSE,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_by TEXT
                    )
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS sms_config (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        arkasel_api_key_encrypted TEXT,
                        arkasel_sender_id TEXT DEFAULT 'SwapSync',
                        arkasel_enabled INTEGER DEFAULT 0,
                        hubtel_client_id_encrypted TEXT,
                        hubtel_client_secret_encrypted TEXT,
                        hubtel_sender_id TEXT DEFAULT 'SwapSync',
                        hubtel_enabled INTEGER DEFAULT 0,
                        sms_enabled INTEGER DEFAULT 0,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_by TEXT
                    )
                """))
            conn.commit()
            print("✅ Table created (or already exists)")
        except Exception as e:
            print(f"⚠️ Table creation: {e}")
    
    print("\n" + "-"*70)
    print("🔐 STEP 2: Encrypting and saving API key...")
    print("-"*70)
    
    # Initialize encryption
    from cryptography.fernet import Fernet
    import hashlib
    import base64
    
    DEFAULT_KEY = "SwapSync-SMS-Encryption-Key-2025-Change-In-Production-Please=="
    ENCRYPTION_KEY = os.getenv("SMS_ENCRYPTION_KEY", DEFAULT_KEY)
    
    try:
        cipher = Fernet(ENCRYPTION_KEY.encode())
    except:
        key_hash = hashlib.sha256(DEFAULT_KEY.encode()).digest()
        cipher = Fernet(base64.urlsafe_b64encode(key_hash))
    
    # Encrypt the API key
    encrypted_key = cipher.encrypt(arkasel_api_key.encode()).decode()
    print(f"✅ API key encrypted (length: {len(arkasel_api_key)} → {len(encrypted_key)})")
    
    print("\n" + "-"*70)
    print("💾 STEP 3: Saving to database...")
    print("-"*70)
    
    # Save to database
    with engine.connect() as conn:
        # Check if record exists
        result = conn.execute(text("SELECT COUNT(*) FROM sms_config")).scalar()
        
        if result == 0:
            # Insert new record
            if is_postgres:
                conn.execute(text("""
                    INSERT INTO sms_config (
                        arkasel_api_key_encrypted, 
                        arkasel_sender_id, 
                        arkasel_enabled, 
                        sms_enabled,
                        updated_by
                    ) VALUES (
                        :key, :sender, TRUE, TRUE, 'manual_setup'
                    )
                """), {"key": encrypted_key, "sender": arkasel_sender_id})
            else:
                conn.execute(text("""
                    INSERT INTO sms_config (
                        arkasel_api_key_encrypted, 
                        arkasel_sender_id, 
                        arkasel_enabled, 
                        sms_enabled,
                        updated_by
                    ) VALUES (
                        :key, :sender, 1, 1, 'manual_setup'
                    )
                """), {"key": encrypted_key, "sender": arkasel_sender_id})
            print("✅ New config created")
        else:
            # Update existing record
            if is_postgres:
                conn.execute(text("""
                    UPDATE sms_config SET
                        arkasel_api_key_encrypted = :key,
                        arkasel_sender_id = :sender,
                        arkasel_enabled = TRUE,
                        sms_enabled = TRUE,
                        updated_by = 'manual_setup',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = (SELECT MIN(id) FROM sms_config)
                """), {"key": encrypted_key, "sender": arkasel_sender_id})
            else:
                conn.execute(text("""
                    UPDATE sms_config SET
                        arkasel_api_key_encrypted = :key,
                        arkasel_sender_id = :sender,
                        arkasel_enabled = 1,
                        sms_enabled = 1,
                        updated_by = 'manual_setup'
                    WHERE id = (SELECT MIN(id) FROM sms_config)
                """), {"key": encrypted_key, "sender": arkasel_sender_id})
            print("✅ Existing config updated")
        
        conn.commit()
    
    print("\n" + "-"*70)
    print("🔍 STEP 4: Verifying save...")
    print("-"*70)
    
    # Verify
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT arkasel_api_key_encrypted, arkasel_sender_id, arkasel_enabled, sms_enabled
            FROM sms_config LIMIT 1
        """)).first()
        
        if result and result[0]:
            # Try to decrypt
            try:
                decrypted = cipher.decrypt(result[0].encode()).decode()
                print(f"✅ API Key saved and decrypts correctly!")
                print(f"   Encrypted: {len(result[0])} chars")
                print(f"   Decrypted: {len(decrypted)} chars")
                print(f"   Sender ID: {result[1]}")
                print(f"   Arkasel enabled: {result[2]}")
                print(f"   SMS enabled: {result[3]}")
            except Exception as e:
                print(f"❌ Decryption failed: {e}")
        else:
            print("❌ No config found after save!")
    
    print("\n" + "="*70)
    print("✅ SETUP COMPLETE!")
    print("="*70)
    print("\nNext steps:")
    print("1. Restart Railway service (Settings → Restart)")
    print("2. Check logs for: '✅ SMS service configured from database'")
    print("3. Create a manager account with phone number")
    print("4. Manager should receive SMS instantly!")
    print("\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()

