"""
SMS Configuration Model - Encrypted storage of SMS API credentials
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.core.database import Base
import base64
from cryptography.fernet import Fernet
import os

# CRITICAL: Use stable encryption key!
# If not set in env, use a deterministic default (NOT RANDOM!)
# In production, MUST set SMS_ENCRYPTION_KEY env variable in Railway
DEFAULT_KEY = "SwapSync-SMS-Encryption-Key-2025-Change-In-Production-Please=="  # Base64-compatible
ENCRYPTION_KEY = os.getenv("SMS_ENCRYPTION_KEY", DEFAULT_KEY)

# Ensure key is proper length for Fernet (must be 32 bytes base64-encoded = 44 chars)
try:
    # Try to use the key as-is
    cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
    print(f"[SMS_CONFIG] ✅ Using encryption key from environment")
except Exception:
    # If key is invalid, generate a proper one from the default
    import hashlib
    key_hash = hashlib.sha256(DEFAULT_KEY.encode()).digest()
    cipher = Fernet(base64.urlsafe_b64encode(key_hash))
    print(f"[SMS_CONFIG] ⚠️ Generated Fernet key from hash (set SMS_ENCRYPTION_KEY env var!)")


class SMSConfig(Base):
    """
    SMS Configuration with encrypted API keys
    Singleton model - only one record should exist
    """
    __tablename__ = "sms_config"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Arkasel (Primary)
    arkasel_api_key_encrypted = Column(String, nullable=True)  # Encrypted
    arkasel_sender_id = Column(String, default="SwapSync")
    arkasel_enabled = Column(Boolean, default=False)
    
    # Hubtel (Fallback)
    hubtel_client_id_encrypted = Column(String, nullable=True)  # Encrypted
    hubtel_client_secret_encrypted = Column(String, nullable=True)  # Encrypted
    hubtel_sender_id = Column(String, default="SwapSync")
    hubtel_enabled = Column(Boolean, default=False)
    
    # General
    sms_enabled = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String, nullable=True)  # Username who last updated
    
    @staticmethod
    def encrypt(value: str) -> str:
        """Encrypt a value"""
        if not value:
            return None
        try:
            encrypted = cipher.encrypt(value.encode()).decode()
            print(f"[SMS_CONFIG] Encrypted value (length: {len(value)} → {len(encrypted)})")
            return encrypted
        except Exception as e:
            print(f"[SMS_CONFIG] ❌ Encryption error: {e}")
            return None
    
    @staticmethod
    def decrypt(encrypted_value: str) -> str:
        """Decrypt a value"""
        if not encrypted_value:
            return None
        try:
            decrypted = cipher.decrypt(encrypted_value.encode()).decode()
            print(f"[SMS_CONFIG] Decrypted value (length: {len(encrypted_value)} → {len(decrypted)})")
            return decrypted
        except Exception as e:
            print(f"[SMS_CONFIG] ❌ Decryption error: {e}")
            print(f"[SMS_CONFIG]    Encrypted value length: {len(encrypted_value) if encrypted_value else 0}")
            return None
    
    def set_arkasel_api_key(self, api_key: str):
        """Set Arkasel API key (encrypts automatically)"""
        self.arkasel_api_key_encrypted = self.encrypt(api_key) if api_key else None
    
    def get_arkasel_api_key(self) -> str:
        """Get Arkasel API key (decrypts automatically)"""
        return self.decrypt(self.arkasel_api_key_encrypted)
    
    def set_hubtel_client_id(self, client_id: str):
        """Set Hubtel client ID (encrypts automatically)"""
        self.hubtel_client_id_encrypted = self.encrypt(client_id) if client_id else None
    
    def get_hubtel_client_id(self) -> str:
        """Get Hubtel client ID (decrypts automatically)"""
        return self.decrypt(self.hubtel_client_id_encrypted)
    
    def set_hubtel_client_secret(self, client_secret: str):
        """Set Hubtel client secret (encrypts automatically)"""
        self.hubtel_client_secret_encrypted = self.encrypt(client_secret) if client_secret else None
    
    def get_hubtel_client_secret(self) -> str:
        """Get Hubtel client secret (decrypts automatically)"""
        return self.decrypt(self.hubtel_client_secret_encrypted)

