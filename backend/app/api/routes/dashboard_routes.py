"""
Dashboard Stats API Routes - Role-based statistics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_view_analytics, can_manage_swaps, can_manage_repairs
from app.models.user import User, UserRole
from app.models.swap import Swap, ResaleStatus
from app.models.sale import Sale
from app.models.repair import Repair
from app.models.customer import Customer
from app.models.phone import Phone, PhoneStatus
from app.models.pending_resale import PendingResale, PhoneSaleStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/cards")
def get_dashboard_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard cards based on user role
    System Admin: System-level metrics only
    CEO: Business metrics only
    Shop Keeper/Repairer: Limited metrics
    """
    cards = []
    
    # SYSTEM ADMIN - System-level cards ONLY
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Total CEO Accounts
        total_ceos = db.query(func.count(User.id)).filter(
            User.role == UserRole.CEO
        ).scalar()
        
        cards.append({
            "id": "total_ceos",
            "title": "Total CEOs",
            "value": total_ceos,
            "icon": "faUserTie",
            "color": "purple",
            "visible_to": ["admin", "super_admin"]
        })
        
        # Total Users
        total_users = db.query(func.count(User.id)).scalar()
        
        cards.append({
            "id": "total_users",
            "title": "Total Users",
            "value": total_users,
            "icon": "faUsers",
            "color": "blue",
            "visible_to": ["admin", "super_admin"]
        })
        
        # System Version
        cards.append({
            "id": "system_version",
            "title": "System Version",
            "value": "v1.1.0",
            "icon": "faServer",
            "color": "green",
            "visible_to": ["admin", "super_admin"]
        })
        
        # Database Status
        total_tables = 10  # customers, phones, swaps, sales, repairs, users, etc.
        cards.append({
            "id": "database_status",
            "title": "Database Tables",
            "value": total_tables,
            "icon": "faDatabase",
            "color": "indigo",
            "visible_to": ["admin", "super_admin"]
        })
        
        return {
            "cards": cards,
            "user_role": current_user.role.value,
            "total_cards": len(cards)
        }
    
    # CEO & SHOP KEEPER - Business cards
    if current_user.role in [UserRole.CEO, UserRole.SHOP_KEEPER]:
        # Total Customers
        cards.append({
            "id": "total_customers",
            "title": "Total Customers",
            "value": db.query(func.count(Customer.id)).scalar(),
            "icon": "faUserCircle",
            "color": "blue",
            "visible_to": ["shop_keeper", "ceo"]
        })
        
        # Pending Resales Card - Use PendingResale table
        pending_resales = db.query(func.count(PendingResale.id)).filter(
            PendingResale.incoming_phone_id.isnot(None),
            PendingResale.incoming_phone_status != PhoneSaleStatus.SOLD
        ).scalar()
        
        cards.append({
            "id": "pending_resales",
            "title": "Pending Resales",
            "value": pending_resales,
            "icon": "faClock",
            "color": "yellow",
            "visible_to": ["shop_keeper", "ceo"]
        })
        
        # Completed Swaps Card - Use PendingResale table
        completed_swaps = db.query(func.count(PendingResale.id)).filter(
            PendingResale.incoming_phone_status == PhoneSaleStatus.SOLD
        ).scalar()
        
        cards.append({
            "id": "completed_swaps",
            "title": "Completed Swaps",
            "value": completed_swaps,
            "icon": "faCheckCircle",
            "color": "green",
            "visible_to": ["shop_keeper", "ceo"]
        })
        
        # Total Discounts Applied Card
        total_discounts = (
            db.query(func.sum(Swap.discount_amount)).scalar() or 0.0
        ) + (
            db.query(func.sum(Sale.discount_amount)).scalar() or 0.0
        )
        
        cards.append({
            "id": "total_discounts",
            "title": "Discounts Applied",
            "value": f"₵{total_discounts:.2f}",
            "icon": "faPercent",
            "color": "purple",
            "visible_to": ["shop_keeper", "ceo"]
        })
        
        # Available Phones - Exclude trade-ins waiting for resale
        available_phones = db.query(func.count(Phone.id)).filter(
            Phone.is_available == True,
            Phone.status != PhoneStatus.SWAPPED  # Exclude trade-ins
        ).scalar()
        
        cards.append({
            "id": "available_phones",
            "title": "Available Phones",
            "value": available_phones,
            "icon": "faMobileAlt",
            "color": "indigo",
            "visible_to": ["shop_keeper", "ceo"]
        })
    
    # REPAIRER - Repair cards only
    if current_user.role == UserRole.REPAIRER:
        # Total Customers
        cards.append({
            "id": "total_customers",
            "title": "Total Customers",
            "value": db.query(func.count(Customer.id)).scalar(),
            "icon": "faUserCircle",
            "color": "blue",
            "visible_to": ["repairer"]
        })
        
        # Pending Repairs Card
        pending_repairs = db.query(func.count(Repair.id)).filter(
            Repair.status.in_(["Pending", "In Progress"])
        ).scalar()
        
        cards.append({
            "id": "pending_repairs",
            "title": "Pending Repairs",
            "value": pending_repairs,
            "icon": "faTools",
            "color": "orange",
            "visible_to": ["repairer"]
        })
        
        # Completed Repairs Card
        completed_repairs = db.query(func.count(Repair.id)).filter(
            Repair.status.in_(["Completed", "Delivered"])
        ).scalar()
        
        cards.append({
            "id": "completed_repairs",
            "title": "Completed Repairs",
            "value": completed_repairs,
            "icon": "faCheckCircle",
            "color": "green",
            "visible_to": ["repairer"]
        })
    
    # CEO & MANAGER - Profit/Stats cards
    if current_user.role in [UserRole.CEO, UserRole.MANAGER]:
        # Total Profit from Swaps - Use PendingResale table
        total_profit = db.query(func.sum(PendingResale.profit_amount)).filter(
            PendingResale.incoming_phone_status == PhoneSaleStatus.SOLD
        ).scalar() or 0.0
        
        cards.append({
            "id": "total_profit",
            "title": "Total Profit (Swaps)",
            "value": f"₵{total_profit:.2f}",
            "icon": "faMoneyBillWave",
            "color": "green" if total_profit >= 0 else "red",
            "visible_to": ["ceo", "manager"]
        })
        
        # Total Sales Revenue
        total_sales = db.query(func.sum(Sale.amount_paid)).scalar() or 0.0
        
        cards.append({
            "id": "total_sales_revenue",
            "title": "Sales Revenue",
            "value": f"₵{total_sales:.2f}",
            "icon": "faMoneyBillWave",
            "color": "green",
            "visible_to": ["ceo"]
        })
        
        # Total Repairs Revenue
        total_repair_revenue = db.query(func.sum(Repair.cost)).scalar() or 0.0
        
        cards.append({
            "id": "repair_revenue",
            "title": "Repair Revenue",
            "value": f"₵{total_repair_revenue:.2f}",
            "icon": "faTools",
            "color": "blue",
            "visible_to": ["ceo"]
        })
    
    return {
        "cards": cards,
        "user_role": current_user.role.value,
        "total_cards": len(cards)
    }


@router.get("/stats/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive dashboard summary based on role
    """
    summary = {
        "user": {
            "id": current_user.id,
            "name": current_user.full_name,
            "role": current_user.role.value
        },
        "stats": {}
    }
    
    # Shop Keeper stats
    if can_manage_swaps(current_user):
        summary["stats"]["swaps"] = {
            "total": db.query(func.count(Swap.id)).scalar(),
            "pending_resales": db.query(func.count(Swap.id)).filter(
                Swap.resale_status == ResaleStatus.PENDING
            ).scalar(),
            "total_discounts": db.query(func.sum(Swap.discount_amount)).scalar() or 0.0
        }
        
        summary["stats"]["sales"] = {
            "total": db.query(func.count(Sale.id)).scalar(),
            "total_revenue": db.query(func.sum(Sale.amount_paid)).scalar() or 0.0,
            "total_discounts": db.query(func.sum(Sale.discount_amount)).scalar() or 0.0
        }
        
        summary["stats"]["phones"] = {
            "total": db.query(func.count(Phone.id)).scalar(),
            "available": db.query(func.count(Phone.id)).filter(Phone.is_available == True).scalar()
        }
    
    # Repairer stats
    if can_manage_repairs(current_user):
        summary["stats"]["repairs"] = {
            "total": db.query(func.count(Repair.id)).scalar(),
            "pending": db.query(func.count(Repair.id)).filter(
                Repair.status.in_(["Pending", "In Progress"])
            ).scalar(),
            "completed": db.query(func.count(Repair.id)).filter(
                Repair.status.in_(["Completed", "Delivered"])
            ).scalar(),
            "total_revenue": db.query(func.sum(Repair.cost)).scalar() or 0.0
        }
    
    # CEO/Admin profit stats
    if can_view_analytics(current_user):
        summary["stats"]["profit"] = {
            "from_swaps": db.query(func.sum(Swap.profit_or_loss)).filter(
                Swap.resale_status == ResaleStatus.SOLD
            ).scalar() or 0.0,
            "from_sales": db.query(func.sum(Sale.amount_paid)).scalar() or 0.0,
            "from_repairs": db.query(func.sum(Repair.cost)).scalar() or 0.0
        }
        
        # Calculate total profit
        total_profit = (
            summary["stats"]["profit"]["from_swaps"] +
            summary["stats"]["profit"]["from_sales"] +
            summary["stats"]["profit"]["from_repairs"]
        )
        summary["stats"]["profit"]["total"] = total_profit
    
    return summary

