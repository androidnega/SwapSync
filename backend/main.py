"""
SwapSync API - Main Application Entry Point
Phone Swapping and Repair Shop Management System
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.database import init_db
from app.api.routes import ping
from app.api.routes import customer_routes, phone_routes, sale_routes, swap_routes, repair_routes, repair_item_routes, analytics_routes, maintenance_routes, auth_routes, staff_routes, dashboard_routes, invoice_routes, reports_routes, audit_routes, category_routes, brand_routes, websocket_routes, expiring_audit_routes, product_routes, product_sale_routes, pos_sale_routes, profit_report_routes, sms_config_routes, profile_routes, bulk_upload_routes, system_cleanup_routes, sms_broadcast_routes, pending_resale_routes, greetings, today_stats, otp_routes
from app.core.auth import create_default_admin
from app.core.scheduler import start_scheduler, stop_scheduler
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Phone Swapping and Repair Shop Management System",
    debug=settings.DEBUG
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on application startup"""
    from app.core.database import SessionLocal
    init_db()
    
    # Run migrations BEFORE querying database
    try:
        from run_migrations import run_migrations
        logger.info("🔧 Running database migrations...")
        run_migrations()
        logger.info("✅ Migrations completed")
    except Exception as e:
        logger.warning(f"⚠️ Migration runner error: {e}")
        logger.warning("Continuing with startup anyway...")
    
    # Create default admin if no users exist
    db = SessionLocal()
    try:
        create_default_admin(db)
    finally:
        db.close()
    
    # Initialize SMS service from DATABASE (not JSON file!)
    try:
        from app.core.sms import configure_sms
        from app.models.sms_config import SMSConfig
        
        # Load SMS config from database
        db = SessionLocal()
        try:
            sms_config = db.query(SMSConfig).first()
            if sms_config:
                # Configure with decrypted values from database
                configure_sms(
                    arkasel_api_key=sms_config.get_arkasel_api_key() or "",
                    arkasel_sender_id=sms_config.arkasel_sender_id or "SwapSync",
                    hubtel_client_id=sms_config.get_hubtel_client_id() or "",
                    hubtel_client_secret=sms_config.get_hubtel_client_secret() or "",
                    hubtel_sender_id=sms_config.hubtel_sender_id or "SwapSync"
                )
                logger.info("✅ SMS service configured from database")
                logger.info(f"   📱 Arkasel: {'✅ Enabled' if sms_config.arkasel_enabled else '❌ Disabled'}")
                logger.info(f"   📱 Hubtel: {'✅ Enabled' if sms_config.hubtel_enabled else '❌ Disabled'}")
            else:
                logger.warning("⚠️ No SMS config in database. SMS service not configured.")
                logger.warning("   💡 Configure SMS in Settings page")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"❌ Failed to configure SMS service: {e}")
        logger.warning("   SMS notifications will be disabled")
    
    # Start background scheduler
    try:
        start_scheduler()
        logger.info("✅ Background scheduler initialized")
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        stop_scheduler()
        logger.info("✅ Scheduler stopped gracefully")
    except Exception as e:
        logger.error(f"❌ Error stopping scheduler: {e}")

# Configure CORS (with improved settings for development, production, and local network)
ADDITIONAL_ORIGINS = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "http://192.168.17.1:5173",  # Local network access
    "http://192.168.17.1:8000",  # Backend on local network
    "https://swapsync.digitstec.store",  # Production frontend
    "https://api.digitstec.store",  # Production backend
    "https://digitstec.store",  # Main domain
    "https://www.digitstec.store",  # WWW variant
]

# Merge with settings origins
all_origins = list(set(settings.ALLOWED_ORIGINS + ADDITIONAL_ORIGINS))

# Log CORS origins for debugging
logger.info("🌐 CORS Allowed Origins:")
for origin in all_origins:
    logger.info(f"   ✅ {origin}")

# Check if in production
import os
is_production = os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("VERCEL")

if is_production:
    logger.info("🌐 Production environment detected - using enhanced CORS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Additional middleware to FORCE CORS headers on all responses (Railway/production fix)
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class ForceCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Get origin from request
        origin = request.headers.get("origin", "https://swapsync.digitstec.store")
        
        # Determine allowed origin
        if origin in all_origins:
            allowed_origin = origin
        elif "swapsync.digitstec.store" in origin:
            allowed_origin = "https://swapsync.digitstec.store"
        else:
            allowed_origin = "https://swapsync.digitstec.store"
        
        # Process request
        response = await call_next(request)
        
        # Force add CORS headers to response
        response.headers["Access-Control-Allow-Origin"] = allowed_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"
        
        return response

# Add force CORS middleware (applies after CORSMiddleware as a fallback)
app.add_middleware(ForceCORSMiddleware)

# Import OTP routes
from app.api.routes import otp_routes

# Include routers
app.include_router(ping.router, prefix="/api", tags=["Health Check"])
app.include_router(auth_routes.router, prefix="/api")
app.include_router(otp_routes.router, prefix="/api")
app.include_router(staff_routes.router, prefix="/api")
app.include_router(dashboard_routes.router, prefix="/api")
app.include_router(invoice_routes.router, prefix="/api")
app.include_router(reports_routes.router, prefix="/api")
app.include_router(customer_routes.router, prefix="/api")
app.include_router(phone_routes.router, prefix="/api")
app.include_router(sale_routes.router, prefix="/api")
app.include_router(swap_routes.router, prefix="/api")
app.include_router(repair_routes.router, prefix="/api")
app.include_router(repair_item_routes.router, prefix="/api")
app.include_router(analytics_routes.router, prefix="/api")
app.include_router(maintenance_routes.router, prefix="/api")
app.include_router(audit_routes.router, prefix="/api")
app.include_router(category_routes.router, prefix="/api")
app.include_router(brand_routes.router, prefix="/api")
app.include_router(product_routes.router, prefix="/api")
app.include_router(product_sale_routes.router, prefix="/api")
app.include_router(pos_sale_routes.router, prefix="/api")
app.include_router(profit_report_routes.router, prefix="/api")
app.include_router(expiring_audit_routes.router, prefix="/api")
app.include_router(sms_config_routes.router, prefix="/api")
app.include_router(sms_broadcast_routes.router, prefix="/api")
app.include_router(profile_routes.router, prefix="/api")
app.include_router(bulk_upload_routes.router, prefix="/api")
app.include_router(system_cleanup_routes.router, prefix="/api")
app.include_router(pending_resale_routes.router, prefix="/api")
app.include_router(greetings.router, prefix="/api")
app.include_router(today_stats.router, prefix="/api")
app.include_router(websocket_routes.router)  # No /api prefix for WebSocket


# Global exception handler to ensure CORS headers are always sent
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions and ensure CORS headers are present"""
    print(f"❌ Unhandled exception: {str(exc)}")
    print(f"📍 Path: {request.url.path}")
    traceback.print_exc()
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error. Check server logs for details.",
            "error": str(exc),
            "path": str(request.url.path)
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors()
        }
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to SwapSync API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/ping"
    }


@app.options("/{path:path}")
async def options_handler(request: Request, path: str):
    """Handle OPTIONS requests for CORS preflight"""
    # Get the origin from the request
    origin = request.headers.get("origin", "")
    
    # Check if origin is allowed, default to production frontend
    if origin in all_origins:
        allowed_origin = origin
    elif "swapsync.digitstec.store" in origin:
        allowed_origin = "https://swapsync.digitstec.store"
    else:
        allowed_origin = "https://swapsync.digitstec.store"  # Default to production frontend
    
    logger.info(f"🔍 OPTIONS request from origin: {origin} -> Responding with: {allowed_origin}")
    
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

