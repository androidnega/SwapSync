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
            # Manager/CEO cards - REAL BUSINESS METRICS
            
            # Get company user IDs for filtering
            try:
                company_user_ids = get_company_user_ids(db, current_user)
                if company_user_ids is None:
                    company_user_ids = [current_user.id]
            except Exception as e:
                print(f"Error getting company user IDs: {e}")
                company_user_ids = [current_user.id]
            
            # TODAY'S SALES REVENUE
            try:
                today = datetime.now().date()
                today_sales = db.query(func.sum(ProductSale.total_amount)).filter(
                    func.date(ProductSale.created_at) == today,
                    ProductSale.created_by_user_id.in_(company_user_ids)
                ).scalar() or 0.0
                
                cards.append({
                    "id": "today_revenue",
                    "title": "Today's Revenue",
                    "value": f"₵{today_sales:.2f}",
                    "icon": "faMoneyBillWave",
                    "color": "green",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting today's revenue: {e}")
            
            # TOTAL REVENUE (ALL TIME)
            try:
                total_revenue = db.query(func.sum(ProductSale.total_amount)).filter(
                    ProductSale.created_by_user_id.in_(company_user_ids)
                ).scalar() or 0.0
                cards.append({
                    "id": "total_revenue",
                    "title": "Total Revenue",
                    "value": f"₵{total_revenue:.2f}",
                    "icon": "faChartLine",
                    "color": "blue",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting total revenue: {e}")
            
            # TOTAL SALES COUNT
            try:
                total_sales_count = db.query(ProductSale).filter(
                    ProductSale.created_by_user_id.in_(company_user_ids)
                ).count()
                cards.append({
                    "id": "total_sales",
                    "title": "Total Sales",
                    "value": str(total_sales_count),
                    "icon": "faShoppingCart",
                    "color": "purple",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting total sales count: {e}")
            
            # AVAILABLE PRODUCTS IN STOCK
            try:
                available_products = db.query(Product).filter(
                    Product.quantity > 0,
                    Product.is_active == True,
                    Product.created_by_user_id.in_(company_user_ids)
                ).count()
                cards.append({
                    "id": "available_products",
                    "title": "Products in Stock",
                    "value": str(available_products),
                    "icon": "faBox",
                    "color": "green",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting available products: {e}")
            
            # LOW STOCK PRODUCTS
            try:
                low_stock_products = db.query(Product).filter(
                    Product.quantity <= 5,
                    Product.quantity > 0,
                    Product.is_active == True,
                    Product.created_by_user_id.in_(company_user_ids)
                ).count()
                cards.append({
                    "id": "low_stock",
                    "title": "Low Stock Items",
                    "value": str(low_stock_products),
                    "icon": "faExclamationTriangle",
                    "color": "orange" if low_stock_products > 0 else "green",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting low stock products: {e}")
            
            # TOTAL CUSTOMERS
            try:
                customer_count = db.query(Customer).filter(
                    Customer.created_by_user_id.in_(company_user_ids)
                ).count()
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
            
            # ACTIVE REPAIRS
            try:
                active_repairs = db.query(Repair).filter(
                    Repair.status.in_(['Pending', 'In Progress']),
                    Repair.created_by_user_id.in_(company_user_ids)
                ).count()
                cards.append({
                    "id": "active_repairs",
                    "title": "Active Repairs",
                    "value": str(active_repairs),
                    "icon": "faTools",
                    "color": "orange",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting active repairs: {e}")
            
            # COMPLETED REPAIRS
            try:
                completed_repairs = db.query(Repair).filter(
                    Repair.status.in_(['Completed', 'Delivered']),
                    Repair.created_by_user_id.in_(company_user_ids)
                ).count()
                cards.append({
                    "id": "completed_repairs",
                    "title": "Completed Repairs",
                    "value": str(completed_repairs),
                    "icon": "faCheckCircle",
                    "color": "green",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting completed repairs: {e}")
            
            # TOTAL REPAIR REVENUE
            try:
                repair_revenue = db.query(func.sum(Repair.cost)).filter(
                    Repair.status.in_(['Completed', 'Delivered']),
                    Repair.created_by_user_id.in_(company_user_ids)
                ).scalar() or 0.0
                cards.append({
                    "id": "repair_revenue",
                    "title": "Repair Revenue",
                    "value": f"₵{repair_revenue:.2f}",
                    "icon": "faWrench",
                    "color": "teal",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting repair revenue: {e}")
            
            # PENDING SWAPS
            try:
                pending_swaps = db.query(Swap).filter(
                    Swap.status == 'pending',
                    Swap.created_by_user_id.in_(company_user_ids)
                ).count()
                cards.append({
                    "id": "pending_swaps",
                    "title": "Pending Swaps",
                    "value": str(pending_swaps),
                    "icon": "faExchangeAlt",
                    "color": "yellow",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting pending swaps: {e}")
            
            # COMPLETED SWAPS
            try:
                completed_swaps = db.query(Swap).filter(
                    Swap.status == 'completed',
                    Swap.created_by_user_id.in_(company_user_ids)
                ).count()
                cards.append({
                    "id": "completed_swaps",
                    "title": "Completed Swaps",
                    "value": str(completed_swaps),
                    "icon": "faHandshake",
                    "color": "green",
                    "visible_to": ["ceo", "manager"]
                })
            except Exception as e:
                print(f"Error getting completed swaps: {e}")
        
        elif current_user.role == UserRole.REPAIRER:
            # Repairer cards - REAL REPAIR METRICS
            
            # MY ACTIVE REPAIRS
            try:
                my_active_repairs = db.query(Repair).filter(
                    Repair.staff_id == current_user.id,
                    Repair.status.in_(['Pending', 'In Progress'])
                ).count()
                cards.append({
                    "id": "my_active_repairs",
                    "title": "My Active Repairs",
                    "value": str(my_active_repairs),
                    "icon": "faTools",
                    "color": "orange",
                    "visible_to": ["repairer"]
                })
            except Exception as e:
                print(f"Error getting my active repairs: {e}")
            
            # MY COMPLETED REPAIRS
            try:
                my_completed_repairs = db.query(Repair).filter(
                    Repair.staff_id == current_user.id,
                    Repair.status.in_(['Completed', 'Delivered'])
                ).count()
                cards.append({
                    "id": "my_completed_repairs",
                    "title": "My Completed Repairs",
                    "value": str(my_completed_repairs),
                    "icon": "faCheckCircle",
                    "color": "green",
                    "visible_to": ["repairer"]
                })
            except Exception as e:
                print(f"Error getting my completed repairs: {e}")
            
            # MY REPAIR REVENUE
            try:
                my_repair_revenue = db.query(func.sum(Repair.cost)).filter(
                    Repair.staff_id == current_user.id,
                    Repair.status.in_(['Completed', 'Delivered'])
                ).scalar() or 0.0
                cards.append({
                    "id": "my_repair_revenue",
                    "title": "My Repair Revenue",
                    "value": f"₵{my_repair_revenue:.2f}",
                    "icon": "faMoneyBillWave",
                    "color": "blue",
                    "visible_to": ["repairer"]
                })
            except Exception as e:
                print(f"Error getting my repair revenue: {e}")
            
            # TODAY'S REPAIRS
            try:
                today = datetime.now().date()
                today_repairs = db.query(Repair).filter(
                    Repair.staff_id == current_user.id,
                    func.date(Repair.created_at) == today
                ).count()
                cards.append({
                    "id": "today_repairs",
                    "title": "Today's Repairs",
                    "value": str(today_repairs),
                    "icon": "faCalendarDay",
                    "color": "purple",
                    "visible_to": ["repairer"]
                })
            except Exception as e:
                print(f"Error getting today's repairs: {e}")
            
            # ITEMS SOLD IN REPAIRS
            try:
                items_sold = db.query(RepairSale).join(Repair).filter(
                    Repair.staff_id == current_user.id
                ).count()
                cards.append({
                    "id": "items_sold",
                    "title": "Items Sold",
                    "value": str(items_sold),
                    "icon": "faShoppingCart",
                    "color": "teal",
                    "visible_to": ["repairer"]
                })
            except Exception as e:
                print(f"Error getting items sold: {e}")
        
        elif current_user.role == UserRole.SHOP_KEEPER:
            # Shop keeper cards - REAL SALES METRICS
            
            # TODAY'S SALES
            try:
                today = datetime.now().date()
                today_sales = db.query(ProductSale).filter(
                    func.date(ProductSale.created_at) == today,
                    ProductSale.created_by_user_id == current_user.id
                ).count()
                cards.append({
                    "id": "today_sales",
                    "title": "Today's Sales",
                    "value": str(today_sales),
                    "icon": "faShoppingCart",
                    "color": "green",
                    "visible_to": ["shop_keeper"]
                })
            except Exception as e:
                print(f"Error getting today's sales: {e}")
            
            # TODAY'S REVENUE
            try:
                today = datetime.now().date()
                today_revenue = db.query(func.sum(ProductSale.total_amount)).filter(
                    func.date(ProductSale.created_at) == today,
                    ProductSale.created_by_user_id == current_user.id
                ).scalar() or 0.0
                cards.append({
                    "id": "today_revenue",
                    "title": "Today's Revenue",
                    "value": f"₵{today_revenue:.2f}",
                    "icon": "faMoneyBillWave",
                    "color": "blue",
                    "visible_to": ["shop_keeper"]
                })
            except Exception as e:
                print(f"Error getting today's revenue: {e}")
            
            # MY TOTAL SALES
            try:
                my_total_sales = db.query(ProductSale).filter(
                    ProductSale.created_by_user_id == current_user.id
                ).count()
                cards.append({
                    "id": "my_total_sales",
                    "title": "My Total Sales",
                    "value": str(my_total_sales),
                    "icon": "faChartBar",
                    "color": "purple",
                    "visible_to": ["shop_keeper"]
                })
            except Exception as e:
                print(f"Error getting my total sales: {e}")
            
            # MY TOTAL REVENUE
            try:
                my_total_revenue = db.query(func.sum(ProductSale.total_amount)).filter(
                    ProductSale.created_by_user_id == current_user.id
                ).scalar() or 0.0
                cards.append({
                    "id": "my_total_revenue",
                    "title": "My Total Revenue",
                    "value": f"₵{my_total_revenue:.2f}",
                    "icon": "faDollarSign",
                    "color": "green",
                    "visible_to": ["shop_keeper"]
                })
            except Exception as e:
                print(f"Error getting my total revenue: {e}")
            
            # AVAILABLE PRODUCTS
            try:
                # Get company user IDs for shop keeper
                company_user_ids = get_company_user_ids(db, current_user)
                if company_user_ids is None:
                    company_user_ids = [current_user.id]
                
                available_products = db.query(Product).filter(
                    Product.quantity > 0,
                    Product.is_active == True,
                    Product.created_by_user_id.in_(company_user_ids)
                ).count()
                cards.append({
                    "id": "available_products",
                    "title": "Available Products",
                    "value": str(available_products),
                    "icon": "faBox",
                    "color": "teal",
                    "visible_to": ["shop_keeper"]
                })
            except Exception as e:
                print(f"Error getting available products: {e}")
            
            # LOW STOCK ALERT
            try:
                low_stock = db.query(Product).filter(
                    Product.quantity <= 5,
                    Product.quantity > 0,
                    Product.is_active == True,
                    Product.created_by_user_id.in_(company_user_ids)
                ).count()
                cards.append({
                    "id": "low_stock_alert",
                    "title": "Low Stock Alert",
                    "value": str(low_stock),
                    "icon": "faExclamationTriangle",
                    "color": "orange" if low_stock > 0 else "green",
                    "visible_to": ["shop_keeper"]
                })
            except Exception as e:
                print(f"Error getting low stock: {e}")
        
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
