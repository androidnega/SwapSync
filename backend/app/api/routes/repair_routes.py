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
        from app.core.database import SessionLocal
        
        # Determine SMS sender based on manager's branding preference
        db = SessionLocal()
        sms_sender = company_name  # Default
        
        if manager_id:
            manager = db.query(User).filter(User.id == manager_id).first()
            if manager and hasattr(manager, 'use_company_sms_branding'):
                if manager.use_company_sms_branding == 1 and manager.company_name:
                    sms_sender = manager.company_name
                    print(f"📱 Using company branding: {manager.company_name}")
                else:
                    sms_sender = "SwapSync"
                    print(f"📱 Using SwapSync branding (company toggle off)")
            else:
                sms_sender = "SwapSync"
        else:
            sms_sender = "SwapSync"
        
        db.close()
        
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
    print(f"   Cost: {repair.cost}")
    
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == repair.customer_id).first()
    if not customer:
        print(f"❌ Customer not found: ID {repair.customer_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    print(f"✅ Customer found: {customer.full_name}")
    
    new_repair = Repair(**repair.model_dump(), created_at=datetime.utcnow())
    new_repair.created_by_user_id = current_user.id  # Track who created this repair
    db.add(new_repair)
    db.flush()
    
    print(f"✅ Repair record created in database")
    
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
    
    # Send SMS notification (non-blocking, don't fail if SMS fails)
    try:
        send_repair_created_sms(
            customer_name=customer.full_name,
            phone_number=customer.phone_number,
            repair_id=new_repair.id,
            phone_description=new_repair.phone_description
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
    limit: int = 100,
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
                            elif created_by.is_manager:
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
                    send_repair_status_update_sms(
                        customer_name=customer.full_name,
                        phone_number=customer.phone_number,
                        status=new_status,
                        repair_id=repair.id
                    )
                    print(f"✅ Status update SMS sent to {customer.full_name} - Status: {new_status}")
            except Exception as sms_error:
                print(f"⚠️ SMS sending failed (non-critical): {sms_error}")
    
    return repair


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

