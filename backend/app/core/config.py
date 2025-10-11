"""
Configuration management for SwapSync API
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os
import sys


def get_database_path():
    """Get the correct database path for bundled or development mode"""
    # Check if running in bundled Electron app
    if getattr(sys, 'frozen', False):
        # Running in bundled mode (PyInstaller/Electron)
        base_path = os.path.dirname(sys.executable)
        return f"sqlite:///{os.path.join(base_path, 'swapsync.db')}"
    else:
        # Running in development mode
        return "sqlite:///./swapsync.db"


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "SwapSync API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database - Use env var if set, otherwise default to SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL", get_database_path())
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # SMS Integration (Twilio)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    ENABLE_SMS: bool = False  # Set to True to enable SMS notifications
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()

