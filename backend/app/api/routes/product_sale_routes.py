"""
Product Sale API Routes
Handles selling products (earbuds, chargers, batteries, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_shopkeeper
from app.models.product_sale import ProductSale
from app.models.product import Product, StockMovement
from app.models.customer import Customer
from app.models.user import User
from app.schemas.product_sale import ProductSaleCreate, ProductSaleResponse, ProductSaleSummary
from app.core.sms import get_sms_service
from app.core.activity_logger import log_activity

router = APIRouter(prefix="/product-sales", tags=["Product Sales"])


def send_product_sale_sms_background(
    sale_id: int,
    customer_phone: str,
    customer_name: str,
    product_name: str,
    product_brand: str,
    quantity: int,
    unit_price: float,
    discount_amount: float,
    total_amount: float,
    company_name: str
):
    """Background task to send SMS receipt after sale is recorded"""
    try:
        from app.core.database import SessionLocal
        
        sms_service = get_sms_service()
        
        # Create SMS receipt message with company branding
        message = f"Hi {customer_name},\n\n"
        message += f"Thank you for your purchase from {company_name}!\n\n"
        message += f"Receipt\n"
        message += f"Product: {product_name}\n"
        if product_brand:
            message += f"Brand: {product_brand}\n"
        message += f"Qty: {quantity} x GHS{unit_price:.2f}\n"
        
        if discount_amount > 0:
            message += f"Discount: -GHS{discount_amount:.2f}\n"
        
        message += f"Total: GHS{total_amount:.2f}\n\n"
        message += f"{company_name} appreciates your business!"
        
        # Send SMS using the internal method
        result = sms_service._send_sms(
            phone_number=customer_phone,
            message=message,
            company_name=company_name
        )
        
        # Update SMS status in database
        if result.get("success"):
            db = SessionLocal()
            try:
                db_sale = db.query(ProductSale).filter(ProductSale.id == sale_id).first()
                if db_sale:
                    db_sale.sms_sent = 1
                    db.commit()
                print(f"✅ SMS sent successfully to {customer_phone}")
            finally:
                db.close()
        else:
            print(f"⚠️ SMS failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Failed to send SMS receipt in background: {e}")


@router.post("/", response_model=ProductSaleResponse, status_code=status.HTTP_201_CREATED)
def create_product_sale(
    sale: ProductSaleCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a product sale (Shopkeeper ONLY)
    Automatically reduces product stock and sends SMS receipt in background
    """
    # Only shopkeepers can record sales
    require_shopkeeper(current_user)
    
    # Verify customer exists (if not walk-in)
    customer = None
    if sale.customer_id:
        customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {sale.customer_id} not found"
            )
    
    # Verify product exists and is available
    product = db.query(Product).filter(
        Product.id == sale.product_id,
        Product.is_active == True
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {sale.product_id} not found or inactive"
        )
    
    # Check stock availability
    if product.quantity < sale.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {product.quantity}, Requested: {sale.quantity}"
        )
    
    # Calculate total amount
    total_amount = (sale.unit_price * sale.quantity) - sale.discount_amount
    
    if total_amount < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total amount cannot be negative"
        )
    
    # Create product sale record
    db_sale = ProductSale(
        customer_id=sale.customer_id,
        product_id=sale.product_id,
        quantity=sale.quantity,
        unit_price=sale.unit_price,
        discount_amount=sale.discount_amount,
        total_amount=total_amount,
        customer_phone=sale.customer_phone,
        customer_email=sale.customer_email,
        created_by_user_id=current_user.id
    )
    
    db.add(db_sale)
    
    # Reduce product stock
    try:
        product.reduce_stock(sale.quantity)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Log stock movement
    stock_movement = StockMovement(
        product_id=product.id,
        movement_type="sale",
        quantity=-sale.quantity,  # Negative for sale
        unit_price=sale.unit_price,
        total_amount=total_amount,
        reference_type="product_sale",
        reference_id=db_sale.id,
        notes=f"Product sale to {customer.full_name if customer else 'Walk-in customer'}",
        created_by_user_id=current_user.id
    )
    db.add(stock_movement)
    
    # Commit changes
    db.commit()
    db.refresh(db_sale)
    
    # Get company name using dynamic branding helper
    from app.core.sms import get_sms_sender_name
    
    manager_id = None
    if current_user.parent_user_id:
        manager_id = current_user.parent_user_id
    elif current_user.is_manager:
        manager_id = current_user.id
    
    company_name = get_sms_sender_name(manager_id, "SwapSync")
    
    # Get customer name
    customer_name = customer.full_name if customer else "Customer"
    
    # Schedule SMS sending in background (non-blocking)
    background_tasks.add_task(
        send_product_sale_sms_background,
        sale_id=db_sale.id,
        customer_phone=sale.customer_phone,
        customer_name=customer_name,
        product_name=product.name,
        product_brand=product.brand,
        quantity=sale.quantity,
        unit_price=sale.unit_price,
        discount_amount=sale.discount_amount,
        total_amount=total_amount,
        company_name=company_name
    )
    
    # Log activity
    customer_name = customer.full_name if customer else "Walk-in customer"
    log_activity(
        db=db,
        user=current_user,
        action="product_sale_created",
        module="sales",
        target_id=db_sale.id,
        details=f"Sold {sale.quantity}x {product.name} to {customer_name} for ₵{total_amount:.2f}"
    )
    
    return db_sale


@router.get("/", response_model=List[ProductSaleResponse])
def list_product_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=5000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all product sales (Manager and Shopkeeper can view)
    Only shows sales for active products (excludes deleted products)
    """
    sales = db.query(ProductSale).join(
        Product, ProductSale.product_id == Product.id
    ).filter(
        Product.is_active == True
    ).order_by(
        ProductSale.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return sales


@router.get("/summary", response_model=ProductSaleSummary)
def get_product_sales_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get product sales summary statistics
    Only includes sales for active products (excludes deleted products)
    """
    sales = db.query(ProductSale).join(
        Product, ProductSale.product_id == Product.id
    ).filter(
        Product.is_active == True
    ).all()
    
    total_sales = len(sales)
    total_revenue = sum(s.total_amount for s in sales)
    total_profit = sum(s.profit for s in sales)
    
    # Sales by product
    sales_by_product = {}
    for sale in sales:
        product_name = f"Product#{sale.product_id}"
        if sale.product:
            product_name = sale.product.name
        
        if product_name not in sales_by_product:
            sales_by_product[product_name] = 0
        sales_by_product[product_name] += sale.quantity
    
    # Sales by date
    sales_by_date = {}
    for sale in sales:
        date_str = sale.created_at.strftime("%Y-%m-%d")
        if date_str not in sales_by_date:
            sales_by_date[date_str] = 0
        sales_by_date[date_str] += sale.total_amount
    
    return ProductSaleSummary(
        total_sales=total_sales,
        total_revenue=total_revenue,
        total_profit=total_profit,
        sales_by_product=sales_by_product,
        sales_by_date=sales_by_date
    )


@router.get("/{sale_id}", response_model=ProductSaleResponse)
def get_product_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific product sale by ID
    """
    sale = db.query(ProductSale).filter(ProductSale.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product sale with ID {sale_id} not found"
        )
    
    return sale


@router.post("/{sale_id}/resend-sms")
def resend_sms_receipt(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resend SMS receipt for a product sale
    """
    sale = db.query(ProductSale).filter(ProductSale.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product sale with ID {sale_id} not found"
        )
    
    if not sale.customer_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No customer phone number available"
        )
    
    # Get product and customer
    product = db.query(Product).filter(Product.id == sale.product_id).first()
    customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
    
    if not product or not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product or customer not found"
        )
    
    # Send SMS
    try:
        from app.core.sms import get_sms_sender_name
        sms_service = get_sms_service()
        
        # Get manager for SMS branding
        manager_id = None
        company_name = "SwapSync"
        
        if sale.created_by_user_id:
            created_by = db.query(User).filter(User.id == sale.created_by_user_id).first()
            if created_by:
                if created_by.parent_user_id:
                    # Staff member - get their manager
                    manager = db.query(User).filter(User.id == created_by.parent_user_id).first()
                    if manager:
                        manager_id = manager.id
                        company_name = manager.company_name or "SwapSync"
                elif created_by.role.value in ['manager', 'ceo']:
                    # Manager directly
                    manager_id = created_by.id
                    company_name = created_by.company_name or "SwapSync"
        
        # Determine SMS sender using helper function
        sms_sender = get_sms_sender_name(manager_id, company_name)
        
        receipt_message = f"""
{sms_sender} - Purchase Receipt

Product: {product.name}
{f'Brand: {product.brand}' if product.brand else ''}
Quantity: {sale.quantity}
Unit Price: ₵{sale.unit_price:.2f}
Discount: ₵{sale.discount_amount:.2f}
Total: ₵{sale.total_amount:.2f}

Thank you for your purchase!
        """.strip()
        
        result = sms_service.send_sms(
            phone_number=sale.customer_phone,
            message=receipt_message,
            company_name=sms_sender
        )
        
        success = result.get('success', False)
        
        if success:
            sale.sms_sent = 1
            db.commit()
            return {"message": "SMS receipt sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send SMS"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send SMS: {str(e)}"
        )

