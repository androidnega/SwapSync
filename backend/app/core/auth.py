"""
Authentication utilities - JWT token generation and verification
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import TokenData

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# JWT settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt
    Wrapper for User.hash_password for convenience
    """
    from app.models.user import User
    return User.hash_password(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, credentials_exception):
    """
    Verify JWT token and extract payload
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        
        if username is None:
            raise credentials_exception
        
        token_data = TokenData(username=username, role=role)
        return token_data
    except JWTError:
        raise credentials_exception


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = verify_token(token, credentials_exception)
    
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user is an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_shop_keeper_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user is shop keeper or admin
    """
    if current_user.role not in [UserRole.SHOP_KEEPER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shop keeper or admin access required"
        )
    return current_user


async def get_current_repairer_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user is repairer or admin
    """
    if current_user.role not in [UserRole.REPAIRER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Repairer or admin access required"
        )
    return current_user


def create_default_admin(db: Session):
    """
    Create default admin user if no users exist
    """
    existing_users = db.query(User).count()
    
    if existing_users == 0:
        default_admin = User(
            username="admin",
            email="admin@swapsync.local",
            full_name="System Administrator",
            hashed_password=User.hash_password("admin123"),  # Change this!
            role=UserRole.ADMIN,
            is_active=1,
            created_at=datetime.utcnow()
        )
        db.add(default_admin)
        db.commit()
        print("✅ Default admin user created (username: admin, password: admin123)")
        print("⚠️ IMPORTANT: Change the default password immediately!")

