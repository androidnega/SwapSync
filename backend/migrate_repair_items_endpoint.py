#!/usr/bin/env python3
"""
Migration endpoint for repair items company isolation
This can be called via API to update existing repair items
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.repair_item import RepairItem

router = APIRouter(prefix="/migration", tags=["Migration"])

@router.post("/repair-items-company-isolation")
def migrate_repair_items_company_isolation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Migrate repair items to add company isolation
    Only super admins can run this migration
    """
    # Only allow super admins to run migrations
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only super admins can run migrations"
        )
    
    try:
        print("🔄 Starting repair items company isolation migration...")
        
        # Get super admin user (first admin found)
        super_admin = db.query(User).filter(
            User.role.in_([UserRole.SUPER_ADMIN, UserRole.ADMIN])
        ).first()
        
        if not super_admin:
            raise HTTPException(
                status_code=400,
                detail="No super admin user found"
            )
        
        # Update all repair items without created_by_user_id
        items_updated = db.query(RepairItem).filter(
            RepairItem.created_by_user_id.is_(None)
        ).update(
            {RepairItem.created_by_user_id: super_admin.id},
            synchronize_session=False
        )
        
        db.commit()
        
        # Verify the migration
        total_items = db.query(RepairItem).count()
        items_with_company = db.query(RepairItem).filter(
            RepairItem.created_by_user_id.isnot(None)
        ).count()
        
        return {
            "success": True,
            "message": f"Migration completed successfully!",
            "items_updated": items_updated,
            "total_items": total_items,
            "items_with_company_isolation": items_with_company,
            "migrated_by": current_user.username,
            "assigned_to_admin": super_admin.username
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Migration failed: {str(e)}"
        )

if __name__ == "__main__":
    # This can also be run as a standalone script
    from app.core.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Get super admin
        super_admin = db.query(User).filter(
            User.role.in_([UserRole.SUPER_ADMIN, UserRole.ADMIN])
        ).first()
        
        if not super_admin:
            print("❌ No super admin found")
            sys.exit(1)
        
        # Update repair items
        items_updated = db.query(RepairItem).filter(
            RepairItem.created_by_user_id.is_(None)
        ).update(
            {RepairItem.created_by_user_id: super_admin.id},
            synchronize_session=False
        )
        
        db.commit()
        print(f"✅ Updated {items_updated} repair items with company isolation")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()
