"""
Dashboard Stats API Routes - SIMPLIFIED VERSION
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_view_analytics, can_manage_swaps, can_manage_repairs
from app.core.company_filter import get_company_user_ids
from app.models.user import User, UserRole
from app.models.swap import Swap, ResaleStatus
from app.models.sale import Sale
from app.models.repair import Repair
from app.models.repair_sale import RepairSale
from app.models.customer import Customer
from app.models.phone import Phone, PhoneStatus
from app.models.pending_resale import PendingResale, PhoneSaleStatus
from app.models.product_sale import ProductSale
from app.models.product import Product

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/cards")
def get_dashboard_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard cards based on user role - SIMPLIFIED VERSION
    """
    try:
        cards = []
        
        # Basic role-based cards without complex queries
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            # System admin cards
            cards.extend([
                {
                    "id": "system_status",
                    "title": "System Status",
                    "value": "Active",
                    "icon": "faServer",
                    "color": "green",
                    "visible_to": ["admin", "super_admin"]
                },
                {
                    "id": "system_version",
                    "title": "System Version",
                    "value": "v1.1.0",
                    "icon": "faCode",
                    "color": "blue",
                    "visible_to": ["admin", "super_admin"]
                }
            ])
        
        elif current_user.role in [UserRole.CEO, UserRole.MANAGER]:
            # Manager/CEO cards - simplified
            cards.extend([
                {
                    "id": "welcome",
                    "title": "Welcome",
                    "value": current_user.full_name or current_user.username,
                    "icon": "faUser",
                    "color": "blue",
                    "visible_to": ["ceo", "manager"]
                },
                {
                    "id": "role",
                    "title": "Role",
                    "value": current_user.role.value.title(),
                    "icon": "faCrown",
                    "color": "purple",
                    "visible_to": ["ceo", "manager"]
                },
                {
                    "id": "company",
                    "title": "Company",
                    "value": current_user.company_name or "SwapSync",
                    "icon": "faBuilding",
                    "color": "green",
                    "visible_to": ["ceo", "manager"]
                }
            ])
            
            # Try to add basic counts with error handling
            try:
                # Simple customer count
                customer_count = db.query(Customer).count()
                cards.append({
                    "id": "total_customers",
                    "title": "Total Customers",
                    "value": str(customer_count),
                    "icon": "faUsers",
                    "color": "blue",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting customer count: {e}")
            
            try:
                # Simple product count
                product_count = db.query(Product).count()
                cards.append({
                    "id": "total_products",
                    "title": "Total Products",
                    "value": str(product_count),
                    "icon": "faBox",
                    "color": "green",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting product count: {e}")
            
            try:
                # Simple repair count
                repair_count = db.query(Repair).count()
                cards.append({
                    "id": "total_repairs",
                    "title": "Total Repairs",
                    "value": str(repair_count),
                    "icon": "faTools",
                    "color": "orange",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting repair count: {e}")
        
        elif current_user.role == UserRole.REPAIRER:
            # Repairer cards - simplified
            cards.extend([
                {
                    "id": "welcome_repairer",
                    "title": "Welcome",
                    "value": current_user.full_name or current_user.username,
                    "icon": "faUser",
                    "color": "blue",
                    "visible_to": ["repairer"]
                },
                {
                    "id": "repairer_role",
                    "title": "Role",
                    "value": "Repairer",
                    "icon": "faTools",
                    "color": "orange",
                    "visible_to": ["repairer"]
                }
            ])
            
            try:
                # Simple repair count
                repair_count = db.query(Repair).count()
                cards.append({
                    "id": "total_repairs",
                    "title": "Total Repairs",
                    "value": str(repair_count),
                    "icon": "faWrench",
                    "color": "orange",
                    "visible_to": ["repairer"]
                })
            except Exception as e:
                print(f"Error getting repair count: {e}")
        
        elif current_user.role == UserRole.SHOP_KEEPER:
            # Shop keeper cards - simplified
            cards.extend([
                {
                    "id": "welcome_shopkeeper",
                    "title": "Welcome",
                    "value": current_user.full_name or current_user.username,
                    "icon": "faUser",
                    "color": "blue",
                    "visible_to": ["shop_keeper"]
                },
                {
                    "id": "shopkeeper_role",
                    "title": "Role",
                    "value": "Shop Keeper",
                    "icon": "faStore",
                    "color": "green",
                    "visible_to": ["shop_keeper"]
                }
            ])
        
        # Always add a status card
        cards.append({
            "id": "dashboard_status",
            "title": "Dashboard Status",
            "value": "Active",
            "icon": "faCheckCircle",
            "color": "green",
            "visible_to": [current_user.role.value]
        })
        
        return {
            "cards": cards,
            "user_role": current_user.role.value,
            "total_cards": len(cards),
            "status": "success"
        }
        
    except Exception as e:
        print(f"Critical error in get_dashboard_cards: {e}")
        import traceback
        traceback.print_exc()
        
        # Return minimal error response
        return {
            "cards": [
                {
                    "id": "error",
                    "title": "Dashboard Error",
                    "value": "Unable to load data",
                    "icon": "faExclamationTriangle",
                    "color": "red",
                    "visible_to": [current_user.role.value]
                }
            ],
            "user_role": current_user.role.value,
            "total_cards": 1,
            "status": "error",
            "error": str(e)
        }


@router.get("/test")
def test_dashboard(current_user: User = Depends(get_current_user)):
    """Test endpoint to verify dashboard access"""
    return {
        "message": "Dashboard access successful",
        "user": current_user.username,
        "role": current_user.role.value,
        "message": "Dashboard access OK"
    }
