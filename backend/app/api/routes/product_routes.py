"""
Product Management API Routes
Handles all inventory/product operations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_manager, can_record_sales, is_manager_or_above
from app.core.activity_logger import log_activity
from app.core.company_filter import get_company_user_ids
from app.models.product import Product, StockMovement
from app.models.user import User, UserRole
from app.models.category import Category
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    StockAdjustment, StockMovementCreate, StockMovementResponse,
    ProductSearchFilters, ProductSummary
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new product (Manager ONLY)
    """
    # Only managers can create products
    require_manager(current_user)
    
    # Verify category exists
    category = db.query(Category).filter(Category.id == product.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {product.category_id} not found"
        )
    
    # Check for duplicate SKU if provided
    if product.sku:
        existing = db.query(Product).filter(Product.sku == product.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{product.sku}' already exists"
            )
    
    # Check for duplicate barcode if provided
    if product.barcode:
        existing = db.query(Product).filter(Product.barcode == product.barcode).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with barcode '{product.barcode}' already exists"
            )
    
    # Check for duplicate IMEI if provided (for phones)
    if product.imei:
        existing = db.query(Product).filter(Product.imei == product.imei).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with IMEI '{product.imei}' already exists"
            )
    
    # Create product
    db_product = Product(
        **product.model_dump(),
        created_by_user_id=current_user.id,
        is_available=(product.quantity > 0)
    )
    
    db.add(db_product)
    db.flush()
    
    # Generate unique ID
    db_product.generate_unique_id(db)
    db.commit()
    db.refresh(db_product)
    
    # Log initial stock if quantity > 0
    if product.quantity > 0:
        stock_movement = StockMovement(
            product_id=db_product.id,
            movement_type="purchase",
            quantity=product.quantity,
            unit_price=product.cost_price,
            total_amount=product.cost_price * product.quantity,
            notes="Initial stock",
            created_by_user_id=current_user.id
        )
        db.add(stock_movement)
        db.commit()
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created product",
        module="products",
        target_id=db_product.id,
        details=f"{db_product.name} - SKU: {db_product.sku}, Qty: {db_product.quantity}"
    )
    
    return db_product


@router.get("/", response_model=List[ProductResponse])
def list_products(
    category_id: Optional[int] = Query(None, description="Filter by category"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    in_stock_only: bool = Query(True, description="Show only in-stock products"),
    search: Optional[str] = Query(None, description="Search by name, SKU, or brand"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=5000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all products with filters (Manager and Shopkeeper can view)
    Accessible by: Manager, CEO, Shopkeeper, Repairer (for inventory viewing)
    Data isolation: Each company only sees their own products
    """
    # Allow shop keepers, managers, and repairers to view products
    allowed_roles = [UserRole.MANAGER, UserRole.CEO, UserRole.SHOP_KEEPER, UserRole.REPAIRER, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your role ({current_user.role.value}) cannot view products."
        )
    
    # Build query with company filtering
    query = db.query(Product).filter(Product.is_active == True)
    
    # Filter by company (data isolation)
    company_user_ids = get_company_user_ids(db, current_user)
    if company_user_ids is not None:
        query = query.filter(Product.created_by_user_id.in_(company_user_ids))
    
    # Apply filters
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    
    if in_stock_only:
        query = query.filter(Product.quantity > 0)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.sku.ilike(search_pattern),
                Product.brand.ilike(search_pattern),
                Product.barcode.ilike(search_pattern)
            )
        )
    
    # Order by name
    query = query.order_by(Product.name)
    
    # Paginate
    products = query.offset(skip).limit(limit).all()
    
    return products


@router.get("/summary", response_model=ProductSummary)
def get_product_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get product inventory summary statistics (Manager and Shopkeeper)
    """
    # Total products
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar()
    
    # Total inventory value (cost price * quantity)
    products = db.query(Product).filter(Product.is_active == True).all()
    total_value = sum(p.cost_price * p.quantity for p in products)
    total_selling_value = sum(p.selling_price * p.quantity for p in products)
    
    # Low stock and out of stock counts
    low_stock_count = sum(1 for p in products if p.is_low_stock and not p.is_out_of_stock)
    out_of_stock_count = sum(1 for p in products if p.is_out_of_stock)
    
    # Count by category
    by_category = {}
    category_counts = db.query(
        Category.name, func.count(Product.id)
    ).join(Product).filter(Product.is_active == True).group_by(Category.name).all()
    
    for cat_name, count in category_counts:
        by_category[cat_name] = count
    
    return ProductSummary(
        total_products=total_products,
        total_value=total_value,
        total_selling_value=total_selling_value,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        by_category=by_category
    )


@router.get("/low-stock", response_model=List[ProductResponse])
def get_low_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all low stock products for alerts
    """
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.quantity > 0,
        Product.quantity <= Product.min_stock_level
    ).all()
    
    return products


@router.get("/out-of-stock", response_model=List[ProductResponse])
def get_out_of_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all out of stock products for alerts
    """
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.quantity == 0
    ).all()
    
    return products


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific product by ID
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a product (Manager ONLY)
    """
    # Only managers can update products
    require_manager(current_user)
    
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Update fields
    update_data = product_update.model_dump(exclude_unset=True)
    
    # Check for duplicate SKU if being updated
    if "sku" in update_data and update_data["sku"]:
        existing = db.query(Product).filter(
            Product.sku == update_data["sku"],
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another product with SKU '{update_data['sku']}' already exists"
            )
    
    # Check for duplicate barcode if being updated
    if "barcode" in update_data and update_data["barcode"]:
        existing = db.query(Product).filter(
            Product.barcode == update_data["barcode"],
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another product with barcode '{update_data['barcode']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    product.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(product)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"updated product",
        module="products",
        target_id=product.id,
        details=f"{product.name} - SKU: {product.sku}"
    )
    
    return product


@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_stock(
    product_id: int,
    adjustment: StockAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adjust product stock (Manager ONLY)
    Positive quantity = add stock, Negative = remove stock
    """
    # Only managers can adjust stock
    require_manager(current_user)
    
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Adjust stock
    if adjustment.quantity > 0:
        product.add_stock(adjustment.quantity)
        movement_type = "purchase"
    else:
        try:
            product.reduce_stock(abs(adjustment.quantity))
            movement_type = "adjustment"
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    # Log stock movement
    stock_movement = StockMovement(
        product_id=product_id,
        movement_type=movement_type,
        quantity=adjustment.quantity,
        notes=adjustment.notes or "Manual stock adjustment",
        created_by_user_id=current_user.id
    )
    
    db.add(stock_movement)
    db.commit()
    db.refresh(product)
    
    return product


@router.get("/{product_id}/movements", response_model=List[StockMovementResponse])
def get_product_movements(
    product_id: int,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get stock movement history for a product (Manager and Shopkeeper)
    """
    movements = db.query(StockMovement).filter(
        StockMovement.product_id == product_id
    ).order_by(StockMovement.created_at.desc()).limit(limit).all()
    
    return movements


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a product and all related records (Manager ONLY)
    This will permanently delete the product and all its transaction history
    """
    # Only managers can delete products
    require_manager(current_user)
    
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    product_name = product.name
    product_sku = product.sku
    
    # Delete all related records first
    try:
        # Delete ALL POS sales containing this product (complete cascade)
        from app.models.pos_sale import POSSaleItem, POSSale
        
        # Get all POS sales that contain this product
        pos_sales_with_product = db.query(POSSale).join(
            POSSaleItem, POSSale.id == POSSaleItem.pos_sale_id
        ).filter(POSSaleItem.product_id == product_id).all()
        
        affected_sale_ids = [sale.id for sale in pos_sales_with_product]
        
        # Delete ALL items from these sales (not just this product's items)
        if affected_sale_ids:
            db.query(POSSaleItem).filter(POSSaleItem.pos_sale_id.in_(affected_sale_ids)).delete(synchronize_session=False)
        
        # Delete ALL POS sales that contained this product
        if affected_sale_ids:
            db.query(POSSale).filter(POSSale.id.in_(affected_sale_ids)).delete(synchronize_session=False)
        
        # Delete all product sales for this product
        from app.models.product_sale import ProductSale
        db.query(ProductSale).filter(ProductSale.product_id == product_id).delete(synchronize_session=False)
        
        # Delete all stock movements for this product
        from app.models.product import StockMovement
        db.query(StockMovement).filter(StockMovement.product_id == product_id).delete(synchronize_session=False)
        
        # Delete the product itself
        db.delete(product)
        
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action=f"deleted product and all related records",
            module="products",
            target_id=product_id,
            details=f"{product_name} - SKU: {product_sku} | Deleted {len(affected_sale_ids)} POS sales containing this product"
        )
        
        return {
            "message": f"Product '{product_name}' and all related records have been permanently deleted",
            "deleted_sales_count": len(affected_sale_ids)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete product: {str(e)}"
        )


class BulkDeleteRequest(BaseModel):
    product_ids: List[int]


@router.post("/bulk-delete")
def bulk_delete_products(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk delete multiple products
    - Only Managers and above can bulk delete
    - Deletes products and all related records (sales, stock movements)
    """
    # Allow managers, admins, and super admins
    allowed_roles = [UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your role ({current_user.role.value}) cannot bulk delete products."
        )
    
    if not request.product_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No product IDs provided"
        )
    
    if len(request.product_ids) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete more than 100 products at once"
        )
    
    try:
        deleted_products = []
        total_deleted_sales = 0
        
        for product_id in request.product_ids:
            # Get the product
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                continue
                
            product_name = product.name
            product_sku = product.sku or "N/A"
            
            # Find all POS sales containing this product
            affected_sale_ids = []
            pos_sales = db.query(POSSale).all()
            for sale in pos_sales:
                if sale.items:
                    for item in sale.items:
                        if item.get('product_id') == product_id:
                            affected_sale_ids.append(sale.id)
                            break
            
            # Delete related stock movements
            from app.models.product import StockMovement
            db.query(StockMovement).filter(StockMovement.product_id == product_id).delete(synchronize_session=False)
            
            # Delete the product itself
            db.delete(product)
            
            deleted_products.append({
                "id": product_id,
                "name": product_name,
                "sku": product_sku,
                "deleted_sales_count": len(affected_sale_ids)
            })
            total_deleted_sales += len(affected_sale_ids)
        
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action=f"bulk deleted {len(deleted_products)} products",
            module="products",
            target_id=None,
            details=f"Deleted products: {[p['name'] for p in deleted_products]} | Total affected sales: {total_deleted_sales}"
        )
        
        return {
            "message": f"Successfully deleted {len(deleted_products)} products",
            "deleted_products": deleted_products,
            "total_deleted_sales": total_deleted_sales
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk delete products: {str(e)}"
        )

