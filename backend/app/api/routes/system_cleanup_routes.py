"""
System Cleanup Routes (Super Admin Only)
Allows selective or bulk deletion of system data
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.models.user import User
from app.models.phone import Phone
from app.models.product import Product
from app.models.customer import Customer
from app.models.swap import Swap
from app.models.sale import Sale
from app.models.repair import Repair
from app.models.product_sale import ProductSale
from app.core.permissions import require_role

router = APIRouter(prefix="/system-cleanup", tags=["System Cleanup"])


class DataDeletionRequest(BaseModel):
    delete_phones: bool = False
    delete_products: bool = False
    delete_customers: bool = False
    delete_swaps: bool = False
    delete_sales: bool = False
    delete_repairs: bool = False
    delete_product_sales: bool = False
    delete_all: bool = False  # Delete everything
    confirm_password: str  # Require password confirmation


@router.post("/delete-data")
async def delete_system_data(
    request: DataDeletionRequest,
    current_user: User = Depends(require_role(['super_admin'])),
    db: Session = Depends(get_db)
):
    """
    Delete selected system data (Super Admin only)
    Protects admin accounts from deletion
    """
    # Verify password confirmation
    if not current_user.verify_password(request.confirm_password):
        raise HTTPException(status_code=400, detail="Incorrect password. Data deletion cancelled.")
    
    try:
        deleted_counts = {}
        
        # Delete phones
        if request.delete_all or request.delete_phones:
            count = db.query(Phone).delete()
            deleted_counts['phones'] = count
        
        # Delete products
        if request.delete_all or request.delete_products:
            count = db.query(Product).delete()
            deleted_counts['products'] = count
        
        # Delete customers
        if request.delete_all or request.delete_customers:
            count = db.query(Customer).delete()
            deleted_counts['customers'] = count
        
        # Delete swaps
        if request.delete_all or request.delete_swaps:
            count = db.query(Swap).delete()
            deleted_counts['swaps'] = count
        
        # Delete sales
        if request.delete_all or request.delete_sales:
            count = db.query(Sale).delete()
            deleted_counts['sales'] = count
        
        # Delete repairs
        if request.delete_all or request.delete_repairs:
            count = db.query(Repair).delete()
            deleted_counts['repairs'] = count
        
        # Delete product sales
        if request.delete_all or request.delete_product_sales:
            count = db.query(ProductSale).delete()
            deleted_counts['product_sales'] = count
        
        db.commit()
        
        return {
            'success': True,
            'message': 'Data deleted successfully',
            'deleted': deleted_counts,
            'total_deleted': sum(deleted_counts.values())
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete data: {str(e)}")


@router.get("/data-counts")
async def get_data_counts(
    current_user: User = Depends(require_role(['super_admin'])),
    db: Session = Depends(get_db)
):
    """Get counts of all deletable data types"""
    return {
        'phones': db.query(Phone).count(),
        'products': db.query(Product).count(),
        'customers': db.query(Customer).count(),
        'swaps': db.query(Swap).count(),
        'sales': db.query(Sale).count(),
        'repairs': db.query(Repair).count(),
        'product_sales': db.query(ProductSale).count(),
        'total_users': db.query(User).count(),
        'admin_users': db.query(User).filter(User.role.in_(['admin', 'super_admin'])).count()
    }


@router.post("/reset-sequences")
async def reset_auto_increment_sequences(
    current_user: User = Depends(require_role(['super_admin'])),
    db: Session = Depends(get_db)
):
    """Reset auto-increment sequences after bulk deletion (SQLite specific)"""
    try:
        # For SQLite, we can reset the sequence by deleting from sqlite_sequence
        db.execute("DELETE FROM sqlite_sequence WHERE name IN ('phones', 'products', 'customers', 'swaps', 'sales', 'repairs', 'product_sales')")
        db.commit()
        return {'success': True, 'message': 'Auto-increment sequences reset'}
    except Exception as e:
        db.rollback()
        return {'success': False, 'message': f'Failed to reset sequences: {str(e)}'}

