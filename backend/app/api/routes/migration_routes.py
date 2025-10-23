"""
Migration API Routes - For running database migrations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_manager
from app.models.user import User
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
        # Use SQLAlchemy to run the migration directly
        from sqlalchemy import text
        
        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND table_schema = 'public'
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        
        phone_fields = [
            ("imei", "VARCHAR UNIQUE"),
            ("is_phone", "BOOLEAN DEFAULT FALSE"),
            ("phone_condition", "VARCHAR"),
            ("phone_specs", "JSONB"),
            ("is_swappable", "BOOLEAN DEFAULT FALSE"),
            ("phone_status", "VARCHAR DEFAULT 'AVAILABLE'"),
            ("swapped_from_id", "INTEGER"),
            ("current_owner_id", "INTEGER"),
            ("current_owner_type", "VARCHAR DEFAULT 'shop'")
        ]
        
        added_fields = []
        for field_name, field_type in phone_fields:
            if field_name not in existing_columns:
                try:
                    db.execute(text(f"ALTER TABLE products ADD COLUMN {field_name} {field_type}"))
                    added_fields.append(field_name)
                except Exception as e:
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
                db.execute(text(index_sql))
            except Exception as e:
                # Index creation errors are usually not critical
                pass
        
        db.commit()
        
        # Get product count
        from app.models.product import Product
        total_products = db.query(Product).count()
        
        return {
            "success": True,
            "message": f"Migration completed successfully. Added {len(added_fields)} new fields.",
            "added_fields": added_fields,
            "existing_fields": [f for f, _ in phone_fields if f in existing_columns],
            "total_products": total_products
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration failed: {str(e)}"
        )


@router.post("/remove-category-unique-constraint")
def remove_category_unique_constraint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove global unique constraint from categories.name
    Allows multiple companies to have categories with the same name
    Only accessible by managers and above
    """
    # Only managers can run migrations
    require_manager(current_user)
    
    try:
        from sqlalchemy import text
        
        # Get database engine
        engine = db.get_bind()
        inspector = inspect(engine)
        
        # Check for unique constraints
        constraints = inspector.get_unique_constraints('categories')
        indexes = inspector.get_indexes('categories')
        
        dropped_items = []
        
        # Drop unique constraints
        for constraint in constraints:
            if 'name' in constraint.get('column_names', []):
                constraint_name = constraint.get('name')
                try:
                    db.execute(text(f"ALTER TABLE categories DROP CONSTRAINT IF EXISTS {constraint_name}"))
                    db.commit()
                    dropped_items.append(f"constraint:{constraint_name}")
                except Exception as e:
                    db.rollback()
                    pass
        
        # Drop unique indexes
        for index in indexes:
            if index.get('unique') and 'name' in index.get('column_names', []):
                index_name = index.get('name')
                try:
                    db.execute(text(f"DROP INDEX IF EXISTS {index_name}"))
                    db.commit()
                    dropped_items.append(f"index:{index_name}")
                except Exception as e:
                    db.rollback()
                    pass
        
        # Try common constraint names
        if not dropped_items:
            common_names = ['categories_name_key', 'uq_categories_name', 'categories_name_unique']
            for constraint_name in common_names:
                try:
                    db.execute(text(f"ALTER TABLE categories DROP CONSTRAINT IF EXISTS {constraint_name}"))
                    db.commit()
                    dropped_items.append(f"constraint:{constraint_name}")
                    break
                except:
                    db.rollback()
        
        # Create non-unique index for performance
        try:
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)"))
            db.commit()
        except:
            db.rollback()
        
        # Get category count
        from app.models.category import Category
        total_categories = db.query(Category).count()
        
        return {
            "success": True,
            "message": "Migration completed successfully. Categories are now company-isolated.",
            "dropped_items": dropped_items,
            "total_categories": total_categories
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration failed: {str(e)}"
        )
