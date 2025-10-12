"""
Audit Access Routes - System Admin access to CEO data with audit code
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.phone import Phone
from app.models.swap import Swap, ResaleStatus
from app.models.sale import Sale
from app.models.repair import Repair
from app.models.activity_log import ActivityLog

router = APIRouter(prefix="/audit", tags=["Audit Access"])


class AuditCodeRequest(BaseModel):
    """Request to access CEO data with audit code"""
    ceo_id: int
    audit_code: str


class AuditCodeGenerate(BaseModel):
    """Generate new audit code for CEO"""
    pass


@router.get("/my-audit-code")
def get_my_audit_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manager/CEO can view their own audit code
    """
    if current_user.role not in [UserRole.CEO, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers have audit codes"
        )
    
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "audit_code": current_user.audit_code,
        "has_code": current_user.audit_code is not None
    }


@router.post("/regenerate-audit-code")
def regenerate_audit_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    CEO can regenerate their audit code (invalidates old one)
    """
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers can regenerate audit codes"
        )
    
    # Generate new audit code
    new_code = User.generate_audit_code()
    current_user.audit_code = new_code
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Audit code regenerated successfully",
        "audit_code": new_code
    }


@router.get("/list-ceos")
def list_ceos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    System Admin can list all CEOs
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can access this"
        )
    
    # Get all Manager users
    managers = db.query(User).filter(User.role.in_([UserRole.MANAGER, 'MANAGER'])).all()
    
    return {
        "managers": [
            {
                "id": manager.id,
                "username": manager.username,
                "full_name": manager.full_name,
                "company_name": manager.company_name,
                "email": manager.email,
                "has_audit_code": manager.audit_code is not None,
                "is_active": bool(manager.is_active),
                "is_locked": not bool(manager.is_active),  # locked = inactive
                "created_at": manager.created_at.isoformat() if manager.created_at else None,
                "last_login": manager.last_login.isoformat() if manager.last_login else None
            }
            for manager in managers
        ],
        "total": len(managers)
    }


@router.post("/verify-access")
def verify_audit_access(
    request: AuditCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify audit code for CEO access (doesn't return data, just verifies)
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can audit CEO data"
        )
    
    # Get the Manager
    manager = db.query(User).filter(
        User.id == request.ceo_id,
        User.role.in_([UserRole.MANAGER, 'MANAGER'])
    ).first()
    
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager not found"
        )
    
    # Verify audit code
    if not manager.verify_audit_code(request.audit_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid audit code"
        )
    
    # Log the audit access (optional, for transparency)
    # You can add activity logging here if needed
    
    return {
        "message": "Audit access verified",
        "manager_id": manager.id,
        "manager_username": manager.username
    }


@router.get("/manager-data/{manager_id}")
def get_manager_data(
    manager_id: int,
    audit_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete Manager business data (requires valid audit code)
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can audit Manager data"
        )
    
    # Get the Manager
    manager = db.query(User).filter(
        User.id == manager_id,
        User.role.in_([UserRole.MANAGER, 'MANAGER'])
    ).first()
    
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager not found"
        )
    
    # Verify audit code
    if not manager.verify_audit_code(audit_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid audit code"
        )
    
    # Get Manager's staff
    staff = db.query(User).filter(User.parent_user_id == manager_id).all()
    staff_ids = [manager_id] + [s.id for s in staff]
    
    # Get business statistics
    total_customers = db.query(Customer).filter(Customer.created_by_id.in_(staff_ids)).count()
    total_phones = db.query(Phone).filter(Phone.created_by_id.in_(staff_ids)).count()
    total_swaps = db.query(Swap).filter(Swap.staff_id.in_(staff_ids)).count()
    total_sales = db.query(Sale).filter(Sale.staff_id.in_(staff_ids)).count()
    total_repairs = db.query(Repair).filter(Repair.staff_id.in_(staff_ids)).count()
    
    # Revenue calculations
    sales_revenue = db.query(func.sum(Sale.final_price)).filter(Sale.staff_id.in_(staff_ids)).scalar() or 0.0
    repair_revenue = db.query(func.sum(Repair.price)).filter(
        Repair.staff_id.in_(staff_ids),
        Repair.status == 'delivered'
    ).scalar() or 0.0
    
    # Get recent activity
    recent_activity = db.query(ActivityLog).filter(
        ActivityLog.user_id.in_(staff_ids)
    ).order_by(ActivityLog.timestamp.desc()).limit(50).all()
    
    return {
        "manager_info": {
            "id": manager.id,
            "username": manager.username,
            "full_name": manager.full_name,
            "email": manager.email,
            "created_at": manager.created_at.isoformat() if manager.created_at else None,
            "last_login": manager.last_login.isoformat() if manager.last_login else None
        },
        "business_stats": {
            "total_customers": total_customers,
            "total_phones": total_phones,
            "total_swaps": total_swaps,
            "total_sales": total_sales,
            "total_repairs": total_repairs,
            "sales_revenue": float(sales_revenue),
            "repair_revenue": float(repair_revenue),
            "total_revenue": float(sales_revenue + repair_revenue)
        },
        "staff": [
            {
                "id": s.id,
                "username": s.username,
                "full_name": s.full_name,
                "role": s.role.value,
                "email": s.email,
                "is_active": bool(s.is_active)
            }
            for s in staff
        ],
        "recent_activity": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "module": log.module,
                "timestamp": log.timestamp.isoformat()
            }
            for log in recent_activity
        ]
    }
