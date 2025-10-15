"""
Migration: Set staff_id for existing repairs that don't have it
Copies created_by_user_id to staff_id for all repairs
"""
from app.core.database import SessionLocal, engine
from app.models.repair import Repair
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        print("🔧 Setting staff_id for existing repairs...")
        
        # Update all repairs where staff_id is NULL
        # Set staff_id = created_by_user_id
        result = db.execute(
            text("""
                UPDATE repairs 
                SET staff_id = created_by_user_id 
                WHERE staff_id IS NULL 
                AND created_by_user_id IS NOT NULL
            """)
        )
        
        db.commit()
        
        rows_updated = result.rowcount
        print(f"✅ Updated {rows_updated} repairs with staff_id")
        
        # Verify
        repairs_without_staff = db.query(Repair).filter(
            Repair.staff_id.is_(None),
            Repair.created_by_user_id.isnot(None)
        ).count()
        
        print(f"📊 Repairs without staff_id: {repairs_without_staff}")
        
        if repairs_without_staff == 0:
            print("✅ All repairs now have staff_id set!")
        else:
            print(f"⚠️ Still {repairs_without_staff} repairs without staff_id")
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

