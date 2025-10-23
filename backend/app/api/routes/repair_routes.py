"""
Repair Tracking API Routes with SMS Notifications
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_manage_repairs
from app.core.activity_logger import log_activity
from app.models.user import User
from app.models.repair import Repair
from app.models.customer import Customer
from app.models.phone import Phone, PhoneStatus, PhoneOwnershipHistory
from app.schemas.repair import RepairCreate, RepairUpdate, RepairResponse
from app.core.sms import get_sms_service, send_repair_created_sms, send_repair_status_update_sms

router = APIRouter(prefix="/repairs", tags=["Repairs"])


def send_repair_completion_sms_background(
    customer_id: int,
    customer_phone: str,
    customer_name: str,
    company_name: str,
    repair_description: str,
    cost: float,
    invoice_number: str = None,
    manager_id: int = None
):
    """Background task to send repair completion SMS with dynamic branding"""
    try:
        from app.core.sms import get_sms_sender_name
        
        # Determine SMS sender using helper function
        sms_sender = get_sms_sender_name(manager_id, company_name)
        
        print(f"📱 Repair completion SMS - Sender: {sms_sender} (Manager ID: {manager_id})")
        
        sms_service = get_sms_service()
        sms_result = sms_service.send_repair_completion_sms(
            phone_number=customer_phone,
            customer_name=customer_name,
            company_name=sms_sender,  # Use determined sender
            repair_description=repair_description,
            cost=cost,
            invoice_number=invoice_number
        )
        
        # Log SMS
        db = SessionLocal()
        try:
            from app.models.sms_log import SMSLog
            sms_log = SMSLog(
                customer_id=customer_id,
                phone_number=customer_phone,
                message=f"Repair completion notification for {company_name}",
                status="sent" if sms_result.get("success") else "failed",
                sent_at=datetime.utcnow() if sms_result.get("success") else None,
                provider=sms_result.get("provider", "unknown"),
                message_id=sms_result.get("message_id")
            )
            db.add(sms_log)
            db.commit()
            
            if sms_result.get("success"):
                print(f"✅ Repair completion SMS sent to {customer_phone}")
            else:
                print(f"⚠️ SMS failed: {sms_result.get('error', 'Unknown error')}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Failed to send repair completion SMS in background: {e}")


@router.post("/", response_model=RepairResponse, status_code=status.HTTP_201_CREATED)
def create_repair(
    repair: RepairCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new repair record (Repairer AND Shopkeeper can book repairs)"""
    from app.core.permissions import can_book_repairs
    
    # Enforce repairer/shopkeeper-only permission (Manager CANNOT book repairs)
    if not can_book_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only repairers and shopkeepers can book repairs. Your role: {current_user.role.value}"
        )
    
    print(f"\n🔧 Creating repair - User: {current_user.username} (Role: {current_user.role.value})")
    print(f"   Customer ID: {repair.customer_id}")
    print(f"   Phone: {repair.phone_description}")
    print(f"   Cost: {repair.cost} (Service: {repair.service_cost}, Items: {repair.items_cost})")
    
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == repair.customer_id).first()
    if not customer:
        print(f"❌ Customer not found: ID {repair.customer_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    print(f"✅ Customer found: {customer.full_name}")
    
    # Extract repair_items before creating repair object
    repair_items_data = repair.repair_items or []
    repair_dict = repair.model_dump(exclude={'repair_items'})
    
    new_repair = Repair(**repair_dict, created_at=datetime.utcnow())
    new_repair.created_by_user_id = current_user.id  # Track who created this repair
    new_repair.staff_id = current_user.id  # Assign to current user (repairer)
    db.add(new_repair)
    db.flush()
    
    print(f"✅ Repair record created in database")
    
    # Process repair items if any
    if repair_items_data:
        from app.models.repair_item import RepairItem
        from app.models.repair_item_usage import RepairItemUsage
        
        for item_data in repair_items_data:
            # Get the repair item
            repair_item = db.query(RepairItem).filter(
                RepairItem.id == item_data.repair_item_id
            ).first()
            
            if not repair_item:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Repair item {item_data.repair_item_id} not found"
                )
            
            # Check stock
            if repair_item.stock_quantity < item_data.quantity:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for {repair_item.name}. Available: {repair_item.stock_quantity}"
                )
            
            # Create usage record
            item_usage = RepairItemUsage(
                repair_id=new_repair.id,
                repair_item_id=repair_item.id,
                quantity=item_data.quantity,
                unit_cost=repair_item.selling_price,
                total_cost=repair_item.selling_price * item_data.quantity
            )
            db.add(item_usage)
            
            # Deduct from stock
            repair_item.stock_quantity -= item_data.quantity
            
            print(f"✅ Added {item_data.quantity}x {repair_item.name} to repair")
    
    # Generate unique ID and tracking code
    new_repair.generate_unique_id(db)
    new_repair.generate_tracking_code()
    db.commit()
    db.refresh(new_repair)
    
    # If phone_id is provided, update phone status to Under Repair
    if repair.phone_id:
        phone = db.query(Phone).filter(Phone.id == repair.phone_id).first()
        if phone:
            phone.status = PhoneStatus.UNDER_REPAIR
            phone.is_available = False
            
            # Update phone ownership to repair shop
            phone.current_owner_id = customer.id
            phone.current_owner_type = "repair"
            
            # Record ownership history
            ownership_change = PhoneOwnershipHistory(
                phone_id=phone.id,
                owner_id=customer.id,
                owner_type="repair",
                change_reason="repair",
                transaction_id=new_repair.id,
                change_date=datetime.utcnow()
            )
            db.add(ownership_change)
    
    db.commit()
    db.refresh(new_repair)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created repair for {customer.full_name}",
        module="repairs",
        target_id=new_repair.id,
        details=f"{new_repair.phone_description} - Cost: GHS {new_repair.cost}"
    )
    
    # Get manager for SMS branding
    manager_id = None
    company_name = "SwapSync"
    if current_user.parent_user_id:
        # User is shopkeeper/repairer under a manager
        manager = db.query(User).filter(User.id == current_user.parent_user_id).first()
        if manager:
            manager_id = manager.id
            company_name = manager.company_name or "SwapSync"
    elif current_user.role.value in ['manager', 'ceo']:
        # User is a manager
        manager_id = current_user.id
        company_name = current_user.company_name or "SwapSync"
    
    # Send SMS notification (non-blocking, don't fail if SMS fails)
    try:
        send_repair_created_sms(
            customer_name=customer.full_name,
            phone_number=customer.phone_number,
            repair_id=new_repair.id,
            phone_description=new_repair.phone_description,
            manager_id=manager_id,
            company_name=company_name
        )
        print(f"✅ SMS notification sent to {customer.full_name}")
    except Exception as sms_error:
        # Log SMS error but don't fail the repair creation
        print(f"⚠️ SMS sending failed (non-critical): {sms_error}")
    
    print(f"✅ Repair creation completed successfully")
    return new_repair


@router.get("/", response_model=List[RepairResponse])
def list_repairs(
    status_filter: str = None,
    skip: int = 0,
    limit: int = 10,  # ✅ Reduced from 100 to 10 for better performance
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all repairs with optional status filtering (Repairer, CEO, Admin only)"""
    if not can_manage_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view repairs"
        )
    query = db.query(Repair)
    
    if status_filter:
        query = query.filter(Repair.status == status_filter)
    
    repairs = query.order_by(Repair.created_at.desc()).offset(skip).limit(limit).all()
    return repairs


@router.get("/{repair_id}", response_model=RepairResponse)
def get_repair(
    repair_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific repair by ID (Repairer, CEO, Admin only)"""
    if not can_manage_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view repairs"
        )
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair not found"
        )
    return repair


@router.put("/{repair_id}", response_model=RepairResponse)
def update_repair(
    repair_id: int, 
    repair_update: RepairUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update repair status or details and send SMS if status changed (Repairer, CEO, Admin only)"""
    if not can_manage_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage repairs"
        )
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair not found"
        )
    
    # Check if status is being updated
    old_status = repair.status
    status_changed = False
    
    # Update only provided fields
    for field, value in repair_update.model_dump(exclude_unset=True).items():
        if field == "status" and value != old_status:
            status_changed = True
        setattr(repair, field, value)
    
    # Update the updated_at timestamp
    repair.updated_at = datetime.utcnow()
    
    # If repair is completed or delivered, update phone status and ownership
    if repair.phone_id and repair.status in ["Completed", "Delivered"]:
        phone = db.query(Phone).filter(Phone.id == repair.phone_id).first()
        if phone:
            phone.status = PhoneStatus.AVAILABLE
            phone.is_available = True
            
            # Return phone to shop ownership
            phone.current_owner_id = None
            phone.current_owner_type = "shop"
            
            # Record ownership history
            customer = db.query(Customer).filter(Customer.id == repair.customer_id).first()
            ownership_change = PhoneOwnershipHistory(
                phone_id=phone.id,
                owner_id=None,
                owner_type="shop",
                change_reason="repair_completed",
                transaction_id=repair.id,
                change_date=datetime.utcnow()
            )
            db.add(ownership_change)
    
    db.commit()
    db.refresh(repair)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"updated repair status to {repair.status}",
        module="repairs",
        target_id=repair.id,
        details=f"{repair.phone_description} - Status: {repair.status}"
    )
    
    # Send SMS if status changed (non-blocking)
    if status_changed:
        customer = db.query(Customer).filter(Customer.id == repair.customer_id).first()
        if customer:
            try:
                send_repair_status_update_sms(
                    customer_name=customer.full_name,
                    phone_number=customer.phone_number,
                    status=repair.status,
                    repair_id=repair.id
                )
                print(f"✅ Status update SMS sent to {customer.full_name}")
            except Exception as sms_error:
                print(f"⚠️ SMS sending failed (non-critical): {sms_error}")
    
    return repair


@router.get("/customer/{customer_id}", response_model=List[RepairResponse])
def get_customer_repairs(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all repairs for a specific customer (Repairer, CEO, Admin only)"""
    if not can_manage_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view repairs"
        )
    repairs = db.query(Repair).filter(Repair.customer_id == customer_id).order_by(Repair.created_at.desc()).all()
    return repairs


@router.patch("/{repair_id}/status", response_model=RepairResponse)
def update_repair_status(
    repair_id: int,
    new_status: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update only the repair status and send SMS notification in background (Repairer, CEO, Admin only)"""
    if not can_manage_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage repairs"
        )
    # Validate status
    valid_statuses = ["Pending", "In Progress", "Completed", "Delivered"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair not found"
        )
    
    old_status = repair.status
    status_changed = old_status != new_status
    
    repair.status = new_status
    repair.updated_at = datetime.utcnow()
    
    # Mark as notified if status is Completed or Delivered
    if new_status in ["Completed", "Delivered"]:
        repair.delivery_notified = True
    
    db.commit()
    db.refresh(repair)
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"updated repair status to {new_status}",
        module="repairs",
        target_id=repair.id,
        details=f"{repair.phone_description} - Status: {new_status}"
    )
    
    # Send SMS notification for ALL status changes (non-blocking)
    if status_changed:
        customer = db.query(Customer).filter(Customer.id == repair.customer_id).first()
        if customer:
            try:
                # For "Completed" status, use the detailed completion SMS
                if new_status == "Completed":
                    # Get manager for branding check
                    manager_id = None
                    company_name = "SwapSync"  # Default
                    
                    if repair.created_by_user_id:
                        created_by = db.query(User).filter(User.id == repair.created_by_user_id).first()
                        if created_by:
                            # If created by shopkeeper/repairer, get their manager's company
                            if created_by.parent_user_id:
                                manager = db.query(User).filter(User.id == created_by.parent_user_id).first()
                                if manager:
                                    manager_id = manager.id
                                    company_name = manager.company_name or "SwapSync"
                            # If created by manager directly
                            elif created_by.role.value in ['manager', 'ceo']:
                                manager_id = created_by.id
                                company_name = created_by.company_name or "SwapSync"
                    
                    # Schedule detailed completion SMS in background
                    background_tasks.add_task(
                        send_repair_completion_sms_background,
                        customer_id=customer.id,
                        customer_phone=customer.phone_number,
                        customer_name=customer.full_name,
                        company_name=company_name,
                        repair_description=repair.phone_description,
                        cost=repair.cost,
                        invoice_number=None,
                        manager_id=manager_id
                    )
                    print(f"✅ Completion SMS scheduled for {customer.full_name}")
                else:
                    # For other status changes, send simple status update SMS
                    # Get manager for SMS branding
                    manager_id = None
                    company_name = "SwapSync"
                    if repair.created_by_user_id:
                        created_by = db.query(User).filter(User.id == repair.created_by_user_id).first()
                        if created_by:
                            if created_by.parent_user_id:
                                manager = db.query(User).filter(User.id == created_by.parent_user_id).first()
                                if manager:
                                    manager_id = manager.id
                                    company_name = manager.company_name or "SwapSync"
                            elif created_by.role.value in ['manager', 'ceo']:
                                manager_id = created_by.id
                                company_name = created_by.company_name or "SwapSync"
                    
                    send_repair_status_update_sms(
                        customer_name=customer.full_name,
                        phone_number=customer.phone_number,
                        status=new_status,
                        repair_id=repair.id,
                        manager_id=manager_id,
                        company_name=company_name
                    )
                    print(f"✅ Status update SMS sent to {customer.full_name} - Status: {new_status}")
            except Exception as sms_error:
                print(f"⚠️ SMS sending failed (non-critical): {sms_error}")
    
    return repair


@router.get("/stats/hub", status_code=status.HTTP_200_OK)
def get_repair_hub_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive repair hub statistics
    Shows service charges, items profit, and repairer-specific earnings
    """
    from app.models.repair_item_usage import RepairItemUsage
    from app.models.repair_item import RepairItem
    from sqlalchemy import func
    
    # Base query - filter by user role
    if current_user.role.value == 'repairer':
        # Repairer sees only their repairs
        repairs_query = db.query(Repair).filter(Repair.staff_id == current_user.id)
    elif current_user.role.value in ['manager', 'ceo']:
        # Manager sees all repairs from their staff
        staff_ids = [current_user.id]
        staff_members = db.query(User).filter(User.parent_user_id == current_user.id).all()
        staff_ids.extend([s.id for s in staff_members])
        repairs_query = db.query(Repair).filter(Repair.created_by_user_id.in_(staff_ids))
    else:
        # Admin sees all repairs
        repairs_query = db.query(Repair)
    
    # Get all repairs
    repairs = repairs_query.all()
    
    # Calculate service charges (workmanship only - not profit)
    total_service_charges = sum(r.service_cost for r in repairs)
    
    # Calculate items profit from actual usage
    items_usage_query = db.query(RepairItemUsage).join(Repair).filter(Repair.id.in_([r.id for r in repairs]))
    items_used = items_usage_query.all()
    
    # Calculate actual items profit (selling price - cost price) * quantity used
    items_profit = 0.0
    items_revenue = 0.0
    
    for usage in items_used:
        item = db.query(RepairItem).filter(RepairItem.id == usage.repair_item_id).first()
        if item:
            profit_per_unit = item.selling_price - item.cost_price
            items_profit += profit_per_unit * usage.quantity
            items_revenue += usage.total_cost
    
    # Total revenue
    total_revenue = sum(r.cost for r in repairs)
    
    # Breakdown by status
    pending_count = len([r for r in repairs if r.status.lower() == 'pending'])
    in_progress_count = len([r for r in repairs if r.status.lower().replace(' ', '_') == 'in_progress'])
    completed_count = len([r for r in repairs if r.status.lower() == 'completed'])
    delivered_count = len([r for r in repairs if r.status.lower() == 'delivered'])
    
    return {
        "total_repairs": len(repairs),
        "total_revenue": round(total_revenue, 2),
        "service_charges": round(total_service_charges, 2),
        "items_revenue": round(items_revenue, 2),
        "items_profit": round(items_profit, 2),
        "total_profit": round(items_profit, 2),  # Only items have profit, service is just charge
        "repairs_by_status": {
            "pending": pending_count,
            "in_progress": in_progress_count,
            "completed": completed_count,
            "delivered": delivered_count
        },
        "user_role": current_user.role.value
    }


@router.delete("/{repair_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_repair(
    repair_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a repair record (Repairer, CEO, Admin only)"""
    if not can_manage_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage repairs"
        )
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair not found"
        )
    
    # Get customer details before deletion
    customer = db.query(Customer).filter(Customer.id == repair.customer_id).first()
    repair_details = f"{repair.phone_description} for {customer.full_name if customer else 'Unknown'}"
    
    db.delete(repair)
    db.commit()
    
    # Log activity
    log_activity(
        db=db,
        user=current_user,
        action=f"deleted repair",
        module="repairs",
        target_id=repair_id,
        details=repair_details
    )
    
    return None


# ============================================================================
# REPAIR SALES (Product Items Used in Repairs)
# ============================================================================

@router.post("/{repair_id}/items", status_code=status.HTTP_201_CREATED)
def add_repair_item(
    repair_id: int,
    item_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a product item to a repair
    - Deducts stock from product inventory
    - Records sale attributed to repairer
    - Calculates profit
    """
    from app.core.permissions import can_book_repairs
    from app.models.product import Product
    from app.models.repair_sale import RepairSale
    
    # Only repairers and shopkeepers can add items
    if not can_book_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only repairers and shopkeepers can add repair items. Your role: {current_user.role.value}"
        )
    
    # Verify repair exists
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair not found"
        )
    
    # Extract data
    product_id = item_data.get("product_id")
    quantity = item_data.get("quantity", 1)
    unit_price = item_data.get("unit_price")  # Optional, will use product's selling_price if not provided
    notes = item_data.get("notes", "")
    
    if not product_id or quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="product_id is required and quantity must be greater than 0"
        )
    
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Check stock availability
    if product.quantity < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for {product.name}. Available: {product.quantity}, Requested: {quantity}"
        )
    
    # Use product's selling_price if unit_price not provided
    if unit_price is None:
        unit_price = product.selling_price
    
    # Calculate profit
    cost_price = product.cost_price
    profit = (unit_price - cost_price) * quantity
    
    try:
        # Begin transaction
        # 1. Deduct stock
        product.quantity -= quantity
        
        # 2. Create repair_sale record
        repair_sale = RepairSale(
            repair_id=repair_id,
            product_id=product_id,
            repairer_id=current_user.id,
            quantity=quantity,
            unit_price=unit_price,
            cost_price=cost_price,
            profit=profit,
            notes=notes
        )
        db.add(repair_sale)
        
        # 3. Update repair items_cost
        repair.items_cost += (unit_price * quantity)
        repair.cost = repair.service_cost + repair.items_cost
        
        db.commit()
        db.refresh(repair_sale)
        db.refresh(product)
        db.refresh(repair)
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action=f"added {quantity}x {product.name} to repair #{repair_id}",
            module="repairs",
            target_id=repair_id,
            details=f"Product: {product.name}, Qty: {quantity}, Price: {unit_price}, Profit: {profit}"
        )
        
        return {
            "success": True,
            "message": f"Added {quantity}x {product.name} to repair",
            "repair_sale": {
                "id": repair_sale.id,
                "product_id": product_id,
                "product_name": product.name,
                "quantity": quantity,
                "unit_price": unit_price,
                "cost_price": cost_price,
                "profit": profit,
                "total_price": repair_sale.total_price,
                "total_cost": repair_sale.total_cost
            },
            "updated_stock": product.quantity,
            "updated_repair_cost": repair.cost
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add item to repair: {str(e)}"
        )


@router.get("/{repair_id}/items")
def get_repair_items(
    repair_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all items used in a repair"""
    from app.models.repair_sale import RepairSale
    from app.models.product import Product
    
    # Verify repair exists
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair not found"
        )
    
    # Get all repair sales for this repair
    repair_sales = db.query(RepairSale).filter(RepairSale.repair_id == repair_id).all()
    
    items = []
    for rs in repair_sales:
        product = db.query(Product).filter(Product.id == rs.product_id).first()
        repairer = db.query(User).filter(User.id == rs.repairer_id).first()
        
        items.append({
            "id": rs.id,
            "product_id": rs.product_id,
            "product_name": product.name if product else "Unknown",
            "product_sku": product.sku if product else None,
            "quantity": rs.quantity,
            "unit_price": rs.unit_price,
            "cost_price": rs.cost_price,
            "total_price": rs.total_price,
            "total_cost": rs.total_cost,
            "profit": rs.profit,
            "repairer_id": rs.repairer_id,
            "repairer_name": repairer.username if repairer else "Unknown",
            "notes": rs.notes,
            "created_at": rs.created_at
        })
    
    return {
        "repair_id": repair_id,
        "items": items,
        "total_items": len(items),
        "total_value": sum(item["total_price"] for item in items),
        "total_profit": sum(item["profit"] for item in items)
    }


@router.delete("/{repair_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_repair_item(
    repair_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove an item from a repair
    - Restores stock to product inventory
    - Removes repair_sale record
    - Adjusts repair cost
    """
    from app.core.permissions import can_manage_repairs
    from app.models.repair_sale import RepairSale
    from app.models.product import Product
    
    if not can_manage_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to remove repair items"
        )
    
    # Get repair_sale record
    repair_sale = db.query(RepairSale).filter(
        RepairSale.id == item_id,
        RepairSale.repair_id == repair_id
    ).first()
    
    if not repair_sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair item not found"
        )
    
    # Get repair and product
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    product = db.query(Product).filter(Product.id == repair_sale.product_id).first()
    
    try:
        # Restore stock
        if product:
            product.quantity += repair_sale.quantity
        
        # Update repair cost
        if repair:
            repair.items_cost -= (repair_sale.unit_price * repair_sale.quantity)
            repair.cost = repair.service_cost + repair.items_cost
        
        # Delete repair_sale
        db.delete(repair_sale)
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            user=current_user,
            action=f"removed item from repair #{repair_id}",
            module="repairs",
            target_id=repair_id,
            details=f"Product ID: {repair_sale.product_id}, Qty: {repair_sale.quantity}"
        )
        
        return None
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove item: {str(e)}"
        )
