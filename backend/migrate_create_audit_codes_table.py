"""
Migration: Create audit_codes table for auto-expiring codes
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        print("🔄 Creating audit_codes table...")
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                code VARCHAR NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                auto_generated BOOLEAN DEFAULT 0,
                used BOOLEAN DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Create index on code for faster lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_codes_code ON audit_codes(code)
        """)
        
        # Create index on user_id
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_codes_user_id ON audit_codes(user_id)
        """)
        
        conn.commit()
        
        print("✅ Migration successful!")
        print("   - audit_codes table created")
        print("   - Indexes created for performance")
        print("   - Ready for auto-expiring audit codes!")
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

