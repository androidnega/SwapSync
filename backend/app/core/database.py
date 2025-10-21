"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Database URL from settings
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Create engine with database-specific configuration
# SQLite needs check_same_thread=False, PostgreSQL doesn't
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_size=5,              # Small pool for Railway $5 plan
    max_overflow=2,           # Allow 2 extra connections in bursts
    pool_recycle=300,         # Recycle connections every 5 minutes
    pool_pre_ping=True,       # Verify connections before use
    echo=False                # Disable SQL query logging in production
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Dependency for FastAPI routes
def get_db():
    """
    Dependency function to get database session
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database by creating all tables
    Import all models here to ensure they are registered with SQLAlchemy
    """
    # Import all models to ensure they are registered
    from app import models  # This imports all models from __init__.py
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully!")
    print(f"📊 Tables created: {', '.join(Base.metadata.tables.keys())}")

