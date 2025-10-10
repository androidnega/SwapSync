"""
Analytics and Dashboard Reports API Routes
Provides business insights, statistics, and reports
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, timedelta
from typing import Optional
from app.core.database import get_db
from app.models.customer import Customer
from app.models.phone import Phone
from app.models.repair import Repair
from app.models.sale import Sale
from app.models.swap import Swap

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """
    Dashboard overview with key metrics
    Returns total customers, repairs, sales, swaps, and revenue
    """
    # Total counts
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_repairs = db.query(func.count(Repair.id)).scalar()
    total_sales = db.query(func.count(Sale.id)).scalar()
    total_swaps = db.query(func.count(Swap.id)).scalar()
    total_phones = db.query(func.count(Phone.id)).scalar()
    available_phones = db.query(func.count(Phone.id)).filter(Phone.is_available == True).scalar()
    
    # Revenue calculations
    repair_revenue = db.query(func.sum(Repair.cost)).scalar() or 0.0
    sales_revenue = db.query(func.sum(Sale.amount_paid)).scalar() or 0.0
    swap_revenue = db.query(func.sum(Swap.balance_paid)).scalar() or 0.0
    total_revenue = repair_revenue + sales_revenue + swap_revenue
    
    # Repair status breakdown
    pending_repairs = db.query(func.count(Repair.id)).filter(Repair.status == "Pending").scalar()
    in_progress_repairs = db.query(func.count(Repair.id)).filter(Repair.status == "In Progress").scalar()
    completed_repairs = db.query(func.count(Repair.id)).filter(Repair.status == "Completed").scalar()
    delivered_repairs = db.query(func.count(Repair.id)).filter(Repair.status == "Delivered").scalar()
    
    # Recent repairs (last 5)
    recent_repairs = (
        db.query(Repair)
        .order_by(Repair.created_at.desc())
        .limit(5)
        .all()
    )
    
    return {
        "totals": {
            "customers": total_customers,
            "repairs": total_repairs,
            "sales": total_sales,
            "swaps": total_swaps,
            "phones_in_inventory": total_phones,
            "available_phones": available_phones
        },
        "revenue": {
            "total": round(total_revenue, 2),
            "from_repairs": round(repair_revenue, 2),
            "from_sales": round(sales_revenue, 2),
            "from_swaps": round(swap_revenue, 2)
        },
        "repair_status": {
            "pending": pending_repairs,
            "in_progress": in_progress_repairs,
            "completed": completed_repairs,
            "delivered": delivered_repairs
        },
        "recent_repairs": [
            {
                "id": r.id,
                "phone": r.phone_description,
                "issue": r.issue_description[:50] + "..." if len(r.issue_description) > 50 else r.issue_description,
                "status": r.status,
                "cost": r.cost,
                "created_at": r.created_at.isoformat()
            } for r in recent_repairs
        ]
    }


@router.get("/weekly-stats")
def weekly_stats(db: Session = Depends(get_db)):
    """
    Statistics for the last 7 days
    Returns daily repair counts and revenue for charts
    """
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    
    # Group repairs by date
    repairs_by_date = (
        db.query(
            func.date(Repair.created_at).label("date"),
            func.count(Repair.id).label("count"),
            func.sum(Repair.cost).label("revenue")
        )
        .filter(Repair.created_at >= week_ago)
        .group_by(func.date(Repair.created_at))
        .all()
    )
    
    # Group sales by date
    sales_by_date = (
        db.query(
            func.date(Sale.created_at).label("date"),
            func.count(Sale.id).label("count"),
            func.sum(Sale.amount_paid).label("revenue")
        )
        .filter(Sale.created_at >= week_ago)
        .group_by(func.date(Sale.created_at))
        .all()
    )
    
    # Group swaps by date
    swaps_by_date = (
        db.query(
            func.date(Swap.created_at).label("date"),
            func.count(Swap.id).label("count"),
            func.sum(Swap.balance_paid).label("revenue")
        )
        .filter(Swap.created_at >= week_ago)
        .group_by(func.date(Swap.created_at))
        .all()
    )
    
    return {
        "last_7_days": {
            "repairs": [
                {
                    "date": str(r.date),
                    "count": r.count,
                    "revenue": float(r.revenue or 0.0)
                } for r in repairs_by_date
            ],
            "sales": [
                {
                    "date": str(s.date),
                    "count": s.count,
                    "revenue": float(s.revenue or 0.0)
                } for s in sales_by_date
            ],
            "swaps": [
                {
                    "date": str(sw.date),
                    "count": sw.count,
                    "revenue": float(sw.revenue or 0.0)
                } for sw in swaps_by_date
            ]
        }
    }


@router.get("/monthly-stats")
def monthly_stats(year: int = None, month: int = None, db: Session = Depends(get_db)):
    """
    Monthly statistics for a specific month or current month
    Returns detailed monthly breakdown
    """
    if not year or not month:
        now = datetime.utcnow()
        year = now.year
        month = now.month
    
    # Filter by year and month
    repairs = (
        db.query(Repair)
        .filter(
            and_(
                extract('year', Repair.created_at) == year,
                extract('month', Repair.created_at) == month
            )
        )
        .all()
    )
    
    sales = (
        db.query(Sale)
        .filter(
            and_(
                extract('year', Sale.created_at) == year,
                extract('month', Sale.created_at) == month
            )
        )
        .all()
    )
    
    swaps = (
        db.query(Swap)
        .filter(
            and_(
                extract('year', Swap.created_at) == year,
                extract('month', Swap.created_at) == month
            )
        )
        .all()
    )
    
    # Calculate totals
    repair_revenue = sum(r.cost for r in repairs)
    sales_revenue = sum(s.amount_paid for s in sales)
    swap_revenue = sum(sw.balance_paid for sw in swaps)
    
    return {
        "month": f"{year}-{month:02d}",
        "repairs": {
            "count": len(repairs),
            "revenue": round(repair_revenue, 2),
            "completed": len([r for r in repairs if r.status == "Completed"])
        },
        "sales": {
            "count": len(sales),
            "revenue": round(sales_revenue, 2)
        },
        "swaps": {
            "count": len(swaps),
            "revenue": round(swap_revenue, 2)
        },
        "total_revenue": round(repair_revenue + sales_revenue + swap_revenue, 2)
    }


@router.get("/customer-insights")
def customer_insights(db: Session = Depends(get_db)):
    """
    Customer analytics and insights
    Returns customer statistics and behavior patterns
    """
    total_customers = db.query(func.count(Customer.id)).scalar()
    
    # Customers with repairs
    customers_with_repairs = (
        db.query(func.count(func.distinct(Repair.customer_id)))
        .scalar()
    )
    
    # Customers with sales
    customers_with_sales = (
        db.query(func.count(func.distinct(Sale.customer_id)))
        .scalar()
    )
    
    # Customers with swaps
    customers_with_swaps = (
        db.query(func.count(func.distinct(Swap.customer_id)))
        .scalar()
    )
    
    # Repeat customers (more than 1 transaction of any type)
    repair_counts = (
        db.query(Repair.customer_id, func.count(Repair.id).label('count'))
        .group_by(Repair.customer_id)
        .having(func.count(Repair.id) > 1)
        .count()
    )
    
    # Top customers by repair spending
    top_customers = (
        db.query(
            Customer,
            func.sum(Repair.cost).label('total_spent')
        )
        .join(Repair, Customer.id == Repair.customer_id)
        .group_by(Customer.id)
        .order_by(func.sum(Repair.cost).desc())
        .limit(5)
        .all()
    )
    
    return {
        "total_customers": total_customers,
        "customers_with_repairs": customers_with_repairs,
        "customers_with_sales": customers_with_sales,
        "customers_with_swaps": customers_with_swaps,
        "repeat_repair_customers": repair_counts,
        "retention_rate": f"{(customers_with_repairs / total_customers * 100):.1f}%" if total_customers else "0%",
        "top_customers": [
            {
                "id": c.id,
                "name": c.full_name,
                "phone": c.phone_number,
                "total_spent": round(float(spent), 2)
            } for c, spent in top_customers
        ]
    }


@router.get("/repair-statistics")
def repair_statistics(db: Session = Depends(get_db)):
    """
    Detailed repair statistics
    Returns breakdown by status, average costs, completion times
    """
    # Status breakdown
    status_breakdown = (
        db.query(
            Repair.status,
            func.count(Repair.id).label('count'),
            func.avg(Repair.cost).label('avg_cost'),
            func.sum(Repair.cost).label('total_revenue')
        )
        .group_by(Repair.status)
        .all()
    )
    
    # Average repair cost
    avg_repair_cost = db.query(func.avg(Repair.cost)).scalar() or 0.0
    
    # Most common issues (top 5 keywords)
    all_repairs = db.query(Repair).all()
    
    return {
        "total_repairs": db.query(func.count(Repair.id)).scalar(),
        "average_cost": round(avg_repair_cost, 2),
        "status_breakdown": [
            {
                "status": s.status,
                "count": s.count,
                "avg_cost": round(float(s.avg_cost or 0), 2),
                "total_revenue": round(float(s.total_revenue or 0), 2)
            } for s in status_breakdown
        ],
        "completion_rate": f"{(db.query(func.count(Repair.id)).filter(Repair.status.in_(['Completed', 'Delivered'])).scalar() / db.query(func.count(Repair.id)).scalar() * 100):.1f}%" if db.query(func.count(Repair.id)).scalar() else "0%"
    }


@router.get("/swap-analytics")
def swap_analytics(db: Session = Depends(get_db)):
    """
    Swap transaction analytics
    Returns swap statistics and profit/loss insights
    """
    total_swaps = db.query(func.count(Swap.id)).scalar()
    
    if total_swaps == 0:
        return {
            "total_swaps": 0,
            "total_value_received": 0.0,
            "total_balance_paid": 0.0,
            "average_balance": 0.0,
            "recent_swaps": []
        }
    
    # Get all swaps for calculations
    swaps = db.query(Swap).all()
    
    # Calculate totals
    total_given_value = sum(s.given_phone_value for s in swaps)
    total_balance_paid = sum(s.balance_paid for s in swaps)
    total_transaction_value = sum(s.total_transaction_value for s in swaps)
    
    # Average balance paid
    avg_balance = total_balance_paid / total_swaps if total_swaps else 0.0
    
    # Recent swaps
    recent_swaps = (
        db.query(Swap)
        .order_by(Swap.created_at.desc())
        .limit(5)
        .all()
    )
    
    return {
        "total_swaps": total_swaps,
        "total_value_received": round(total_given_value, 2),
        "total_balance_paid": round(total_balance_paid, 2),
        "total_transaction_value": round(total_transaction_value, 2),
        "average_balance": round(avg_balance, 2),
        "recent_swaps": [
            {
                "id": s.id,
                "customer_id": s.customer_id,
                "given_phone": s.given_phone_description,
                "given_value": s.given_phone_value,
                "balance_paid": s.balance_paid,
                "total_value": s.total_transaction_value,
                "created_at": s.created_at.isoformat()
            } for s in recent_swaps
        ]
    }


@router.get("/sales-analytics")
def sales_analytics(db: Session = Depends(get_db)):
    """
    Sales analytics and insights
    Returns sales statistics and trends
    """
    total_sales = db.query(func.count(Sale.id)).scalar()
    
    if total_sales == 0:
        return {
            "total_sales": 0,
            "total_revenue": 0.0,
            "average_sale_value": 0.0,
            "recent_sales": []
        }
    
    # Revenue
    total_revenue = db.query(func.sum(Sale.amount_paid)).scalar() or 0.0
    avg_sale_value = total_revenue / total_sales if total_sales else 0.0
    
    # Sales by phone condition
    sales_by_condition = (
        db.query(
            Phone.condition,
            func.count(Sale.id).label('count'),
            func.sum(Sale.amount_paid).label('revenue')
        )
        .join(Phone, Sale.phone_id == Phone.id)
        .group_by(Phone.condition)
        .all()
    )
    
    # Recent sales
    recent_sales = (
        db.query(Sale)
        .order_by(Sale.created_at.desc())
        .limit(5)
        .all()
    )
    
    return {
        "total_sales": total_sales,
        "total_revenue": round(total_revenue, 2),
        "average_sale_value": round(avg_sale_value, 2),
        "by_condition": [
            {
                "condition": s.condition,
                "count": s.count,
                "revenue": round(float(s.revenue or 0), 2)
            } for s in sales_by_condition
        ],
        "recent_sales": [
            {
                "id": s.id,
                "customer_id": s.customer_id,
                "phone_id": s.phone_id,
                "amount_paid": s.amount_paid,
                "created_at": s.created_at.isoformat()
            } for s in recent_sales
        ]
    }


@router.get("/inventory-report")
def inventory_report(db: Session = Depends(get_db)):
    """
    Inventory analytics
    Returns phone inventory statistics by brand, condition, availability
    """
    total_phones = db.query(func.count(Phone.id)).scalar()
    available = db.query(func.count(Phone.id)).filter(Phone.is_available == True).scalar()
    sold = db.query(func.count(Phone.id)).filter(Phone.is_available == False).scalar()
    
    # Phones by brand
    by_brand = (
        db.query(
            Phone.brand,
            func.count(Phone.id).label('count'),
            func.avg(Phone.value).label('avg_value')
        )
        .group_by(Phone.brand)
        .all()
    )
    
    # Phones by condition
    by_condition = (
        db.query(
            Phone.condition,
            func.count(Phone.id).label('count'),
            func.avg(Phone.value).label('avg_value')
        )
        .group_by(Phone.condition)
        .all()
    )
    
    # Total inventory value
    total_value = db.query(func.sum(Phone.value)).filter(Phone.is_available == True).scalar() or 0.0
    
    return {
        "total_phones": total_phones,
        "available": available,
        "sold": sold,
        "total_inventory_value": round(total_value, 2),
        "by_brand": [
            {
                "brand": b.brand,
                "count": b.count,
                "avg_value": round(float(b.avg_value or 0), 2)
            } for b in by_brand
        ],
        "by_condition": [
            {
                "condition": c.condition,
                "count": c.count,
                "avg_value": round(float(c.avg_value or 0), 2)
            } for c in by_condition
        ]
    }


@router.get("/profit-loss")
def profit_loss_analysis(db: Session = Depends(get_db)):
    """
    Profit and loss analysis for swaps and sales
    Calculates potential profit from swap transactions
    """
    # Get all swaps with phone data
    swaps = db.query(Swap).all()
    
    swap_analysis = []
    total_profit = 0.0
    
    for swap in swaps:
        # Get the new phone value
        phone = db.query(Phone).filter(Phone.id == swap.new_phone_id).first()
        if phone:
            # Profit = (Given phone value + Balance paid) - New phone original value
            # This is simplified - in real scenario, we'd track original purchase price
            profit = swap.total_transaction_value - phone.value
            total_profit += profit
            
            swap_analysis.append({
                "swap_id": swap.id,
                "given_phone_value": swap.given_phone_value,
                "balance_paid": swap.balance_paid,
                "total_received": swap.total_transaction_value,
                "phone_value": phone.value,
                "estimated_profit": round(profit, 2),
                "created_at": swap.created_at.isoformat()
            })
    
    # Sales profit (simplified)
    sales = db.query(Sale).all()
    sales_profit_data = []
    total_sales_profit = 0.0
    
    for sale in sales:
        phone = db.query(Phone).filter(Phone.id == sale.phone_id).first()
        if phone:
            # Profit = Amount paid - Phone value
            profit = sale.amount_paid - phone.value
            total_sales_profit += profit
            
            sales_profit_data.append({
                "sale_id": sale.id,
                "amount_paid": sale.amount_paid,
                "phone_value": phone.value,
                "profit": round(profit, 2)
            })
    
    return {
        "swaps": {
            "total_count": len(swaps),
            "total_profit": round(total_profit, 2),
            "average_profit": round(total_profit / len(swaps), 2) if swaps else 0.0,
            "transactions": swap_analysis[:10]  # Last 10
        },
        "sales": {
            "total_count": len(sales),
            "total_profit": round(total_sales_profit, 2),
            "average_profit": round(total_sales_profit / len(sales), 2) if sales else 0.0,
            "transactions": sales_profit_data[:10]  # Last 10
        },
        "combined_profit": round(total_profit + total_sales_profit, 2)
    }


@router.get("/dashboard-summary")
def dashboard_summary(db: Session = Depends(get_db)):
    """
    Complete dashboard summary
    All key metrics in one call for dashboard homepage
    """
    # Quick stats
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_repairs = db.query(func.count(Repair.id)).scalar()
    pending_repairs = db.query(func.count(Repair.id)).filter(Repair.status == "Pending").scalar()
    available_phones = db.query(func.count(Phone.id)).filter(Phone.is_available == True).scalar()
    
    # Revenue (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_repair_revenue = (
        db.query(func.sum(Repair.cost))
        .filter(Repair.created_at >= thirty_days_ago)
        .scalar() or 0.0
    )
    recent_sales_revenue = (
        db.query(func.sum(Sale.amount_paid))
        .filter(Sale.created_at >= thirty_days_ago)
        .scalar() or 0.0
    )
    
    monthly_revenue = recent_repair_revenue + recent_sales_revenue
    
    return {
        "quick_stats": {
            "total_customers": total_customers,
            "total_repairs": total_repairs,
            "pending_repairs": pending_repairs,
            "available_phones": available_phones,
            "monthly_revenue": round(monthly_revenue, 2)
        },
        "alerts": {
            "low_inventory": available_phones < 5,
            "pending_repairs_count": pending_repairs
        }
    }

