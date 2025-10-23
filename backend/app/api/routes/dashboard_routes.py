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


@router.get("/repairer-sales")
def get_repairer_sales_stats(
    start_date: str = None,
    end_date: str = None,
    repairer_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get sales statistics for repairers
    Shows items sold by each repairer with amount, quantity, and profit
    Managers can see all repairers in their company
    """
    from app.models.repair_sale import RepairSale
    from app.core.permissions import can_view_analytics
    
    # Only managers and admins can view this
    if not can_view_analytics(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can view repairer sales statistics"
        )
    
    # Get company user IDs for filtering
    company_user_ids = get_company_user_ids(db, current_user)
    
    # Build query
    query = db.query(
        RepairSale.repairer_id,
        User.username.label('repairer_name'),
        User.full_name.label('repairer_full_name'),
        func.count(RepairSale.id).label('items_sold_count'),
        func.sum(RepairSale.quantity).label('total_quantity'),
        func.sum(RepairSale.unit_price * RepairSale.quantity).label('gross_sales'),
        func.sum(RepairSale.cost_price * RepairSale.quantity).label('total_cost'),
        func.sum(RepairSale.profit).label('profit')
    ).join(User, RepairSale.repairer_id == User.id)
    
    # Apply company filtering
    if company_user_ids is not None:
        query = query.filter(RepairSale.repairer_id.in_(company_user_ids))
    
    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(RepairSale.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(RepairSale.created_at <= end_dt)
        except ValueError:
            pass
    
    # Apply repairer filter
    if repairer_id:
        query = query.filter(RepairSale.repairer_id == repairer_id)
    
    # Group by repairer
    query = query.group_by(
        RepairSale.repairer_id,
        User.username,
        User.full_name
    )
    
    results = query.all()
    
    # Format results
    repairer_stats = []
    total_items = 0
    total_qty = 0
    total_sales = 0.0
    total_costs = 0.0
    total_profit = 0.0
    
    for row in results:
        items_sold = row.items_sold_count or 0
        qty = int(row.total_quantity or 0)
        gross = float(row.gross_sales or 0.0)
        cost = float(row.total_cost or 0.0)
        profit = float(row.profit or 0.0)
        
        repairer_stats.append({
            "repairer_id": row.repairer_id,
            "repairer_name": row.repairer_name,
            "repairer_full_name": row.repairer_full_name,
            "items_sold_count": items_sold,
            "total_quantity": qty,
            "gross_sales": round(gross, 2),
            "total_cost": round(cost, 2),
            "profit": round(profit, 2),
            "profit_margin": round((profit / gross * 100) if gross > 0 else 0, 2)
        })
        
        total_items += items_sold
        total_qty += qty
        total_sales += gross
        total_costs += cost
        total_profit += profit
    
    return {
        "repairers": repairer_stats,
        "summary": {
            "total_repairers": len(repairer_stats),
            "total_items_sold": total_items,
            "total_quantity": total_qty,
            "total_sales": round(total_sales, 2),
            "total_cost": round(total_costs, 2),
            "total_profit": round(total_profit, 2),
            "overall_margin": round((total_profit / total_sales * 100) if total_sales > 0 else 0, 2)
        },
        "filters_applied": {
            "start_date": start_date,
            "end_date": end_date,
            "repairer_id": repairer_id
        }
    }


@router.get("/repairer-sales/{repairer_id}/details")
def get_repairer_sales_details(
    repairer_id: int,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed breakdown of items sold by a specific repairer
    Shows per-product statistics
    """
    from app.models.repair_sale import RepairSale
    from app.core.permissions import can_view_analytics
    
    if not can_view_analytics(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can view repairer sales details"
        )
    
    # Verify repairer exists
    repairer = db.query(User).filter(User.id == repairer_id).first()
    if not repairer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repairer not found"
        )
    
    # Get company user IDs for filtering
    company_user_ids = get_company_user_ids(db, current_user)
    
    # Check if repairer belongs to same company
    if company_user_ids is not None and repairer_id not in company_user_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view repairers from your company"
        )
    
    # Build query for product-level breakdown
    query = db.query(
        RepairSale.product_id,
        Product.name.label('product_name'),
        Product.sku.label('product_sku'),
        func.count(RepairSale.id).label('sales_count'),
        func.sum(RepairSale.quantity).label('total_quantity'),
        func.sum(RepairSale.unit_price * RepairSale.quantity).label('gross_sales'),
        func.sum(RepairSale.cost_price * RepairSale.quantity).label('total_cost'),
        func.sum(RepairSale.profit).label('profit')
    ).join(Product, RepairSale.product_id == Product.id
    ).filter(RepairSale.repairer_id == repairer_id)
    
    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(RepairSale.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(RepairSale.created_at <= end_dt)
        except ValueError:
            pass
    
    # Group by product
    query = query.group_by(
        RepairSale.product_id,
        Product.name,
        Product.sku
    ).order_by(func.sum(RepairSale.profit).desc())
    
    results = query.all()
    
    # Format results
    products = []
    for row in results:
        gross = float(row.gross_sales or 0.0)
        cost = float(row.total_cost or 0.0)
        profit = float(row.profit or 0.0)
        
        products.append({
            "product_id": row.product_id,
            "product_name": row.product_name,
            "product_sku": row.product_sku,
            "sales_count": row.sales_count,
            "total_quantity": int(row.total_quantity or 0),
            "gross_sales": round(gross, 2),
            "total_cost": round(cost, 2),
            "profit": round(profit, 2),
            "profit_margin": round((profit / gross * 100) if gross > 0 else 0, 2)
        })
    
    # Get repair list for this repairer
    repair_sales_query = db.query(RepairSale).filter(RepairSale.repairer_id == repairer_id)
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            repair_sales_query = repair_sales_query.filter(RepairSale.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            repair_sales_query = repair_sales_query.filter(RepairSale.created_at <= end_dt)
        except ValueError:
            pass
    
    recent_sales = repair_sales_query.order_by(RepairSale.created_at.desc()).limit(20).all()
    
    recent_items = []
    for rs in recent_sales:
        product = db.query(Product).filter(Product.id == rs.product_id).first()
        repair = db.query(Repair).filter(Repair.id == rs.repair_id).first()
        
        recent_items.append({
            "id": rs.id,
            "repair_id": rs.repair_id,
            "repair_description": repair.phone_description if repair else "Unknown",
            "product_id": rs.product_id,
            "product_name": product.name if product else "Unknown",
            "quantity": rs.quantity,
            "unit_price": rs.unit_price,
            "total_price": rs.total_price,
            "profit": rs.profit,
            "created_at": rs.created_at.isoformat()
        })
    
    return {
        "repairer": {
            "id": repairer.id,
            "username": repairer.username,
            "full_name": repairer.full_name,
            "role": repairer.role.value
        },
        "products": products,
        "recent_sales": recent_items,
        "summary": {
            "unique_products": len(products),
            "total_sales": sum(p["gross_sales"] for p in products),
            "total_profit": sum(p["profit"] for p in products)
        }
    }


@router.get("/test")
def test_dashboard(current_user: User = Depends(get_current_user)):
    """Test endpoint to verify dashboard access"""
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role.value,
        "message": "Dashboard access OK"
    }


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
    if current_user.role in [UserRole.CEO, UserRole.SHOP_KEEPER, UserRole.MANAGER]:
        # Get company user IDs for filtering
        company_user_ids = get_company_user_ids(db, current_user)
        
        # Total Customers - filtered by company
        customer_query = db.query(Customer)
        if company_user_ids is not None:
            customer_query = customer_query.filter(Customer.created_by_user_id.in_(company_user_ids))
        
        cards.append({
            "id": "total_customers",
            "title": "Total Customers",
            "value": customer_query.count(),
            "icon": "faUserCircle",
            "color": "blue",
            "visible_to": ["shop_keeper", "ceo", "manager"]
        })
        
        # Pending Resales Card - Use PendingResale table (filtered by company)
        pending_resales_query = db.query(PendingResale).filter(
            PendingResale.incoming_phone_id.isnot(None),
            PendingResale.incoming_phone_status != PhoneSaleStatus.SOLD
        )
        if company_user_ids is not None:
            pending_resales_query = pending_resales_query.filter(
                PendingResale.attending_staff_id.in_(company_user_ids)
            )
        
        cards.append({
            "id": "pending_resales",
            "title": "Pending Resales",
            "value": pending_resales_query.count(),
            "icon": "faClock",
            "color": "yellow",
            "visible_to": ["shop_keeper", "ceo", "manager"]
        })
        
        # Completed Swaps Card - Use PendingResale table (filtered by company)
        completed_swaps_query = db.query(PendingResale).filter(
            PendingResale.incoming_phone_status == PhoneSaleStatus.SOLD
        )
        if company_user_ids is not None:
            completed_swaps_query = completed_swaps_query.filter(
                PendingResale.attending_staff_id.in_(company_user_ids)
            )
        
        cards.append({
            "id": "completed_swaps",
            "title": "Completed Swaps",
            "value": completed_swaps_query.count(),
            "icon": "faCheckCircle",
            "color": "green",
            "visible_to": ["shop_keeper", "ceo", "manager"]
        })
        
        # Total Discounts Applied Card (Shop Keeper sees all, Manager sees filtered)
        if current_user.role == UserRole.SHOP_KEEPER:
            # Shop keeper sees all system discounts
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
                "visible_to": ["shop_keeper"]
            })
        
        # Available Phones - Exclude trade-ins waiting for resale (filtered by company)
        # REMOVED: Available Phones card as requested
        
        # Available Products - Products with stock > 0 (filtered by company)
        available_products_query = db.query(Product).filter(
            Product.quantity > 0
        )
        if company_user_ids is not None:
            available_products_query = available_products_query.filter(Product.created_by_user_id.in_(company_user_ids))
        
        cards.append({
            "id": "available_products",
            "title": "Available Products",
            "value": available_products_query.count(),
            "icon": "faBox",
            "color": "teal",
            "visible_to": ["shop_keeper", "ceo", "manager"]
        })
    
    # REPAIRER - Repair cards only
    if current_user.role == UserRole.REPAIRER:
        # Get company user IDs for filtering
        company_user_ids = get_company_user_ids(db, current_user)
        
        # Total Customers - filtered by company
        customer_query = db.query(Customer)
        if company_user_ids is not None:
            customer_query = customer_query.filter(Customer.created_by_user_id.in_(company_user_ids))
        
        cards.append({
            "id": "total_customers",
            "title": "Total Customers",
            "value": customer_query.count(),
            "icon": "faUserCircle",
            "color": "blue",
            "visible_to": ["repairer"]
        })
        
        # My Total Repairs (all repairs by this repairer)
        my_total_repairs = db.query(func.count(Repair.id)).filter(
            Repair.staff_id == current_user.id
        ).scalar()
        
        cards.append({
            "id": "my_total_repairs",
            "title": "My Total Repairs",
            "value": my_total_repairs,
            "icon": "faTools",
            "color": "indigo",
            "visible_to": ["repairer"]
        })
        
        # Pending Repairs Card (my pending/in-progress repairs)
        pending_repairs = db.query(func.count(Repair.id)).filter(
            Repair.staff_id == current_user.id,
            Repair.status.in_(["Pending", "In Progress"])
        ).scalar()
        
        cards.append({
            "id": "pending_repairs",
            "title": "Pending Repairs",
            "value": pending_repairs,
            "icon": "faClock",
            "color": "orange",
            "visible_to": ["repairer"]
        })
        
        # Completed Repairs Card (my completed/delivered repairs)
        completed_repairs = db.query(func.count(Repair.id)).filter(
            Repair.staff_id == current_user.id,
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
        
        # My Total Revenue (service + items) - completed/delivered only
        my_revenue = db.query(func.sum(Repair.cost)).filter(
            Repair.staff_id == current_user.id,
            Repair.status.in_(["Completed", "Delivered"])
        ).scalar() or 0.0
        
        cards.append({
            "id": "my_revenue",
            "title": "My Revenue",
            "value": f"₵{my_revenue:.2f}",
            "icon": "faMoneyBillWave",
            "color": "green",
            "visible_to": ["repairer"]
        })
        
        # My Service Charges (workmanship fees)
        my_service_charges = db.query(func.sum(Repair.service_cost)).filter(
            Repair.staff_id == current_user.id,
            Repair.status.in_(["Completed", "Delivered"])
        ).scalar() or 0.0
        
        cards.append({
            "id": "my_service_charges",
            "title": "Service Charges Earned",
            "value": f"₵{my_service_charges:.2f}",
            "icon": "faHandHoldingUsd",
            "color": "teal",
            "visible_to": ["repairer"]
        })
    
    # CEO & MANAGER - Essential Business Cards Only
    if current_user.role in [UserRole.CEO, UserRole.MANAGER]:
        # Get company user IDs (manager + all their staff)
        company_user_ids = get_company_user_ids(db, current_user)
        
        # ✅ ESSENTIAL CARDS ONLY - Clean Manager Dashboard
        
        # Total Revenue (Product Sales + Service Charges)
        product_sales_revenue = db.query(func.sum(ProductSale.total_amount)).filter(
            ProductSale.created_by_user_id.in_(company_user_ids),
            ProductSale.created_by_user_id.isnot(None)
        ).scalar() or 0.0
        
        service_charges = db.query(func.sum(Repair.service_cost)).filter(
            Repair.staff_id.in_(company_user_ids),
            Repair.staff_id.isnot(None),
            Repair.status.in_(['Completed', 'Delivered'])
        ).scalar() or 0.0
        
        total_revenue = product_sales_revenue + service_charges
        
        cards.append({
            "id": "total_revenue",
            "title": "Total Revenue",
            "value": f"₵{total_revenue:.2f}",
            "icon": "faMoneyBillWave",
            "color": "green",
            "visible_to": ["ceo", "manager"]
        })
        
        # Total Profit from Swaps
        total_profit = db.query(func.sum(PendingResale.profit_amount)).filter(
            PendingResale.incoming_phone_status == PhoneSaleStatus.SOLD,
            PendingResale.attending_staff_id.in_(company_user_ids)
        ).scalar() or 0.0
        
        cards.append({
            "id": "swap_profit",
            "title": "Swap Profit",
            "value": f"₵{total_profit:.2f}",
            "icon": "faExchangeAlt",
            "color": "blue" if total_profit >= 0 else "red",
            "visible_to": ["ceo", "manager"]
        })
        
        # ✅ PHONE INVENTORY - Combined card showing total and in stock
        # Total phones in inventory (filtered by company)
        total_phones = db.query(Product).filter(
            Product.created_by_user_id.in_(company_user_ids),
            Product.is_phone == True,
            Product.is_active == True
        ).count()
        
        # Phones in stock (available)
        phones_in_stock = db.query(Product).filter(
            Product.created_by_user_id.in_(company_user_ids),
            Product.is_phone == True,
            Product.is_active == True,
            Product.quantity > 0
        ).count()
        
        cards.append({
            "id": "phone_inventory",
            "title": "Phone Inventory",
            "value": f"{phones_in_stock}/{total_phones}",
            "subtitle": "In Stock / Total",
            "icon": "faMobileAlt",
            "color": "blue",
            "visible_to": ["ceo", "manager"]
        })
        
        # Swapped phones (pending resale)
        swapped_phones = db.query(PendingResale).filter(
            PendingResale.attending_staff_id.in_(company_user_ids),
            PendingResale.incoming_phone_status == PhoneSaleStatus.AVAILABLE
        ).count()
        
        # REMOVED: Pending Resale Phones card as requested
        
        # Sold swapped phones
        sold_swapped_phones = db.query(PendingResale).filter(
            PendingResale.attending_staff_id.in_(company_user_ids),
            PendingResale.incoming_phone_status == PhoneSaleStatus.SOLD
        ).count()
        
        cards.append({
            "id": "sold_swapped_phones",
            "title": "Sold Swapped Phones",
            "value": str(sold_swapped_phones),
            "icon": "faCheckCircle",
            "color": "teal",
            "visible_to": ["ceo", "manager"]
        })
        
        # Repairer Sold Items (Manager only)
        if current_user.role == UserRole.MANAGER:
            # Get repairer sales data
            repairer_sales_query = db.query(RepairSale).join(Repair).filter(
                Repair.staff_id.in_(company_user_ids)
            )
            
            total_repairer_items_sold = repairer_sales_query.count()
            total_repairer_profit = repairer_sales_query.with_entities(
                func.sum(RepairSale.profit)
            ).scalar() or 0.0
            
            cards.append({
                "id": "repairer_sold_items",
                "title": "Repairer Sold Items",
                "value": str(total_repairer_items_sold),
                "icon": "faTools",
                "color": "blue",
                "visible_to": ["manager"]
            })
            
            cards.append({
                "id": "repairer_profit",
                "title": "Repairer Profit",
                "value": f"₵{total_repairer_profit:.2f}",
                "icon": "faDollarSign",
                "color": "green",
                "visible_to": ["manager"]
            })
        
        # ✅ CLEAN DASHBOARD - Only Essential Cards
    
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
    
    # Get company user IDs for filtering
    company_user_ids = get_company_user_ids(db, current_user)
    
    # Shop Keeper stats
    if can_manage_swaps(current_user):
        # Filter swaps by company
        swap_query = db.query(Swap)
        if company_user_ids is not None:
            # For swaps, we need to filter by the staff who created them
            # Since swaps don't have created_by_user_id, we'll filter by customer's created_by_user_id
            swap_query = swap_query.join(Customer).filter(Customer.created_by_user_id.in_(company_user_ids))
        
        summary["stats"]["swaps"] = {
            "total": swap_query.count(),
            "pending_resales": swap_query.filter(Swap.resale_status == ResaleStatus.PENDING).count(),
            "total_discounts": swap_query.with_entities(func.sum(Swap.discount_amount)).scalar() or 0.0
        }
        
        # Filter sales by company
        sale_query = db.query(Sale)
        if company_user_ids is not None:
            sale_query = sale_query.filter(Sale.created_by_user_id.in_(company_user_ids))
        
        summary["stats"]["sales"] = {
            "total": sale_query.count(),
            "total_revenue": sale_query.with_entities(func.sum(Sale.amount_paid)).scalar() or 0.0,
            "total_discounts": sale_query.with_entities(func.sum(Sale.discount_amount)).scalar() or 0.0
        }
        
        # Filter phones by company
        phone_query = db.query(Phone)
        if company_user_ids is not None:
            phone_query = phone_query.filter(Phone.created_by_user_id.in_(company_user_ids))
        
        summary["stats"]["phones"] = {
            "total": phone_query.count(),
            "available": phone_query.filter(Phone.is_available == True).count()
        }
    
    # Repairer stats
    if can_manage_repairs(current_user):
        # Filter repairs by company
        repair_query = db.query(Repair)
        if company_user_ids is not None:
            repair_query = repair_query.filter(Repair.staff_id.in_(company_user_ids))
        
        summary["stats"]["repairs"] = {
            "total": repair_query.count(),
            "pending": repair_query.filter(Repair.status.in_(["Pending", "In Progress"])).count(),
            "completed": repair_query.filter(Repair.status.in_(["Completed", "Delivered"])).count(),
            "total_revenue": repair_query.with_entities(func.sum(Repair.cost)).scalar() or 0.0
        }
    
    # CEO/Admin profit stats
    if can_view_analytics(current_user):
        # Filter profit calculations by company
        profit_swap_query = db.query(Swap)
        profit_sale_query = db.query(Sale)
        profit_repair_query = db.query(Repair)
        
        if company_user_ids is not None:
            profit_swap_query = profit_swap_query.join(Customer).filter(Customer.created_by_user_id.in_(company_user_ids))
            profit_sale_query = profit_sale_query.filter(Sale.created_by_user_id.in_(company_user_ids))
            profit_repair_query = profit_repair_query.filter(Repair.staff_id.in_(company_user_ids))
        
        summary["stats"]["profit"] = {
            "from_swaps": profit_swap_query.filter(Swap.resale_status == ResaleStatus.SOLD).with_entities(func.sum(Swap.profit_or_loss)).scalar() or 0.0,
            "from_sales": profit_sale_query.with_entities(func.sum(Sale.amount_paid)).scalar() or 0.0,
            "from_repairs": profit_repair_query.with_entities(func.sum(Repair.cost)).scalar() or 0.0
        }
        
        # Calculate total profit
        total_profit = (
            summary["stats"]["profit"]["from_swaps"] +
            summary["stats"]["profit"]["from_sales"] +
            summary["stats"]["profit"]["from_repairs"]
        )
        summary["stats"]["profit"]["total"] = total_profit
    
    return summary


@router.get("/hub-profits")
def get_hub_profits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed profit breakdown for each hub (Products, Swapping, Repairs)
    Manager/CEO only
    """
    from app.models.repair_item_usage import RepairItemUsage
    from app.models.repair_item import RepairItem
    
    if current_user.role not in [UserRole.CEO, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can view hub profits"
        )
    
    # PRODUCTS HUB PROFIT
    # Profit = Total Revenue - Total Cost
    product_sales = db.query(ProductSale).all()
    products_revenue = sum(sale.total_amount for sale in product_sales)
    products_cost = sum((sale.quantity * sale.unit_price) for sale in product_sales)  # Simplified
    products_profit = products_revenue - products_cost
    
    # SWAPPING HUB PROFIT  
    # Profit from completed swaps
    swaps_profit = db.query(func.sum(Swap.profit_or_loss)).filter(
        Swap.resale_status == ResaleStatus.SOLD
    ).scalar() or 0.0
    
    # REPAIRER HUB PROFIT
    # Profit from repairs = Service revenue + Items profit
    # Service profit = service_cost (assuming 100% profit on service)
    # Items profit = items sold in repairs (selling_price - cost_price) * quantity
    
    # Service revenue (100% profit)
    service_revenue = db.query(func.sum(Repair.service_cost)).scalar() or 0.0
    
    # Items profit from repair items used
    item_usages = db.query(RepairItemUsage).all()
    items_revenue = 0.0
    items_cost = 0.0
    
    for usage in item_usages:
        repair_item = db.query(RepairItem).filter(RepairItem.id == usage.repair_item_id).first()
        if repair_item:
            items_revenue += usage.total_cost  # What customer paid
            items_cost += repair_item.cost_price * usage.quantity  # What we paid
    
    repairs_profit = service_revenue + (items_revenue - items_cost)
    
    # TOTAL COMBINED PROFIT
    total_profit = products_profit + swaps_profit + repairs_profit
    
    return {
        "products_hub": {
            "revenue": products_revenue,
            "cost": products_cost,
            "profit": products_profit
        },
        "swapping_hub": {
            "profit": swaps_profit,
            "note": "Profit from resold phones"
        },
        "repairer_hub": {
            "service_revenue": service_revenue,
            "items_revenue": items_revenue,
            "items_cost": items_cost,
            "items_profit": items_revenue - items_cost,
            "total_profit": repairs_profit
        },
        "total_profit": total_profit,
        "breakdown": {
            "from_products": products_profit,
            "from_swapping": swaps_profit,
            "from_repairs": repairs_profit
        }
    }
