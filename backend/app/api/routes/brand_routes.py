"""
Brand Management Routes - CRUD operations for phone brands
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_manager
from app.core.activity_logger import log_activity
from app.models.brand import Brand
from app.models.user import User
from app.schemas.brand import BrandCreate, BrandUpdate, BrandResponse

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("/", response_model=List[BrandResponse])
def get_all_brands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all brands
    Available to all authenticated users
    """
    brands = db.query(Brand).order_by(Brand.name).all()
    return brands


@router.get("/{brand_id}", response_model=BrandResponse)
def get_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific brand by ID"""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with ID {brand_id} not found"
        )
    
    return brand


@router.post("/", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def create_brand(
    brand_data: BrandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new brand
    Manager only
    """
    # Check permission
    require_manager(current_user)
    
    # Check if brand already exists
    existing = db.query(Brand).filter(Brand.name == brand_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand '{brand_data.name}' already exists"
        )
    
    # Create brand
    brand = Brand(
        name=brand_data.name,
        description=brand_data.description,
        logo_url=brand_data.logo_url,
        created_by_user_id=current_user.id
    )
    
    db.add(brand)
    db.commit()
    db.refresh(brand)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created brand",
        module="brands",
        target_id=brand.id,
        details=f"Brand: {brand.name}"
    )
    
    return brand


@router.put("/{brand_id}", response_model=BrandResponse)
def update_brand(
    brand_id: int,
    brand_data: BrandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a brand
    Manager only
    """
    # Check permission
    require_manager(current_user)
    
    # Get brand
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with ID {brand_id} not found"
        )
    
    # Check for name conflicts
    if brand_data.name and brand_data.name != brand.name:
        existing = db.query(Brand).filter(Brand.name == brand_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Brand '{brand_data.name}' already exists"
            )
    
    # Update fields
    if brand_data.name is not None:
        brand.name = brand_data.name
    if brand_data.description is not None:
        brand.description = brand_data.description
    if brand_data.logo_url is not None:
        brand.logo_url = brand_data.logo_url
    
    db.commit()
    db.refresh(brand)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"updated brand",
        module="brands",
        target_id=brand.id,
        details=f"Brand: {brand.name}"
    )
    
    return brand


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a brand
    Manager only
    """
    # Check permission
    require_manager(current_user)
    
    # Get brand
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with ID {brand_id} not found"
        )
    
    # Check if brand is in use (has phones)
    from app.models.phone import Phone
    phones_count = db.query(Phone).filter(Phone.brand_id == brand_id).count()
    
    if phones_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete brand '{brand.name}'. It has {phones_count} phone(s) associated with it."
        )
    
    brand_name = brand.name
    db.delete(brand)
    db.commit()
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"deleted brand",
        module="brands",
        target_id=brand_id,
        details=f"Brand: {brand_name}"
    )
    
    return None

