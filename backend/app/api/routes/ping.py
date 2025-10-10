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
    """
    return {
        "message": "SwapSync API running...",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy"
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

