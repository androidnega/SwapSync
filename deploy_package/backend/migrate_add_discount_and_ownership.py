"""
Database Migration: Add discount_amount and ownership tracking fields
Adds missing columns to existing database
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "swapsync.db"

def migrate_database():
    """Add missing columns to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Starting database migration...")
    print(f"Database: {DB_PATH}")
    
    migrations = []
    
    # Check and add discount_amount to swaps table
    cursor.execute("PRAGMA table_info(swaps)")
    swap_columns = [col[1] for col in cursor.fetchall()]
    
    if 'discount_amount' not in swap_columns:
        migrations.append("ALTER TABLE swaps ADD COLUMN discount_amount FLOAT DEFAULT 0.0 NOT NULL")
        print("  ✅ Will add 'discount_amount' to swaps table")
    else:
        print("  ✓ swaps.discount_amount already exists")
    
    if 'final_price' not in swap_columns:
        migrations.append("ALTER TABLE swaps ADD COLUMN final_price FLOAT NOT NULL DEFAULT 0.0")
        print("  ✅ Will add 'final_price' to swaps table")
    else:
        print("  ✓ swaps.final_price already exists")
    
    if 'invoice_number' not in swap_columns:
        migrations.append("ALTER TABLE swaps ADD COLUMN invoice_number VARCHAR")
        print("  ✅ Will add 'invoice_number' to swaps table")
    else:
        print("  ✓ swaps.invoice_number already exists")
    
    # Check and add columns to sales table
    cursor.execute("PRAGMA table_info(sales)")
    sale_columns = [col[1] for col in cursor.fetchall()]
    
    if 'original_price' not in sale_columns:
        migrations.append("ALTER TABLE sales ADD COLUMN original_price FLOAT NOT NULL DEFAULT 0.0")
        print("  ✅ Will add 'original_price' to sales table")
    else:
        print("  ✓ sales.original_price already exists")
    
    if 'discount_amount' not in sale_columns:
        migrations.append("ALTER TABLE sales ADD COLUMN discount_amount FLOAT DEFAULT 0.0 NOT NULL")
        print("  ✅ Will add 'discount_amount' to sales table")
    else:
        print("  ✓ sales.discount_amount already exists")
    
    if 'amount_paid' not in sale_columns:
        migrations.append("ALTER TABLE sales ADD COLUMN amount_paid FLOAT NOT NULL DEFAULT 0.0")
        print("  ✅ Will add 'amount_paid' to sales table")
    else:
        print("  ✓ sales.amount_paid already exists")
    
    if 'invoice_number' not in sale_columns:
        migrations.append("ALTER TABLE sales ADD COLUMN invoice_number VARCHAR")
        print("  ✅ Will add 'invoice_number' to sales table")
    else:
        print("  ✓ sales.invoice_number already exists")
    
    # Check and add ownership tracking to phones table
    cursor.execute("PRAGMA table_info(phones)")
    phone_columns = [col[1] for col in cursor.fetchall()]
    
    if 'current_owner_id' not in phone_columns:
        migrations.append("ALTER TABLE phones ADD COLUMN current_owner_id INTEGER")
        print("  ✅ Will add 'current_owner_id' to phones table")
    else:
        print("  ✓ phones.current_owner_id already exists")
    
    if 'current_owner_type' not in phone_columns:
        migrations.append("ALTER TABLE phones ADD COLUMN current_owner_type VARCHAR DEFAULT 'shop'")
        print("  ✅ Will add 'current_owner_type' to phones table")
    else:
        print("  ✓ phones.current_owner_type already exists")
    
    # Execute all migrations
    if migrations:
        print(f"\nExecuting {len(migrations)} migrations...")
        for migration in migrations:
            try:
                cursor.execute(migration)
                print(f"  ✅ {migration[:50]}...")
            except Exception as e:
                print(f"  ❌ Error: {e}")
                print(f"     SQL: {migration}")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
    else:
        print("\n✓ Database is already up to date. No migrations needed.")
    
    # Update final_price for existing swaps (if needed)
    cursor.execute("SELECT COUNT(*) FROM swaps WHERE final_price = 0.0")
    zero_price_count = cursor.fetchone()[0]
    
    if zero_price_count > 0:
        print(f"\nUpdating {zero_price_count} swaps with calculated final_price...")
        cursor.execute("""
            UPDATE swaps 
            SET final_price = balance_paid - COALESCE(discount_amount, 0)
            WHERE final_price = 0.0
        """)
        conn.commit()
        print("  ✅ Updated final_price for existing swaps")
    
    conn.close()
    print("\n🎉 Database migration complete!")
    print("You can now restart the backend server.\n")

if __name__ == "__main__":
    migrate_database()

