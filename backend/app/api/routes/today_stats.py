"""
Today's Statistics API
Real-time statistics for current day's operations
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.company_filter import get_company_user_ids
from app.models.user import User
from app.models.sale import Sale
from app.models.product_sale import ProductSale
from app.models.pos_sale import POSSale
from app.models.swap import Swap
from app.models.repair import Repair
from app.models.customer import Customer

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/today-stats")
async def get_today_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get today's statistics for the current user
    Returns sales, repairs, profits, etc. for the current day
    Filtered by company for data isolation
    """
    today = date.today()
    
    # Get company user IDs for filtering
    company_user_ids = get_company_user_ids(db, current_user)
    
    # Initialize stats
    stats = {
        "sales_count": 0,
        "sales_total": 0.0,
        "repairs_pending": 0,
        "repairs_completed": 0,
        "products_sold": 0,
        "swaps_completed": 0,
        "total_profit": 0.0,
    }
    
    try:
        # For shop keepers - get their sales
        if current_user.role.value in ['shop_keeper', 'manager', 'ceo']:
            # Get today's POS sales (new system)
            today_pos_sales = db.query(POSSale).filter(
                func.date(POSSale.sale_date) == today
            )
            
            # Apply company filtering
            if company_user_ids is not None:
                today_pos_sales = today_pos_sales.filter(POSSale.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                # For shop keepers without company filtering, filter by their own ID
                today_pos_sales = today_pos_sales.filter(POSSale.created_by_user_id == current_user.id)
            
            pos_sales_list = today_pos_sales.all()
            stats["sales_count"] = len(pos_sales_list)
            stats["sales_total"] = sum(sale.total_amount for sale in pos_sales_list)
            
            # Calculate profit from POS sales
            for sale in pos_sales_list:
                if sale.total_amount and sale.total_cost:
                    stats["total_profit"] += (sale.total_amount - sale.total_cost)
            
            # Also get legacy sales for backward compatibility
            today_sales = db.query(Sale).filter(
                func.date(Sale.sale_date) == today
            )
            
            # Apply company filtering
            if company_user_ids is not None:
                today_sales = today_sales.filter(Sale.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                today_sales = today_sales.filter(Sale.created_by_user_id == current_user.id)
            
            sales_list = today_sales.all()
            stats["sales_count"] += len(sales_list)
            stats["sales_total"] += sum(sale.total_price for sale in sales_list)
            
            # Calculate profit (selling price - cost price)
            for sale in sales_list:
                if sale.phone and sale.phone.cost_price:
                    stats["total_profit"] += (sale.total_price - sale.phone.cost_price)
            
            # Get today's product sales
            today_product_sales = db.query(ProductSale).filter(
                func.date(ProductSale.sale_date) == today
            )
            # Apply company filtering
            if company_user_ids is not None:
                today_product_sales = today_product_sales.filter(ProductSale.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                today_product_sales = today_product_sales.filter(ProductSale.created_by_user_id == current_user.id)
            
            product_sales = today_product_sales.all()
            stats["products_sold"] = sum(ps.quantity for ps in product_sales)
            stats["sales_total"] += sum(ps.total_price for ps in product_sales)
            
            # Add product profit
            for ps in product_sales:
                if ps.product and ps.product.cost_price:
                    profit_per_unit = ps.selling_price - ps.product.cost_price
                    stats["total_profit"] += (profit_per_unit * ps.quantity)
            
            # Get today's swaps
            today_swaps = db.query(Swap).filter(
                func.date(Swap.swap_date) == today
            )
            # Apply company filtering through customer's created_by_user_id
            if company_user_ids is not None:
                today_swaps = today_swaps.join(Customer).filter(Customer.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                today_swaps = today_swaps.join(Customer).filter(Customer.created_by_user_id == current_user.id)
            
            stats["swaps_completed"] = today_swaps.count()
        
        # For repairers - get their repairs
        if current_user.role.value in ['repairer', 'manager', 'ceo']:
            # Pending repairs assigned to this repairer
            if current_user.role.value == 'repairer':
                stats["repairs_pending"] = db.query(Repair).filter(
                    Repair.staff_id == current_user.id,
                    Repair.status.in_(['Pending', 'In Progress'])
                ).count()
                
                # Completed today
                stats["repairs_completed"] = db.query(Repair).filter(
                    Repair.staff_id == current_user.id,
                    Repair.status == 'Completed',
                    func.date(Repair.completion_date) == today
                ).count()
            else:
                # Manager/CEO see all repairs for their company
                repair_query = db.query(Repair)
                if company_user_ids is not None:
                    repair_query = repair_query.filter(Repair.created_by_user_id.in_(company_user_ids))
                
                stats["repairs_pending"] = repair_query.filter(
                    Repair.status.in_(['Pending', 'In Progress'])
                ).count()
                
                stats["repairs_completed"] = repair_query.filter(
                    Repair.status == 'Completed',
                    func.date(Repair.completion_date) == today
                ).count()
        
        return stats
    
    except Exception as e:
        print(f"Error fetching today stats: {e}")
        # Return empty stats on error
        return stats


@router.get("/weekly-stats")
async def get_weekly_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get this week's statistics for the current user
    Returns sales, repairs, profits, etc. for the current week
    Filtered by company for data isolation
    """
    from datetime import timedelta
    
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday of current week
    
    # Get company user IDs for filtering
    company_user_ids = get_company_user_ids(db, current_user)
    
    # Initialize stats
    stats = {
        "sales_count": 0,
        "sales_total": 0.0,
        "repairs_pending": 0,
        "repairs_completed": 0,
        "products_sold": 0,
        "swaps_completed": 0,
        "total_profit": 0.0,
    }
    
    try:
        # For shop keepers - get their sales
        if current_user.role.value in ['shop_keeper', 'manager', 'ceo']:
            # Get this week's POS sales
            week_pos_sales = db.query(POSSale).filter(
                func.date(POSSale.sale_date) >= week_start,
                func.date(POSSale.sale_date) <= today
            )
            
            # Apply company filtering
            if company_user_ids is not None:
                week_pos_sales = week_pos_sales.filter(POSSale.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                week_pos_sales = week_pos_sales.filter(POSSale.created_by_user_id == current_user.id)
            
            pos_sales_list = week_pos_sales.all()
            stats["sales_count"] = len(pos_sales_list)
            stats["sales_total"] = sum(sale.total_amount for sale in pos_sales_list)
            
            # Calculate profit from POS sales
            for sale in pos_sales_list:
                if sale.total_amount and sale.total_cost:
                    stats["total_profit"] += (sale.total_amount - sale.total_cost)
            
            # Get this week's product sales
            week_product_sales = db.query(ProductSale).filter(
                func.date(ProductSale.sale_date) >= week_start,
                func.date(ProductSale.sale_date) <= today
            )
            
            if company_user_ids is not None:
                week_product_sales = week_product_sales.filter(ProductSale.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                week_product_sales = week_product_sales.filter(ProductSale.created_by_user_id == current_user.id)
            
            product_sales = week_product_sales.all()
            stats["products_sold"] = sum(ps.quantity for ps in product_sales)
            stats["sales_total"] += sum(ps.total_price for ps in product_sales)
            
            # Add product profit
            for ps in product_sales:
                if ps.product and ps.product.cost_price:
                    profit_per_unit = ps.selling_price - ps.product.cost_price
                    stats["total_profit"] += (profit_per_unit * ps.quantity)
            
            # Get this week's swaps
            week_swaps = db.query(Swap).filter(
                func.date(Swap.swap_date) >= week_start,
                func.date(Swap.swap_date) <= today
            )
            
            if company_user_ids is not None:
                week_swaps = week_swaps.join(Customer).filter(Customer.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                week_swaps = week_swaps.join(Customer).filter(Customer.created_by_user_id == current_user.id)
            
            stats["swaps_completed"] = week_swaps.count()
        
        # For repairers - get their repairs
        if current_user.role.value in ['repairer', 'manager', 'ceo']:
            if current_user.role.value == 'repairer':
                stats["repairs_pending"] = db.query(Repair).filter(
                    Repair.staff_id == current_user.id,
                    Repair.status.in_(['Pending', 'In Progress'])
                ).count()
                
                stats["repairs_completed"] = db.query(Repair).filter(
                    Repair.staff_id == current_user.id,
                    Repair.status == 'Completed',
                    func.date(Repair.completion_date) >= week_start,
                    func.date(Repair.completion_date) <= today
                ).count()
            else:
                repair_query = db.query(Repair)
                if company_user_ids is not None:
                    repair_query = repair_query.filter(Repair.created_by_user_id.in_(company_user_ids))
                
                stats["repairs_pending"] = repair_query.filter(
                    Repair.status.in_(['Pending', 'In Progress'])
                ).count()
                
                stats["repairs_completed"] = repair_query.filter(
                    Repair.status == 'Completed',
                    func.date(Repair.completion_date) >= week_start,
                    func.date(Repair.completion_date) <= today
                ).count()
        
        return stats
    
    except Exception as e:
        print(f"Error fetching weekly stats: {e}")
        return stats


@router.get("/monthly-stats")
async def get_monthly_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get this month's statistics for the current user
    Returns sales, repairs, profits, etc. for the current month
    Filtered by company for data isolation
    """
    from datetime import datetime
    
    today = date.today()
    month_start = today.replace(day=1)  # First day of current month
    
    # Get company user IDs for filtering
    company_user_ids = get_company_user_ids(db, current_user)
    
    # Initialize stats
    stats = {
        "sales_count": 0,
        "sales_total": 0.0,
        "repairs_pending": 0,
        "repairs_completed": 0,
        "products_sold": 0,
        "swaps_completed": 0,
        "total_profit": 0.0,
    }
    
    try:
        # For shop keepers - get their sales
        if current_user.role.value in ['shop_keeper', 'manager', 'ceo']:
            # Get this month's POS sales
            month_pos_sales = db.query(POSSale).filter(
                func.date(POSSale.sale_date) >= month_start,
                func.date(POSSale.sale_date) <= today
            )
            
            # Apply company filtering
            if company_user_ids is not None:
                month_pos_sales = month_pos_sales.filter(POSSale.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                month_pos_sales = month_pos_sales.filter(POSSale.created_by_user_id == current_user.id)
            
            pos_sales_list = month_pos_sales.all()
            stats["sales_count"] = len(pos_sales_list)
            stats["sales_total"] = sum(sale.total_amount for sale in pos_sales_list)
            
            # Calculate profit from POS sales
            for sale in pos_sales_list:
                if sale.total_amount and sale.total_cost:
                    stats["total_profit"] += (sale.total_amount - sale.total_cost)
            
            # Get this month's product sales
            month_product_sales = db.query(ProductSale).filter(
                func.date(ProductSale.sale_date) >= month_start,
                func.date(ProductSale.sale_date) <= today
            )
            
            if company_user_ids is not None:
                month_product_sales = month_product_sales.filter(ProductSale.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                month_product_sales = month_product_sales.filter(ProductSale.created_by_user_id == current_user.id)
            
            product_sales = month_product_sales.all()
            stats["products_sold"] = sum(ps.quantity for ps in product_sales)
            stats["sales_total"] += sum(ps.total_price for ps in product_sales)
            
            # Add product profit
            for ps in product_sales:
                if ps.product and ps.product.cost_price:
                    profit_per_unit = ps.selling_price - ps.product.cost_price
                    stats["total_profit"] += (profit_per_unit * ps.quantity)
            
            # Get this month's swaps
            month_swaps = db.query(Swap).filter(
                func.date(Swap.swap_date) >= month_start,
                func.date(Swap.swap_date) <= today
            )
            
            if company_user_ids is not None:
                month_swaps = month_swaps.join(Customer).filter(Customer.created_by_user_id.in_(company_user_ids))
            elif current_user.role.value == 'shop_keeper':
                month_swaps = month_swaps.join(Customer).filter(Customer.created_by_user_id == current_user.id)
            
            stats["swaps_completed"] = month_swaps.count()
        
        # For repairers - get their repairs
        if current_user.role.value in ['repairer', 'manager', 'ceo']:
            if current_user.role.value == 'repairer':
                stats["repairs_pending"] = db.query(Repair).filter(
                    Repair.staff_id == current_user.id,
                    Repair.status.in_(['Pending', 'In Progress'])
                ).count()
                
                stats["repairs_completed"] = db.query(Repair).filter(
                    Repair.staff_id == current_user.id,
                    Repair.status == 'Completed',
                    func.date(Repair.completion_date) >= month_start,
                    func.date(Repair.completion_date) <= today
                ).count()
            else:
                repair_query = db.query(Repair)
                if company_user_ids is not None:
                    repair_query = repair_query.filter(Repair.created_by_user_id.in_(company_user_ids))
                
                stats["repairs_pending"] = repair_query.filter(
                    Repair.status.in_(['Pending', 'In Progress'])
                ).count()
                
                stats["repairs_completed"] = repair_query.filter(
                    Repair.status == 'Completed',
                    func.date(Repair.completion_date) >= month_start,
                    func.date(Repair.completion_date) <= today
                ).count()
        
        return stats
    
    except Exception as e:
        print(f"Error fetching monthly stats: {e}")
        return stats

