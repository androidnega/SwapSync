"""
User Model - Authentication and role-based access control
"""
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum
import bcrypt
from app.core.database import Base


class UserRole(PyEnum):
    """User roles for access control"""
    SUPER_ADMIN = "super_admin"
    MANAGER = "manager"  # Renamed from CEO
    CEO = "manager"  # Backward compatibility alias
    SHOP_KEEPER = "shop_keeper"
    REPAIRER = "repairer"
    ADMIN = "admin"  # Legacy - maps to SUPER_ADMIN


class User(Base):
    """
    User model for authentication and authorization
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(20), unique=True, nullable=True, index=True)  # MGR-0001, SHOP-0001, etc
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    phone_number = Column(String, nullable=True)  # For password reset verification
    full_name = Column(String, nullable=False)
    display_name = Column(String(255), nullable=True)  # Customizable display name
    profile_picture = Column(String, nullable=True)  # Base64 or URL
    company_name = Column(String, nullable=True)  # Company name for Managers
    use_company_sms_branding = Column(Integer, default=0, nullable=True)  # 1=use company name in SMS, 0=use SwapSync (nullable for migration compatibility)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.SHOP_KEEPER, nullable=False)
    parent_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who created this user
    audit_code = Column(String, nullable=True)  # For System Admin access to Manager data
    is_active = Column(Integer, default=1)  # 1=active, 0=inactive
    # TODO: Re-enable after migration runs: must_change_password = Column(Integer, default=1, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    current_session_id = Column(Integer, nullable=True)  # Track current active session
    
    # Relationships
    created_by = relationship("User", remote_side=[id], foreign_keys=[parent_user_id], backref="created_users")

    def generate_unique_id(self, db_session):
        """Generate role-based unique ID"""
        from sqlalchemy import func
        
        role_prefixes = {
            'super_admin': 'ADM',
            'admin': 'ADM',
            'manager': 'MGR',
            'ceo': 'MGR',
            'shop_keeper': 'SHOP',
            'repairer': 'TECH'
        }
        
        role_str = str(self.role.value if hasattr(self.role, 'value') else self.role)
        prefix = role_prefixes.get(role_str, 'USER')
        
        # Count existing users with same role
        count = db_session.query(func.count(User.id)).filter(User.role == self.role).scalar() or 0
        self.unique_id = f"{prefix}-{str(count + 1).zfill(4)}"
        return self.unique_id

    def __repr__(self):
        return f"<User({self.unique_id or f'#{self.id}'}, {self.username}, {self.role})>"

    def verify_password(self, plain_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), self.hashed_password.encode('utf-8'))

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password"""
        # Truncate password to 72 bytes for bcrypt compatibility
        password_bytes = password.encode('utf-8')[:72]
        hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        return hashed.decode('utf-8')
    
    @staticmethod
    def generate_audit_code() -> str:
        """Generate a random 6-digit audit code for Manager"""
        import random
        return str(random.randint(100000, 999999))
    
    def verify_audit_code(self, code: str) -> bool:
        """Verify audit code for admin access"""
        return self.audit_code == code if self.audit_code else False

    @property
    def is_shop_keeper(self):
        """Check if user is a shop keeper"""
        return self.role == UserRole.SHOP_KEEPER

    @property
    def is_repairer(self):
        """Check if user is a repairer"""
        return self.role == UserRole.REPAIRER

    @property
    def is_admin(self):
        """Check if user is an admin"""
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @property
    def is_super_admin(self):
        """Check if user is a super admin"""
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @property
    def is_manager(self):
        """Check if user is a Manager"""
        return self.role in [UserRole.MANAGER, UserRole.CEO]
    
    @property
    def is_ceo(self):
        """Check if user is a Manager (backward compatibility alias)"""
        return self.is_manager
    
    def can_create_role(self, target_role: 'UserRole') -> bool:
        """Check if this user can create a user with target_role"""
        if self.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            # Super admin can create Managers
            return target_role in [UserRole.MANAGER, UserRole.CEO]
        elif self.role in [UserRole.MANAGER, UserRole.CEO]:
            # Manager can create shop keepers and repairers
            return target_role in [UserRole.SHOP_KEEPER, UserRole.REPAIRER]
        else:
            # Shop keepers and repairers cannot create users
            return False

