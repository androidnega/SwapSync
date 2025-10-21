"""
Company Data Isolation Utility
Provides helper functions to filter data by company (CEO/Manager + their staff)
"""
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from typing import List


def get_company_user_ids(db: Session, current_user: User) -> List[int]:
    """
    Get all user IDs for the current user's company.
    
    Returns:
    - For SUPER_ADMIN/ADMIN: None (means no filtering, see all data)
    - For CEO/MANAGER: [their_id] + [all their staff IDs]
    - For SHOP_KEEPER/REPAIRER: [their_id] + [their CEO id] + [all siblings' IDs]
    
    This ensures complete data isolation between companies.
    """
    # Super admins see everything (no filtering)
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        return None
    
    # If CEO/Manager, get their ID + all their staff
    if current_user.role in [UserRole.CEO, UserRole.MANAGER]:
        staff = db.query(User).filter(User.parent_user_id == current_user.id).all()
        return [current_user.id] + [s.id for s in staff]
    
    # If staff member, get their manager + all sibling staff
    if current_user.parent_user_id:
        # Get the manager/CEO
        manager = db.query(User).filter(User.id == current_user.parent_user_id).first()
        if manager:
            # Get all staff under this manager
            staff = db.query(User).filter(User.parent_user_id == manager.id).all()
            return [manager.id] + [s.id for s in staff]
    
    # Fallback: only return current user's ID
    return [current_user.id]


def filter_by_company(query, current_user: User, db: Session, field_name: str = 'created_by_user_id'):
    """
    Apply company filtering to a SQLAlchemy query.
    
    Args:
        query: SQLAlchemy query object
        current_user: Current logged-in user
        db: Database session
        field_name: Name of the field to filter by (default: 'created_by_user_id')
    
    Returns:
        Filtered query
    """
    company_user_ids = get_company_user_ids(db, current_user)
    
    # If None, admin sees all (no filtering)
    if company_user_ids is None:
        return query
    
    # Filter by company user IDs
    return query.filter(getattr(query.column_descriptions[0]['type'], field_name).in_(company_user_ids))


def is_resource_accessible(resource, current_user: User, db: Session) -> bool:
    """
    Check if a resource is accessible by the current user's company.
    
    Args:
        resource: Database model instance with created_by_user_id
        current_user: Current logged-in user
        db: Database session
    
    Returns:
        True if accessible, False otherwise
    """
    # Super admins can access everything
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        return True
    
    # Get company user IDs
    company_user_ids = get_company_user_ids(db, current_user)
    
    # Check if resource was created by someone in the company
    if hasattr(resource, 'created_by_user_id'):
        return resource.created_by_user_id in company_user_ids
    
    # Default: not accessible
    return False

