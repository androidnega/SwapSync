"""
Category Management Routes - Manager-only CRUD for phone categories
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.activity_logger import log_activity
from app.models.user import User, UserRole
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[CategoryResponse])
def get_all_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all categories (available to all authenticated users)
    """
    categories = db.query(Category).order_by(Category.name).all()
    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific category by ID
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category


@router.post("/", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new category (Manager-only)
    """
    # Only Managers can create categories
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers can create categories"
        )
    
    # Check if category name already exists
    existing = db.query(Category).filter(Category.name == category_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_data.name}' already exists"
        )
    
    # Create category
    new_category = Category(
        name=category_data.name,
        description=category_data.description,
        created_by_user_id=current_user.id
    )
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created category",
        module="categories",
        target_id=new_category.id,
        details=f"Category: {new_category.name}"
    )
    
    return new_category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a category (Manager-only)
    """
    # Only Managers can update categories
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers can update categories"
        )
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Update fields
    if category_data.name:
        # Check if new name conflicts
        existing = db.query(Category).filter(
            Category.name == category_data.name,
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{category_data.name}' already exists"
            )
        category.name = category_data.name
    
    if category_data.description is not None:
        category.description = category_data.description
    
    db.commit()
    db.refresh(category)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"updated category",
        module="categories",
        target_id=category.id,
        details=f"Category: {category.name}"
    )
    
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a category (Manager-only)
    WARNING: Cannot delete if phones are assigned to this category
    """
    # Only Managers can delete categories
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers can delete categories"
        )
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if any phones use this category
    from app.models.phone import Phone
    phones_count = db.query(Phone).filter(Phone.category_id == category_id).count()
    if phones_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category: {phones_count} phone(s) are assigned to it"
        )
    
    category_name = category.name
    db.delete(category)
    db.commit()
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"deleted category",
        module="categories",
        target_id=category_id,
        details=f"Category: {category_name}"
    )
    
    return {
        "message": f"Category '{category_name}' deleted successfully",
        "deleted_category_id": category_id
    }

