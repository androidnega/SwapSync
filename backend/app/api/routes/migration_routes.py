"""
Migration API Routes - For running database migrations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_manager
from app.models.user import User
import sqlite3
import os

router = APIRouter(prefix="/migrations", tags=["Migrations"])


@router.post("/add-phone-fields")
def add_phone_fields_migration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add phone-specific fields to the products table
    Only accessible by managers and above
    """
    # Only managers can run migrations
    require_manager(current_user)
    
    try:
        # Get database path from SQLAlchemy URL
        from app.core.database import SQLALCHEMY_DATABASE_URL
        
        if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This migration is only for SQLite databases"
            )
        
        # Extract database path
        db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
        
        if not os.path.exists(db_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Database file not found: {db_path}"
            )
        
        # Run migration
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(products)")
        columns = [column[1] for column in cursor.fetchall()]
        
        phone_fields = [
            ("imei", "VARCHAR UNIQUE"),
            ("is_phone", "BOOLEAN DEFAULT 0"),
            ("phone_condition", "VARCHAR"),
            ("phone_specs", "JSON"),
            ("is_swappable", "BOOLEAN DEFAULT 0"),
            ("phone_status", "VARCHAR DEFAULT 'AVAILABLE'"),
            ("swapped_from_id", "INTEGER"),
            ("current_owner_id", "INTEGER"),
            ("current_owner_type", "VARCHAR DEFAULT 'shop'")
        ]
        
        added_fields = []
        for field_name, field_type in phone_fields:
            if field_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE products ADD COLUMN {field_name} {field_type}")
                    added_fields.append(field_name)
                except sqlite3.Error as e:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to add column {field_name}: {str(e)}"
                    )
        
        # Create indexes
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_products_imei ON products(imei)",
            "CREATE INDEX IF NOT EXISTS idx_products_is_phone ON products(is_phone)",
            "CREATE INDEX IF NOT EXISTS idx_products_phone_condition ON products(phone_condition)",
            "CREATE INDEX IF NOT EXISTS idx_products_is_swappable ON products(is_swappable)",
            "CREATE INDEX IF NOT EXISTS idx_products_phone_status ON products(phone_status)"
        ]
        
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
            except sqlite3.Error as e:
                # Index creation errors are usually not critical
                pass
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Migration completed successfully. Added {len(added_fields)} new fields.",
            "added_fields": added_fields,
            "total_products": db.query(db.query().count()).scalar() if hasattr(db, 'query') else 0
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration failed: {str(e)}"
        )
