"""
Ping/Health Check endpoint
"""
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/ping")
def ping():
    """
    Health check endpoint to verify API is running
    Also tests CORS configuration
    """
    return {
        "message": "pong",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "cors_enabled": True,
        "allowed_origins": [
            "https://swapsync.digitstec.store",
            "https://api.digitstec.store",
            "https://digitstec.store"
        ]
    }


@router.get("/health")
def health_check():
    """
    Alternative health check endpoint
    """
    return {
        "status": "ok",
        "service": "SwapSync API"
    }

