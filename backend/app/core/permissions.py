"""
Permission decorators and helpers for role-based access control
"""
from functools import wraps
from fastapi import HTTPException, status, Depends
from typing import List
from app.models.user import User, UserRole


def check_roles(allowed_roles: List[UserRole], current_user: User):
    """
    Check if current user has one of the allowed roles
    Raises HTTPException if not authorized
    """
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your role ({current_user.role.value}) is not authorized. Required roles: {[r.value for r in allowed_roles]}"
        )
    return True


# Role-based access control helpers
def can_manage_swaps(user: User) -> bool:
    """Check if user can manage swaps (Manager can swap, Shopkeeper can swap)"""
    return user.role in [
        UserRole.SHOP_KEEPER, 
        UserRole.MANAGER,
        UserRole.CEO, 
        UserRole.ADMIN, 
        UserRole.SUPER_ADMIN
    ]


def can_record_sales(user: User) -> bool:
    """Check if user can record sales (Shopkeeper ONLY, Admin with code)"""
    return user.role in [
        UserRole.SHOP_KEEPER,
        UserRole.ADMIN,  # Admin can record sales with authorization code
        UserRole.SUPER_ADMIN
    ]


def can_book_repairs(user: User) -> bool:
    """Check if user can book repairs (Repairer ONLY, Shopkeeper for walk-ins)"""
    return user.role in [
        UserRole.REPAIRER,
        UserRole.SHOP_KEEPER  # Shopkeeper can book for walk-in customers
    ]


def can_manage_repairs(user: User) -> bool:
    """Check if user can VIEW/MANAGE repairs (but not book)"""
    return user.role in [
        UserRole.REPAIRER, 
        UserRole.MANAGER,
        UserRole.CEO, 
        UserRole.ADMIN, 
        UserRole.SUPER_ADMIN
    ]


def can_manage_customers(user: User) -> bool:
    """Check if user can manage customers"""
    return user.role in [
        UserRole.SHOP_KEEPER, 
        UserRole.MANAGER,
        UserRole.CEO, 
        UserRole.ADMIN, 
        UserRole.SUPER_ADMIN
    ]


def can_create_phones(user: User) -> bool:
    """Check if user can CREATE phones (Manager-only)"""
    return user.role in [
        UserRole.MANAGER,
        UserRole.CEO  # Backward compatibility
    ]


def can_view_phones(user: User) -> bool:
    """Check if user can VIEW phones (Manager + Shopkeeper)"""
    return user.role in [
        UserRole.SHOP_KEEPER, 
        UserRole.MANAGER,
        UserRole.CEO
    ]


def can_manage_phones(user: User) -> bool:
    """Check if user can manage phone inventory (legacy - use can_create_phones or can_view_phones)"""
    return user.role in [
        UserRole.SHOP_KEEPER, 
        UserRole.MANAGER,
        UserRole.CEO, 
        UserRole.ADMIN, 
        UserRole.SUPER_ADMIN
    ]


def can_view_analytics(user: User) -> bool:
    """Check if user can view analytics dashboard"""
    return user.role in [
        UserRole.MANAGER,
        UserRole.CEO, 
        UserRole.ADMIN, 
        UserRole.SUPER_ADMIN
    ]


def can_manage_staff(user: User) -> bool:
    """Check if user can manage staff (create/view users)"""
    return user.role in [
        UserRole.MANAGER,
        UserRole.CEO, 
        UserRole.ADMIN, 
        UserRole.SUPER_ADMIN
    ]


def can_manage_system_settings(user: User) -> bool:
    """Check if user can manage system settings (SMS, backups, etc.)"""
    return user.role in [
        UserRole.ADMIN, 
        UserRole.SUPER_ADMIN
    ]


def is_admin_or_above(user: User) -> bool:
    """Check if user is admin or super admin"""
    return user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]


def is_manager_or_above(user: User) -> bool:
    """Check if user is Manager, admin, or super admin"""
    return user.role in [UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]


def is_ceo_or_above(user: User) -> bool:
    """Check if user is Manager/CEO, admin, or super admin (backward compatibility alias)"""
    return is_manager_or_above(user)


# Permission enforcement functions (raise HTTPException if not allowed)
def require_shopkeeper(user: User):
    """Require shopkeeper role (for sales)"""
    if not can_record_sales(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only shopkeepers can record sales. Managers can view sales but not create them."
        )


def require_repairer(user: User):
    """Require repairer role (for booking repairs)"""
    if not can_book_repairs(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only repairers and shopkeepers can book repairs. Managers can view repairs but not create them."
        )


def require_manager(user: User):
    """Require manager role or above"""
    if not is_manager_or_above(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required for this operation"
        )


def require_role(allowed_roles: List[str]):
    """
    Dependency function that requires specific roles
    Usage: current_user: User = Depends(require_role(['manager', 'ceo']))
    """
    from app.core.auth import get_current_user
    
    def role_checker(current_user: User = Depends(get_current_user)):
        # Convert string roles to UserRole enum
        role_map = {
            'shop_keeper': UserRole.SHOP_KEEPER,
            'manager': UserRole.MANAGER,
            'ceo': UserRole.CEO,
            'repairer': UserRole.REPAIRER,
            'admin': UserRole.ADMIN,
            'super_admin': UserRole.SUPER_ADMIN
        }
        
        allowed_role_enums = [role_map.get(r, r) for r in allowed_roles if r in role_map]
        
        if current_user.role not in allowed_role_enums:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker