"""
POS Sale API Routes - Point of Sale system for multi-item transactions
Handles selling multiple products in a single transaction
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_shopkeeper
from app.models.pos_sale import POSSale, POSSaleItem
from app.models.product_sale import ProductSale
from app.models.product import Product, StockMovement
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.schemas.pos_sale import POSSaleCreate, POSSaleResponse, POSItemResponse, POSSaleSummary
from app.core.sms import get_sms_service, get_sms_sender_name
from app.core.activity_logger import log_activity

router = APIRouter(prefix="/pos-sales", tags=["POS Sales"])


def send_pos_receipt_sms_background(
    pos_sale_id: int,
    customer_phone: str,
    customer_name: str,
    transaction_id: str,
    items: list,
    subtotal: float,
    overall_discount: float,
    total_amount: float,
    company_name: str
):
    """Background task to send POS receipt SMS"""
    try:
        from app.core.database import SessionLocal
        
        sms_service = get_sms_service()
        
        # Create POS receipt message (thermal printer style)
        message = f"{company_name}\n"
        message += f"━━━━━━━━━━━━━━━━━━━━\n"
        message += f"RECEIPT #{transaction_id}\n"
        message += f"━━━━━━━━━━━━━━━━━━━━\n\n"
        message += f"Customer: {customer_name}\n"
        message += f"Date: {datetime.now().strftime('%d/%m/%Y %I:%M %p')}\n\n"
        
        # Items list
        for idx, item in enumerate(items, 1):
            message += f"{idx}. {item['name']}\n"
            message += f"   {item['qty']} x GHS{item['price']:.2f}"
            if item['discount'] > 0:
                message += f" (-{item['discount']:.2f})"
            message += f"\n   = GHS{item['subtotal']:.2f}\n"
        
        message += f"\n━━━━━━━━━━━━━━━━━━━━\n"
        message += f"Subtotal: GHS{subtotal:.2f}\n"
        
        if overall_discount > 0:
            message += f"Discount: -GHS{overall_discount:.2f}\n"
        
        message += f"TOTAL: GHS{total_amount:.2f}\n"
        message += f"━━━━━━━━━━━━━━━━━━━━\n\n"
        message += f"Thank you for shopping!\n{company_name}"
        
        # Send SMS
        result = sms_service._send_sms(
            phone_number=customer_phone,
            message=message,
            company_name=company_name
        )
        
        # Update SMS status
        if result.get("success"):
            db = SessionLocal()
            try:
                db_pos_sale = db.query(POSSale).filter(POSSale.id == pos_sale_id).first()
                if db_pos_sale:
                    db_pos_sale.sms_sent = 1
                    db.commit()
                print(f"✅ POS Receipt SMS sent to {customer_phone}")
            finally:
                db.close()
        else:
            print(f"⚠️ POS SMS failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Failed to send POS receipt SMS: {e}")


@router.post("/", response_model=POSSaleResponse, status_code=status.HTTP_201_CREATED)
def create_pos_sale(
    sale: POSSaleCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a POS sale with multiple items in one transaction
    Automatically reduces stock for all items and sends receipt
    """
    # Only shopkeepers can record sales
    require_shopkeeper(current_user)
    
    # Verify customer if provided, or create/get walk-in customer
    customer = None
    actual_customer_id = sale.customer_id
    
    if not actual_customer_id:
        # Create or get the default "Walk-In Customer" for sales without customer records
        try:
            # First, try to find existing walk-in customer
            walk_in_customer = db.query(Customer).filter(
                Customer.full_name == "Walk-In Customer"
            ).first()
            
            if not walk_in_customer:
                print("📝 Creating Walk-In Customer record...")
                # Create the walk-in customer record
                walk_in_customer = Customer(
                    full_name="Walk-In Customer",
                    phone_number="0000000000",
                    email=None
                )
                db.add(walk_in_customer)
                db.flush()  # Get the ID
                
                # Generate unique ID
                try:
                    walk_in_customer.generate_unique_id(db)
                    db.flush()
                except Exception as e:
                    print(f"⚠️ Could not generate unique_id: {e}")
                    # Continue anyway, unique_id is nullable
                
                print(f"✅ Walk-In Customer created with ID: {walk_in_customer.id}")
            
            actual_customer_id = walk_in_customer.id
            customer = walk_in_customer
            
        except Exception as e:
            print(f"❌ Error creating/getting Walk-In Customer: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create walk-in customer: {str(e)}"
            )
    else:
        customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {sale.customer_id} not found"
            )
    
    # Validate all products and check stock
    products_data = []
    subtotal = 0.0
    
    for item in sale.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_active == True
        ).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found or inactive"
            )
        
        # Check stock
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}"
            )
        
        # Calculate item subtotal
        item_subtotal = (item.unit_price * item.quantity) - item.discount_amount
        
        if item_subtotal < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item subtotal cannot be negative for product '{product.name}'"
            )
        
        subtotal += item_subtotal
        
        products_data.append({
            'product': product,
            'item': item,
            'item_subtotal': item_subtotal
        })
    
    # Calculate total amount
    total_amount = subtotal - sale.overall_discount
    
    if total_amount < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total amount cannot be negative after discount"
        )
    
    # Generate transaction ID
    transaction_id = POSSale.generate_transaction_id(db)
    
    # Create POS sale record
    db_pos_sale = POSSale(
        transaction_id=transaction_id,
        customer_id=actual_customer_id,  # Use actual_customer_id instead of sale.customer_id
        customer_name=sale.customer_name,
        customer_phone=sale.customer_phone,
        customer_email=sale.customer_email,
        subtotal=subtotal,
        overall_discount=sale.overall_discount,
        total_amount=total_amount,
        payment_method=sale.payment_method,
        items_count=len(sale.items),
        total_quantity=sum(item.quantity for item in sale.items),
        notes=sale.notes,
        created_by_user_id=current_user.id
    )
    
    db.add(db_pos_sale)
    db.flush()  # Get the ID without committing
    
    # Create individual product sales and POS sale items
    sms_items = []
    
    for data in products_data:
        product = data['product']
        item = data['item']
        item_subtotal = data['item_subtotal']
        
        # Create product sale record
        db_product_sale = ProductSale(
            customer_id=actual_customer_id,  # Use actual_customer_id instead of sale.customer_id
            product_id=product.id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_amount=item.discount_amount,
            total_amount=item_subtotal,
            customer_phone=sale.customer_phone,
            customer_email=sale.customer_email,
            created_by_user_id=current_user.id
        )
        db.add(db_product_sale)
        db.flush()  # Get product_sale ID
        
        # Create POS sale item
        db_pos_item = POSSaleItem(
            pos_sale_id=db_pos_sale.id,
            product_sale_id=db_product_sale.id,
            product_id=product.id,
            product_name=product.name,
            product_brand=product.brand,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_amount=item.discount_amount,
            subtotal=item_subtotal
        )
        db.add(db_pos_item)
        
        # Reduce stock
        try:
            product.reduce_stock(item.quantity)
        except ValueError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock error for '{product.name}': {str(e)}"
            )
        
        # Log stock movement
        stock_movement = StockMovement(
            product_id=product.id,
            movement_type="sale",
            quantity=-item.quantity,
            unit_price=item.unit_price,
            total_amount=item_subtotal,
            reference_type="pos_sale",
            reference_id=db_pos_sale.id,
            notes=f"POS Sale {transaction_id}",
            created_by_user_id=current_user.id
        )
        db.add(stock_movement)
        
        # Prepare for SMS
        sms_items.append({
            'name': product.name,
            'qty': item.quantity,
            'price': item.unit_price,
            'discount': item.discount_amount,
            'subtotal': item_subtotal
        })
    
    # Commit all changes
    db.commit()
    db.refresh(db_pos_sale)
    
    # Get company name for SMS
    manager_id = None
    if current_user.parent_user_id:
        manager_id = current_user.parent_user_id
    elif current_user.is_manager:
        manager_id = current_user.id
    
    company_name = get_sms_sender_name(manager_id, "SwapSync")
    
    # Schedule SMS receipt in background
    background_tasks.add_task(
        send_pos_receipt_sms_background,
        pos_sale_id=db_pos_sale.id,
        customer_phone=sale.customer_phone,
        customer_name=sale.customer_name,
        transaction_id=transaction_id,
        items=sms_items,
        subtotal=subtotal,
        overall_discount=sale.overall_discount,
        total_amount=total_amount,
        company_name=company_name
    )
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action="pos_sale_created",
        module="pos_sales",
        target_id=db_pos_sale.id,
        details=f"POS Sale {transaction_id}: {len(sale.items)} items, Total: ₵{total_amount:.2f}"
    )
    
    return db_pos_sale


@router.get("/", response_model=List[POSSaleResponse])
def list_pos_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: str = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(None, description="End date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List POS sales
    - Shop keepers see only their own sales
    - Managers/CEOs see all sales
    """
    # Allow shop keepers, managers, and admins
    allowed_roles = [UserRole.SHOP_KEEPER, UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your role ({current_user.role.value}) cannot view POS sales."
        )
    
    # Start with base query
    query = db.query(POSSale).order_by(POSSale.created_at.desc())
    
    # Shop keepers only see their own sales
    if current_user.role == UserRole.SHOP_KEEPER:
        query = query.filter(POSSale.created_by_user_id == current_user.id)
    
    # Date filtering FIRST (before product check)
    if start_date:
        try:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(POSSale.created_at >= start_datetime)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )
    
    if end_date:
        try:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
            # Add one day to include the entire end date
            end_datetime = end_datetime.replace(hour=23, minute=59, second=59)
            query = query.filter(POSSale.created_at <= end_datetime)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )
    
    sales = query.offset(skip).limit(limit).all()
    
    return sales


@router.get("/summary", response_model=POSSaleSummary)
def get_pos_sales_summary(
    start_date: str = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(None, description="End date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get POS sales summary statistics with optional date filtering
    - Shop keepers see only their own sales summary
    - Managers/CEOs see all sales summary
    - Date filters allow real-time data viewing
    """
    # Allow shop keepers, managers, and admins
    allowed_roles = [UserRole.SHOP_KEEPER, UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your role ({current_user.role.value}) cannot view POS summary."
        )
    
    # Get POS sales with date filtering
    query = db.query(POSSale)
    
    # Shop keepers only see their own sales
    if current_user.role == UserRole.SHOP_KEEPER:
        query = query.filter(POSSale.created_by_user_id == current_user.id)
    
    # Apply date filters
    if start_date:
        try:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(POSSale.created_at >= start_datetime)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )
    
    if end_date:
        try:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
            # Add one day to include the entire end date
            end_datetime = end_datetime.replace(hour=23, minute=59, second=59)
            query = query.filter(POSSale.created_at <= end_datetime)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )
    
    sales = query.all()
    
    total_transactions = len(sales)
    total_revenue = sum(s.total_amount for s in sales)
    total_profit = sum(s.profit for s in sales)
    total_items_sold = sum(s.total_quantity for s in sales)
    
    average_transaction_value = total_revenue / total_transactions if total_transactions > 0 else 0
    
    # Sales by payment method
    sales_by_payment_method = {}
    for sale in sales:
        method = sale.payment_method
        if method not in sales_by_payment_method:
            sales_by_payment_method[method] = 0
        sales_by_payment_method[method] += sale.total_amount
    
    # Top selling products
    product_sales = {}
    for sale in sales:
        for item in sale.items:
            product_name = item.product_name
            if product_name not in product_sales:
                product_sales[product_name] = 0
            product_sales[product_name] += item.quantity
    
    top_selling_products = [
        {"product": name, "quantity": qty}
        for name, qty in sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    return POSSaleSummary(
        total_transactions=total_transactions,
        total_revenue=total_revenue,
        total_profit=total_profit,
        total_items_sold=total_items_sold,
        average_transaction_value=average_transaction_value,
        sales_by_payment_method=sales_by_payment_method,
        top_selling_products=top_selling_products
    )


@router.get("/{sale_id}", response_model=POSSaleResponse)
def get_pos_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific POS sale by ID
    - Shop keepers can only view their own sales
    - Managers/CEOs can view all sales
    """
    # Allow shop keepers, managers, and admins
    allowed_roles = [UserRole.SHOP_KEEPER, UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your role ({current_user.role.value}) cannot view POS sales."
        )
    
    query = db.query(POSSale).filter(POSSale.id == sale_id)
    
    # Shop keepers can only view their own sales
    if current_user.role == UserRole.SHOP_KEEPER:
        query = query.filter(POSSale.created_by_user_id == current_user.id)
    
    sale = query.first()
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"POS sale with ID {sale_id} not found or you don't have access"
        )
    
    return sale


@router.post("/{sale_id}/resend-receipt")
def resend_pos_receipt(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resend SMS receipt for a POS sale
    - Shop keepers can only resend their own sales
    - Managers/CEOs can resend any sale
    """
    # Allow shop keepers, managers, and admins
    allowed_roles = [UserRole.SHOP_KEEPER, UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your role ({current_user.role.value}) cannot resend receipts."
        )
    
    query = db.query(POSSale).filter(POSSale.id == sale_id)
    
    # Shop keepers can only resend their own sales
    if current_user.role == UserRole.SHOP_KEEPER:
        query = query.filter(POSSale.created_by_user_id == current_user.id)
    
    sale = query.first()
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"POS sale with ID {sale_id} not found or you don't have access"
        )
    
    # Prepare items for SMS
    sms_items = []
    for item in sale.items:
        sms_items.append({
            'name': item.product_name,
            'qty': item.quantity,
            'price': item.unit_price,
            'discount': item.discount_amount,
            'subtotal': item.subtotal
        })
    
    # Get company name
    manager_id = None
    if sale.created_by_user_id:
        created_by = db.query(User).filter(User.id == sale.created_by_user_id).first()
        if created_by:
            if created_by.parent_user_id:
                manager_id = created_by.parent_user_id
            elif created_by.role.value in ['manager', 'ceo']:
                manager_id = created_by.id
    
    company_name = get_sms_sender_name(manager_id, "SwapSync")
    
    # Send SMS synchronously
    try:
        sms_service = get_sms_service()
        
        message = f"{company_name}\n"
        message += f"━━━━━━━━━━━━━━━━━━━━\n"
        message += f"RECEIPT #{sale.transaction_id}\n"
        message += f"━━━━━━━━━━━━━━━━━━━━\n\n"
        
        for idx, item in enumerate(sms_items, 1):
            message += f"{idx}. {item['name']}\n"
            message += f"   {item['qty']} x GHS{item['price']:.2f} = GHS{item['subtotal']:.2f}\n"
        
        message += f"\n━━━━━━━━━━━━━━━━━━━━\n"
        message += f"Subtotal: GHS{sale.subtotal:.2f}\n"
        
        if sale.overall_discount > 0:
            message += f"Discount: -GHS{sale.overall_discount:.2f}\n"
        
        message += f"TOTAL: GHS{sale.total_amount:.2f}\n"
        message += f"━━━━━━━━━━━━━━━━━━━━\n"
        message += f"\nThank you!\n{company_name}"
        
        result = sms_service._send_sms(
            phone_number=sale.customer_phone,
            message=message,
            company_name=company_name
        )
        
        if result.get("success"):
            sale.sms_sent = 1
            db.commit()
            return {"message": "POS receipt SMS sent successfully"}
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

