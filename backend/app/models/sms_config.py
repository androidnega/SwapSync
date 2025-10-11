"""
SMS Configuration Model - Encrypted storage of SMS API credentials
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.core.database import Base
import base64
from cryptography.fernet import Fernet
import os

# Generate or load encryption key (in production, use env variable)
ENCRYPTION_KEY = os.getenv("SMS_ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)


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
            return cipher.encrypt(value.encode()).decode()
        except Exception as e:
            print(f"Encryption error: {e}")
            return None
    
    @staticmethod
    def decrypt(encrypted_value: str) -> str:
        """Decrypt a value"""
        if not encrypted_value:
            return None
        try:
            return cipher.decrypt(encrypted_value.encode()).decode()
        except Exception as e:
            print(f"Decryption error: {e}")
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

