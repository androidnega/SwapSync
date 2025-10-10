"""
SMS Configuration Routes - Admin-only SMS settings management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
import os

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.core.sms import configure_sms, get_sms_service

router = APIRouter(prefix="/sms-config", tags=["SMS Configuration"])

# Configuration file path
CONFIG_FILE = "sms_config.json"


class SMSConfigUpdate(BaseModel):
    arkasel_api_key: Optional[str] = None
    arkasel_sender_id: Optional[str] = "SwapSync"
    hubtel_client_id: Optional[str] = None
    hubtel_client_secret: Optional[str] = None
    hubtel_sender_id: Optional[str] = "SwapSync"
    enabled: bool = False


class SMSConfigResponse(BaseModel):
    arkasel_api_key_set: bool
    arkasel_sender_id: str
    hubtel_client_id_set: bool
    hubtel_client_secret_set: bool
    hubtel_sender_id: str
    enabled: bool
    arkasel_enabled: bool
    hubtel_enabled: bool


def _load_config() -> dict:
    """Load SMS config from file"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}


def _save_config(config: dict):
    """Save SMS config to file"""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)


@router.get("/", response_model=SMSConfigResponse)
def get_sms_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current SMS configuration (Admin only)
    - Returns masked API keys (shows if set, not actual values)
    """
    # Only admin can view/edit SMS config
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view SMS configuration"
        )
    
    config = _load_config()
    sms_service = get_sms_service()
    
    return {
        "arkasel_api_key_set": bool(config.get("arkasel_api_key")),
        "arkasel_sender_id": config.get("arkasel_sender_id", "SwapSync"),
        "hubtel_client_id_set": bool(config.get("hubtel_client_id")),
        "hubtel_client_secret_set": bool(config.get("hubtel_client_secret")),
        "hubtel_sender_id": config.get("hubtel_sender_id", "SwapSync"),
        "enabled": config.get("enabled", False),
        "arkasel_enabled": sms_service.arkasel_enabled,
        "hubtel_enabled": sms_service.hubtel_enabled
    }


@router.post("/", response_model=SMSConfigResponse)
def update_sms_config(
    config_data: SMSConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update SMS configuration (Admin only)
    - Saves to file
    - Reconfigures SMS service
    """
    # Only admin can update SMS config
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update SMS configuration"
        )
    
    # Load existing config
    config = _load_config()
    
    # Update with new values (only if provided)
    if config_data.arkasel_api_key is not None:
        config["arkasel_api_key"] = config_data.arkasel_api_key
    if config_data.arkasel_sender_id is not None:
        config["arkasel_sender_id"] = config_data.arkasel_sender_id
    if config_data.hubtel_client_id is not None:
        config["hubtel_client_id"] = config_data.hubtel_client_id
    if config_data.hubtel_client_secret is not None:
        config["hubtel_client_secret"] = config_data.hubtel_client_secret
    if config_data.hubtel_sender_id is not None:
        config["hubtel_sender_id"] = config_data.hubtel_sender_id
    
    config["enabled"] = config_data.enabled
    
    # Save to file
    _save_config(config)
    
    # Reconfigure SMS service
    configure_sms(
        arkasel_api_key=config.get("arkasel_api_key", ""),
        arkasel_sender_id=config.get("arkasel_sender_id", "SwapSync"),
        hubtel_client_id=config.get("hubtel_client_id", ""),
        hubtel_client_secret=config.get("hubtel_client_secret", ""),
        hubtel_sender_id=config.get("hubtel_sender_id", "SwapSync")
    )
    
    # Log activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action="updated SMS configuration",
        module="settings",
        details=f"Arkasel: {'enabled' if config.get('arkasel_api_key') else 'disabled'}, Hubtel: {'enabled' if config.get('hubtel_client_id') else 'disabled'}"
    )
    
    sms_service = get_sms_service()
    
    return {
        "arkasel_api_key_set": bool(config.get("arkasel_api_key")),
        "arkasel_sender_id": config.get("arkasel_sender_id", "SwapSync"),
        "hubtel_client_id_set": bool(config.get("hubtel_client_id")),
        "hubtel_client_secret_set": bool(config.get("hubtel_client_secret")),
        "hubtel_sender_id": config.get("hubtel_sender_id", "SwapSync"),
        "enabled": config.get("enabled", False),
        "arkasel_enabled": sms_service.arkasel_enabled,
        "hubtel_enabled": sms_service.hubtel_enabled
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

