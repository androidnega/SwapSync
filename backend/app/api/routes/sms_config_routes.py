"""
SMS Configuration Routes - Admin-only SMS settings management
NOW WITH DATABASE STORAGE AND ENCRYPTION! 🔐
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.sms_config import SMSConfig
from app.core.sms import configure_sms, get_sms_service

router = APIRouter(prefix="/sms-config", tags=["SMS Configuration"])


class SMSConfigUpdate(BaseModel):
    arkasel_api_key: Optional[str] = None
    arkasel_sender_id: Optional[str] = "SwapSync"
    hubtel_client_id: Optional[str] = None
    hubtel_client_secret: Optional[str] = None
    hubtel_sender_id: Optional[str] = "SwapSync"
    enabled: bool = False


class SMSConfigResponse(BaseModel):
    arkasel_api_key_set: bool
    arkasel_api_key_length: int = 0  # Length of actual API key (for visual feedback)
    arkasel_sender_id: str
    hubtel_client_id_set: bool
    hubtel_client_id_length: int = 0
    hubtel_client_secret_set: bool
    hubtel_client_secret_length: int = 0
    hubtel_sender_id: str
    enabled: bool
    arkasel_enabled: bool
    hubtel_enabled: bool


def _get_or_create_config(db: Session) -> SMSConfig:
    """Get existing config or create new one (singleton)"""
    config = db.query(SMSConfig).first()
    if not config:
        config = SMSConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get("/", response_model=SMSConfigResponse)
def get_sms_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current SMS configuration (Admin only)
    - Returns masked API keys (shows if set, not actual values)
    - NOW FROM DATABASE! 🔐
    """
    # Only admin can view/edit SMS config
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view SMS configuration"
        )
    
    config = _get_or_create_config(db)
    sms_service = get_sms_service()
    
    # Get actual keys to determine their lengths (for visual feedback)
    arkasel_key = config.get_arkasel_api_key()
    hubtel_id = config.get_hubtel_client_id()
    hubtel_secret = config.get_hubtel_client_secret()
    
    return {
        "arkasel_api_key_set": bool(arkasel_key),
        "arkasel_api_key_length": len(arkasel_key) if arkasel_key else 0,
        "arkasel_sender_id": config.arkasel_sender_id or "SwapSync",
        "hubtel_client_id_set": bool(hubtel_id),
        "hubtel_client_id_length": len(hubtel_id) if hubtel_id else 0,
        "hubtel_client_secret_set": bool(hubtel_secret),
        "hubtel_client_secret_length": len(hubtel_secret) if hubtel_secret else 0,
        "hubtel_sender_id": config.hubtel_sender_id or "SwapSync",
        "enabled": config.sms_enabled,
        "arkasel_enabled": config.arkasel_enabled,
        "hubtel_enabled": config.hubtel_enabled
    }


@router.post("/", response_model=SMSConfigResponse)
def update_sms_config(
    config_data: SMSConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update SMS configuration (Admin only)
    - Saves to DATABASE (encrypted!) 🔐
    - Reconfigures SMS service
    """
    # Only admin can update SMS config
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update SMS configuration"
        )
    
    # Get or create config
    config = _get_or_create_config(db)
    
    print(f"[SMS_CONFIG] 💾 Updating SMS config for user: {current_user.username}")
    print(f"[SMS_CONFIG]    Config ID: {config.id}")
    print(f"[SMS_CONFIG]    Arkasel API Key provided: {bool(config_data.arkasel_api_key)}")
    print(f"[SMS_CONFIG]    Hubtel Client ID provided: {bool(config_data.hubtel_client_id)}")
    
    # Update with new values (only if provided) - ENCRYPTED!
    if config_data.arkasel_api_key is not None and config_data.arkasel_api_key.strip():
        print(f"[SMS_CONFIG]    Setting Arkasel API key (length: {len(config_data.arkasel_api_key)})")
        config.set_arkasel_api_key(config_data.arkasel_api_key)
        config.arkasel_enabled = True
    if config_data.arkasel_sender_id is not None:
        config.arkasel_sender_id = config_data.arkasel_sender_id
    if config_data.hubtel_client_id is not None and config_data.hubtel_client_id.strip():
        print(f"[SMS_CONFIG]    Setting Hubtel Client ID (length: {len(config_data.hubtel_client_id)})")
        config.set_hubtel_client_id(config_data.hubtel_client_id)
    if config_data.hubtel_client_secret is not None and config_data.hubtel_client_secret.strip():
        print(f"[SMS_CONFIG]    Setting Hubtel Client Secret (length: {len(config_data.hubtel_client_secret)})")
        config.set_hubtel_client_secret(config_data.hubtel_client_secret)
    if config_data.hubtel_sender_id is not None:
        config.hubtel_sender_id = config_data.hubtel_sender_id
    
    # Enable/disable
    config.sms_enabled = config_data.enabled
    config.hubtel_enabled = bool(config_data.hubtel_client_id and config_data.hubtel_client_secret)
    config.updated_by = current_user.username
    
    print(f"[SMS_CONFIG]    Final state - Arkasel enabled: {config.arkasel_enabled}, Hubtel enabled: {config.hubtel_enabled}")
    
    # Save to database
    db.commit()
    db.refresh(config)
    
    print(f"[SMS_CONFIG] ✅ Config saved to database!")
    
    # Reconfigure SMS service with decrypted values
    configure_sms(
        arkasel_api_key=config.get_arkasel_api_key() or "",
        arkasel_sender_id=config.arkasel_sender_id or "SwapSync",
        hubtel_client_id=config.get_hubtel_client_id() or "",
        hubtel_client_secret=config.get_hubtel_client_secret() or "",
        hubtel_sender_id=config.hubtel_sender_id or "SwapSync"
    )
    
    # Log activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action="updated SMS configuration",
        module="settings",
        details=f"Arkasel: {'enabled' if config.get_arkasel_api_key() else 'disabled'}, Hubtel: {'enabled' if config.get_hubtel_client_id() else 'disabled'}"
    )
    
    sms_service = get_sms_service()
    
    # Get actual keys to determine their lengths (for visual feedback in UI)
    arkasel_key = config.get_arkasel_api_key()
    hubtel_id = config.get_hubtel_client_id()
    hubtel_secret = config.get_hubtel_client_secret()
    
    return {
        "arkasel_api_key_set": bool(arkasel_key),
        "arkasel_api_key_length": len(arkasel_key) if arkasel_key else 0,
        "arkasel_sender_id": config.arkasel_sender_id or "SwapSync",
        "hubtel_client_id_set": bool(hubtel_id),
        "hubtel_client_id_length": len(hubtel_id) if hubtel_id else 0,
        "hubtel_client_secret_set": bool(hubtel_secret),
        "hubtel_client_secret_length": len(hubtel_secret) if hubtel_secret else 0,
        "hubtel_sender_id": config.hubtel_sender_id or "SwapSync",
        "enabled": config.sms_enabled,
        "arkasel_enabled": config.arkasel_enabled,
        "hubtel_enabled": config.hubtel_enabled
    }


@router.get("/debug")
def debug_sms_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Debug endpoint to check SMS config status"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        config = db.query(SMSConfig).first()
        if not config:
            return {
                "status": "no_config",
                "message": "No SMS config found in database. Table may not exist.",
                "solution": "Run migration: migrate_add_sms_config_table.py"
            }
        
        return {
            "status": "config_exists",
            "config_id": config.id,
            "arkasel_api_key_encrypted": bool(config.arkasel_api_key_encrypted),
            "arkasel_api_key_encrypted_length": len(config.arkasel_api_key_encrypted) if config.arkasel_api_key_encrypted else 0,
            "arkasel_decrypted_length": len(config.get_arkasel_api_key()) if config.get_arkasel_api_key() else 0,
            "arkasel_enabled": config.arkasel_enabled,
            "sms_enabled": config.sms_enabled,
            "updated_by": config.updated_by,
            "updated_at": str(config.updated_at)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to query SMS config. Table may not exist."
        }


@router.post("/test")
def test_sms(
    phone_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a test SMS (Admin only)
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can test SMS"
        )
    
    sms_service = get_sms_service()
    
    if not sms_service.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMS service is not configured. Please configure Arkasel or Hubtel first."
        )
    
    # Send test message
    result = sms_service._send_sms(
        phone_number=phone_number,
        message=f"Test SMS from SwapSync! 🚀\n\nYour SMS configuration is working correctly.\n\nSent by: {current_user.full_name}\nTime: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n- SwapSync System",
        company_name="SwapSync"
    )
    
    # Log activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action=f"sent test SMS to {phone_number}",
        module="settings",
        details=f"Provider: {result.get('provider', 'unknown')}, Status: {result.get('status', 'unknown')}"
    )
    
    return {
        "success": result.get("success", False),
        "provider": result.get("provider", "unknown"),
        "status": result.get("status", "unknown"),
        "message": result.get("error", "SMS sent successfully!") if not result.get("success") else "Test SMS sent successfully!"
    }

