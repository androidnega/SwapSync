"""
Auto-Expiring Audit Code Routes - Short-lived codes for enhanced security
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.audit_code import AuditCode

router = APIRouter(prefix="/audit/expiring", tags=["Expiring Audit Codes"])


class AuditCodeValidate(BaseModel):
    """Request to validate audit code"""
    manager_id: int
    code: str


@router.post("/generate")
def generate_expiring_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a new auto-expiring audit code (90 seconds)
    Only Managers can generate their own codes
    """
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers can generate audit codes"
        )
    
    # Invalidate any existing active codes for this user
    db.query(AuditCode).filter(
        AuditCode.user_id == current_user.id,
        AuditCode.used == False
    ).update({"used": True})
    
    # Generate new code
    new_code = AuditCode(
        user_id=current_user.id,
        code=AuditCode.generate_code(),
        expires_at=AuditCode.calculate_expiry(),
        auto_generated=False
    )
    
    db.add(new_code)
    db.commit()
    db.refresh(new_code)
    
    return {
        "code": new_code.code,
        "expires_at": new_code.expires_at.isoformat(),
        "expires_in_seconds": int(new_code.time_remaining()),
        "created_at": new_code.created_at.isoformat()
    }


@router.get("/current")
def get_current_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current valid audit code for this Manager
    Returns null if no valid code exists or code has expired
    """
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers have audit codes"
        )
    
    # Find most recent unexpired code
    code = db.query(AuditCode).filter(
        AuditCode.user_id == current_user.id,
        AuditCode.used == False,
        AuditCode.expires_at > datetime.utcnow()
    ).order_by(AuditCode.created_at.desc()).first()
    
    if not code:
        return {
            "code": None,
            "expires_at": None,
            "expires_in_seconds": 0,
            "message": "No valid code. Generate a new one."
        }
    
    return {
        "code": code.code,
        "expires_at": code.expires_at.isoformat(),
        "expires_in_seconds": int(code.time_remaining()),
        "created_at": code.created_at.isoformat()
    }


@router.post("/validate")
def validate_expiring_code(
    request: AuditCodeValidate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validate an expiring audit code for Manager data access
    System Admin uses this to verify Manager's code
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only System Administrators can validate audit codes"
        )
    
    # Find the code
    audit_code = db.query(AuditCode).filter(
        AuditCode.user_id == request.manager_id,
        AuditCode.code == request.code,
        AuditCode.used == False
    ).first()
    
    if not audit_code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid audit code"
        )
    
    # Check if expired
    if not audit_code.is_valid():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Audit code has expired. Ask Manager to generate a new one."
        )
    
    # Mark as used (one-time use)
    audit_code.used = True
    db.commit()
    
    return {
        "message": "Audit code validated successfully",
        "manager_id": request.manager_id,
        "valid_until": audit_code.expires_at.isoformat(),
        "time_remaining": int(audit_code.time_remaining())
    }


@router.get("/history")
def get_audit_code_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """
    Get audit code generation history for current Manager
    Shows last 20 generated codes
    """
    if current_user.role not in [UserRole.MANAGER, UserRole.CEO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers can view audit code history"
        )
    
    codes = db.query(AuditCode).filter(
        AuditCode.user_id == current_user.id
    ).order_by(AuditCode.created_at.desc()).limit(limit).all()
    
    return {
        "codes": [
            {
                "code": code.code,
                "created_at": code.created_at.isoformat(),
                "expires_at": code.expires_at.isoformat(),
                "used": code.used,
                "expired": not code.is_valid()
            }
            for code in codes
        ],
        "total": len(codes)
    }


@router.get("/health")
def audit_health_check():
    """
    Health check endpoint for audit routes
    """
    return {
        "status": "ok",
        "message": "Audit routes are working",
        "endpoints": [
            "/audit/expiring/generate",
            "/audit/expiring/current", 
            "/audit/expiring/validate",
            "/audit/expiring/history"
        ]
    }
