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
from app.models.user import User
from app.models.sale import Sale
from app.models.product_sale import ProductSale
from app.models.swap import Swap
from app.models.repair import Repair

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/today-stats")
async def get_today_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get today's statistics for the current user
    Returns sales, repairs, profits, etc. for the current day
    """
    today = date.today()
    
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
            # Get today's sales
            today_sales = db.query(Sale).filter(
                func.date(Sale.sale_date) == today
            )
            
            # Filter by user for shop keepers
            if current_user.role.value == 'shop_keeper':
                today_sales = today_sales.filter(Sale.created_by == current_user.id)
            
            sales_list = today_sales.all()
            stats["sales_count"] = len(sales_list)
            stats["sales_total"] = sum(sale.total_price for sale in sales_list)
            
            # Calculate profit (selling price - cost price)
            for sale in sales_list:
                if sale.phone and sale.phone.cost_price:
                    stats["total_profit"] += (sale.total_price - sale.phone.cost_price)
            
            # Get today's product sales
            today_product_sales = db.query(ProductSale).filter(
                func.date(ProductSale.sale_date) == today
            )
            if current_user.role.value == 'shop_keeper':
                today_product_sales = today_product_sales.filter(
                    ProductSale.created_by == current_user.id
                )
            
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
            if current_user.role.value == 'shop_keeper':
                today_swaps = today_swaps.filter(Swap.created_by == current_user.id)
            
            stats["swaps_completed"] = today_swaps.count()
        
        # For repairers - get their repairs
        if current_user.role.value in ['repairer', 'manager', 'ceo']:
            # Pending repairs assigned to this repairer
            if current_user.role.value == 'repairer':
                stats["repairs_pending"] = db.query(Repair).filter(
                    Repair.assigned_to == current_user.id,
                    Repair.status.in_(['Pending', 'In Progress'])
                ).count()
                
                # Completed today
                stats["repairs_completed"] = db.query(Repair).filter(
                    Repair.assigned_to == current_user.id,
                    Repair.status == 'Completed',
                    func.date(Repair.completion_date) == today
                ).count()
            else:
                # Manager/CEO see all repairs
                stats["repairs_pending"] = db.query(Repair).filter(
                    Repair.status.in_(['Pending', 'In Progress'])
                ).count()
                
                stats["repairs_completed"] = db.query(Repair).filter(
                    Repair.status == 'Completed',
                    func.date(Repair.completion_date) == today
                ).count()
        
        return stats
    
    except Exception as e:
        print(f"Error fetching today stats: {e}")
        # Return empty stats on error
        return stats

