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
            
            # ========== COMPREHENSIVE HUB METRICS ==========
            
            # PRODUCT HUB METRICS
            try:
                # Product Hub Revenue
                product_hub_revenue = db.query(func.sum(ProductSale.total_amount)).filter(
                    ProductSale.created_by_user_id.in_(company_user_ids)
                ).scalar() or 0.0
                
                # Product Hub Cost
                product_hub_cost = db.query(func.sum(ProductSale.quantity * Product.cost_price)).join(Product).filter(
                    ProductSale.created_by_user_id.in_(company_user_ids)
                ).scalar() or 0.0
                
                # Product Hub Profit
                product_hub_profit = product_hub_revenue - product_hub_cost
                
                cards.append({
                    "id": "product_hub_revenue",
                    "title": "Product Hub Revenue",
                    "value": f"₵{product_hub_revenue:.2f}",
                    "icon": "faShoppingCart",
                    "color": "green",
                    "visible_to": ["ceo", "manager"]
                })
                
                cards.append({
                    "id": "product_hub_profit",
                    "title": "Product Hub Profit",
                    "value": f"₵{product_hub_profit:.2f}",
                    "icon": "faDollarSign",
                    "color": "green" if product_hub_profit >= 0 else "red",
                    "visible_to": ["ceo", "manager"]
                })
                
                # Product Hub Items Sold
                product_hub_items_sold = db.query(func.sum(ProductSale.quantity)).filter(
                    ProductSale.created_by_user_id.in_(company_user_ids)
                ).scalar() or 0
                
                cards.append({
                    "id": "product_hub_items_sold",
                    "title": "Product Hub Items Sold",
                    "value": str(int(product_hub_items_sold)),
                    "icon": "faBox",
                    "color": "blue",
                    "visible_to": ["ceo", "manager"]
                })
                
            except Exception as e:
                print(f"Error getting product hub metrics: {e}")
            
            # REPAIRER HUB METRICS
            try:
                # Repairer Hub Service Revenue
                repairer_service_revenue = db.query(func.sum(Repair.cost)).filter(
                    Repair.created_by_user_id.in_(company_user_ids),
                    Repair.status.in_(['Completed', 'Delivered'])
                ).scalar() or 0.0
                
                # Repairer Hub Items Revenue (from repair sales)
                repairer_items_revenue = db.query(func.sum(RepairSale.unit_price * RepairSale.quantity)).join(Repair).filter(
                    Repair.created_by_user_id.in_(company_user_ids)
                ).scalar() or 0.0
                
                # Repairer Hub Items Cost
                repairer_items_cost = db.query(func.sum(RepairSale.cost_price * RepairSale.quantity)).join(Repair).filter(
                    Repair.created_by_user_id.in_(company_user_ids)
                ).scalar() or 0.0
                
                # Repairer Hub Items Profit
                repairer_items_profit = repairer_items_revenue - repairer_items_cost
                
                # Total Repairer Hub Revenue
                repairer_total_revenue = repairer_service_revenue + repairer_items_revenue
                
                # Total Repairer Hub Profit (service is 100% profit + items profit)
                repairer_total_profit = repairer_service_revenue + repairer_items_profit
                
                cards.append({
                    "id": "repairer_hub_revenue",
                    "title": "Repairer Hub Revenue",
                    "value": f"₵{repairer_total_revenue:.2f}",
                    "icon": "faTools",
                    "color": "orange",
                    "visible_to": ["ceo", "manager"]
                })
                
                cards.append({
                    "id": "repairer_hub_profit",
                    "title": "Repairer Hub Profit",
                    "value": f"₵{repairer_total_profit:.2f}",
                    "icon": "faDollarSign",
                    "color": "green" if repairer_total_profit >= 0 else "red",
                    "visible_to": ["ceo", "manager"]
                })
                
                # Repairer Hub Items Sold
                repairer_items_sold = db.query(func.sum(RepairSale.quantity)).join(Repair).filter(
                    Repair.created_by_user_id.in_(company_user_ids)
                ).scalar() or 0
                
                cards.append({
                    "id": "repairer_hub_items_sold",
                    "title": "Repairer Hub Items Sold",
                    "value": str(int(repairer_items_sold)),
                    "icon": "faWrench",
                    "color": "orange",
                    "visible_to": ["ceo", "manager"]
                })
                
            except Exception as e:
                print(f"Error getting repairer hub metrics: {e}")
            
            # SWAPPING HUB METRICS
            try:
                # Swapping Hub Revenue (from completed swaps)
                swapping_hub_revenue = db.query(func.sum(Swap.amount_paid)).filter(
                    Swap.created_by_user_id.in_(company_user_ids),
                    Swap.status == 'completed'
                ).scalar() or 0.0
                
                # Swapping Hub Profit (from pending resales)
                swapping_hub_profit = db.query(func.sum(PendingResale.profit_amount)).filter(
                    PendingResale.attending_staff_id.in_(company_user_ids),
                    PendingResale.incoming_phone_status == PhoneSaleStatus.SOLD
                ).scalar() or 0.0
                
                cards.append({
                    "id": "swapping_hub_revenue",
                    "title": "Swapping Hub Revenue",
                    "value": f"₵{swapping_hub_revenue:.2f}",
                    "icon": "faExchangeAlt",
                    "color": "blue",
                    "visible_to": ["ceo", "manager"]
                })
                
                cards.append({
                    "id": "swapping_hub_profit",
                    "title": "Swapping Hub Profit",
                    "value": f"₵{swapping_hub_profit:.2f}",
                    "icon": "faDollarSign",
                    "color": "green" if swapping_hub_profit >= 0 else "red",
                    "visible_to": ["ceo", "manager"]
                })
                
                # Swapping Hub Phones Swapped
                swapping_phones_count = db.query(Swap).filter(
                    Swap.created_by_user_id.in_(company_user_ids),
                    Swap.status == 'completed'
                ).count()
                
                cards.append({
                    "id": "swapping_hub_phones",
                    "title": "Swapping Hub Phones",
                    "value": str(swapping_phones_count),
                    "icon": "faMobileAlt",
                    "color": "blue",
                    "visible_to": ["ceo", "manager"]
                })
                
            except Exception as e:
                print(f"Error getting swapping hub metrics: {e}")
            
            # SHOPKEEPER METRICS
            try:
                # Get shopkeeper user IDs (staff with shop_keeper role)
                shopkeeper_ids = db.query(User.id).filter(
                    User.parent_user_id == current_user.id,
                    User.role == UserRole.SHOP_KEEPER
                ).all()
                shopkeeper_ids = [s.id for s in shopkeeper_ids]
                
                if shopkeeper_ids:
                    # Shopkeeper Sales Count
                    shopkeeper_sales_count = db.query(ProductSale).filter(
                        ProductSale.created_by_user_id.in_(shopkeeper_ids)
                    ).count()
                    
                    # Shopkeeper Revenue
                    shopkeeper_revenue = db.query(func.sum(ProductSale.total_amount)).filter(
                        ProductSale.created_by_user_id.in_(shopkeeper_ids)
                    ).scalar() or 0.0
                    
                    # Shopkeeper Items Sold
                    shopkeeper_items_sold = db.query(func.sum(ProductSale.quantity)).filter(
                        ProductSale.created_by_user_id.in_(shopkeeper_ids)
                    ).scalar() or 0
                    
                    cards.append({
                        "id": "shopkeeper_sales_count",
                        "title": "Shopkeeper Sales",
                        "value": str(shopkeeper_sales_count),
                        "icon": "faStore",
                        "color": "purple",
                        "visible_to": ["ceo", "manager"]
                    })
                    
                    cards.append({
                        "id": "shopkeeper_revenue",
                        "title": "Shopkeeper Revenue",
                        "value": f"₵{shopkeeper_revenue:.2f}",
                        "icon": "faMoneyBillWave",
                        "color": "purple",
                        "visible_to": ["ceo", "manager"]
                    })
                    
                    cards.append({
                        "id": "shopkeeper_items_sold",
                        "title": "Shopkeeper Items Sold",
                        "value": str(int(shopkeeper_items_sold)),
                        "icon": "faShoppingBag",
                        "color": "purple",
                        "visible_to": ["ceo", "manager"]
                    })
                
            except Exception as e:
                print(f"Error getting shopkeeper metrics: {e}")
            
            # REPAIRER METRICS (Staff with repairer role)
            try:
                # Get repairer user IDs (staff with repairer role)
                repairer_ids = db.query(User.id).filter(
                    User.parent_user_id == current_user.id,
                    User.role == UserRole.REPAIRER
                ).all()
                repairer_ids = [r.id for r in repairer_ids]
                
                if repairer_ids:
                    # Repairer Repairs Count
                    repairer_repairs_count = db.query(Repair).filter(
                        Repair.staff_id.in_(repairer_ids)
                    ).count()
                    
                    # Repairer Revenue
                    repairer_revenue = db.query(func.sum(Repair.cost)).filter(
                        Repair.staff_id.in_(repairer_ids),
                        Repair.status.in_(['Completed', 'Delivered'])
                    ).scalar() or 0.0
                    
                    # Repairer Items Sold
                    repairer_items_sold = db.query(func.sum(RepairSale.quantity)).join(Repair).filter(
                        Repair.staff_id.in_(repairer_ids)
                    ).scalar() or 0
                    
                    cards.append({
                        "id": "repairer_repairs_count",
                        "title": "Repairer Repairs",
                        "value": str(repairer_repairs_count),
                        "icon": "faTools",
                        "color": "orange",
                        "visible_to": ["ceo", "manager"]
                    })
                    
                    cards.append({
                        "id": "repairer_revenue",
                        "title": "Repairer Revenue",
                        "value": f"₵{repairer_revenue:.2f}",
                        "icon": "faMoneyBillWave",
                        "color": "orange",
                        "visible_to": ["ceo", "manager"]
                    })
                    
                    cards.append({
                        "id": "repairer_items_sold",
                        "title": "Repairer Items Sold",
                        "value": str(int(repairer_items_sold)),
                        "icon": "faWrench",
                        "color": "orange",
                        "visible_to": ["ceo", "manager"]
                    })
                
            except Exception as e:
                print(f"Error getting repairer metrics: {e}")
            
            # ========== TOTAL SYSTEM METRICS ==========
            
            # TOTAL SYSTEM PROFIT (All Hubs Combined)
            try:
                # Calculate total profit from all sources
                total_system_profit = 0.0
                
                # Product Hub Profit (already calculated above)
                product_hub_profit = product_hub_revenue - product_hub_cost
                total_system_profit += product_hub_profit
                
                # Repairer Hub Profit (already calculated above)
                repairer_total_profit = repairer_service_revenue + repairer_items_profit
                total_system_profit += repairer_total_profit
                
                # Swapping Hub Profit (already calculated above)
                swapping_hub_profit = db.query(func.sum(PendingResale.profit_amount)).filter(
                    PendingResale.attending_staff_id.in_(company_user_ids),
                    PendingResale.incoming_phone_status == PhoneSaleStatus.SOLD
                ).scalar() or 0.0
                total_system_profit += swapping_hub_profit
                
                cards.append({
                    "id": "total_system_profit",
                    "title": "Total System Profit",
                    "value": f"₵{total_system_profit:.2f}",
                    "icon": "faChartLine",
                    "color": "green" if total_system_profit >= 0 else "red",
                    "visible_to": ["ceo", "manager"]
                })
                
            except Exception as e:
                print(f"Error getting total system profit: {e}")
            
            # TOTAL PRODUCT VALUE (All Inventory Value)
            try:
                # Total value of all products (phones + accessories)
                # This includes both phones and other accessories
                total_product_value = db.query(func.sum(Product.quantity * Product.selling_price)).filter(
                    Product.created_by_user_id.in_(company_user_ids),
                    Product.is_active == True,
                    Product.quantity > 0
                ).scalar() or 0.0
                
                cards.append({
                    "id": "total_product_value",
                    "title": "Total Product Value",
                    "value": f"₵{total_product_value:.2f}",
                    "icon": "faWarehouse",
                    "color": "blue",
                    "visible_to": ["ceo", "manager"]
                })
                
                # Total cost value of all products
                total_product_cost_value = db.query(func.sum(Product.quantity * Product.cost_price)).filter(
                    Product.created_by_user_id.in_(company_user_ids),
                    Product.is_active == True,
                    Product.quantity > 0
                ).scalar() or 0.0
                
                cards.append({
                    "id": "total_product_cost_value",
                    "title": "Total Product Cost Value",
                    "value": f"₵{total_product_cost_value:.2f}",
                    "icon": "faDollarSign",
                    "color": "orange",
                    "visible_to": ["ceo", "manager"]
                })
                
                # Potential profit from inventory
                potential_inventory_profit = total_product_value - total_product_cost_value
                
                cards.append({
                    "id": "potential_inventory_profit",
                    "title": "Potential Inventory Profit",
                    "value": f"₵{potential_inventory_profit:.2f}",
                    "icon": "faCoins",
                    "color": "green" if potential_inventory_profit >= 0 else "red",
                    "visible_to": ["ceo", "manager"]
                })
                
            except Exception as e:
                print(f"Error getting total product value: {e}")
            
            # INVENTORY BREAKDOWN
            try:
                # Phones inventory value
                phones_value = db.query(func.sum(Product.quantity * Product.selling_price)).filter(
                    Product.created_by_user_id.in_(company_user_ids),
                    Product.is_active == True,
                    Product.quantity > 0,
                    Product.is_phone == True
                ).scalar() or 0.0
                
                cards.append({
                    "id": "phones_inventory_value",
                    "title": "Phones Inventory Value",
                    "value": f"₵{phones_value:.2f}",
                    "icon": "faMobileAlt",
                    "color": "blue",
                    "visible_to": ["ceo", "manager"]
                })
                
                # Accessories inventory value
                accessories_value = db.query(func.sum(Product.quantity * Product.selling_price)).filter(
                    Product.created_by_user_id.in_(company_user_ids),
                    Product.is_active == True,
                    Product.quantity > 0,
                    Product.is_phone == False
                ).scalar() or 0.0
                
                cards.append({
                    "id": "accessories_inventory_value",
                    "title": "Accessories Inventory Value",
                    "value": f"₵{accessories_value:.2f}",
                    "icon": "faBox",
                    "color": "purple",
                    "visible_to": ["ceo", "manager"]
                })
                
            except Exception as e:
                print(f"Error getting inventory breakdown: {e}")
        
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
