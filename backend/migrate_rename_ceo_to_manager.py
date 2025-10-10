"""
Migration: Rename CEO role to Manager throughout database
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    try:
        print("🔄 Renaming CEO role to MANAGER...")
        
        # Update role in users table
        cursor.execute("""
            UPDATE users SET role = 'MANAGER' WHERE role IN ('CEO', 'ceo')
        """)
        
        rows_updated = cursor.rowcount
        
        conn.commit()
        print(f"✅ Migration successful: Updated {rows_updated} user(s) from CEO to MANAGER")
        
        # Verify
        cursor.execute("SELECT id, username, role FROM users WHERE role = 'MANAGER'")
        managers = cursor.fetchall()
        print(f"\n📊 Managers in system:")
        for manager in managers:
            print(f"   - ID:{manager[0]} | Username:{manager[1]} | Role:{manager[2]}")
        
    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

