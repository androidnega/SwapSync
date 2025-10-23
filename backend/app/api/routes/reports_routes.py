"""
Reports & Analytics API Routes - Detailed reporting with filters
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import Optional
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import can_manage_swaps, can_manage_repairs, can_view_analytics
from app.core.pdf_generator import generate_sales_report_pdf
from app.models.user import User, UserRole
from app.models.swap import Swap, ResaleStatus
from app.models.sale import Sale
from app.models.repair import Repair
from app.models.customer import Customer
from app.models.phone import Phone
from app.models.invoice import Invoice

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/sales-swaps")
def get_sales_swaps_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    transaction_type: Optional[str] = None,  # 'sale', 'swap', or None for all
    staff_id: Optional[int] = None,  # Filter by staff member
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed sales and swaps report with filtering
    Distinguishes between direct sales and swaps
    Can filter by staff member (who created the transaction)
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view reports"
        )
    
    results = []
    
    # Parse dates if provided
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    # Get sales (direct purchases - no exchange)
    if transaction_type in [None, 'sale']:
        sales_query = db.query(Sale).join(Customer).join(Phone)
        
        if start:
            sales_query = sales_query.filter(Sale.created_at >= start)
        if end:
            sales_query = sales_query.filter(Sale.created_at <= end)
        
        # Filter by staff if provided
        if staff_id:
            sales_query = sales_query.join(Invoice, Sale.invoice_number == Invoice.invoice_number).filter(Invoice.staff_id == staff_id)
        
        sales = sales_query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
        
        for sale in sales:
            customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
            phone = db.query(Phone).filter(Phone.id == sale.phone_id).first()
            
            profit = sale.amount_paid - (phone.value if phone else 0)
            
            results.append({
                "id": sale.id,
                "transaction_type": "Sale",
                "customer": {
                    "id": customer.id if customer else None,
                    "name": customer.full_name if customer else "Unknown",
                    "phone": customer.phone_number if customer else ""
                },
                "phone_received": {
                    "id": phone.id if phone else None,
                    "name": f"{phone.brand} {phone.model}" if phone else "Unknown",
                    "condition": phone.condition if phone else "",
                    "cost": phone.value if phone else 0
                },
                "exchanged_phone": None,  # No exchange in direct sale
                "original_price": sale.original_price,
                "cash_added": 0,  # Direct sale, no cash added
                "discount": sale.discount_amount,
                "final_price": sale.amount_paid,
                "profit": profit if can_view_analytics(current_user) else None,
                "status": "Completed",
                "invoice_number": sale.invoice_number,
                "created_at": sale.created_at.isoformat(),
                "is_swap": False
            })
    
    # Get swaps (exchange + cash)
    if transaction_type in [None, 'swap']:
        swaps_query = db.query(Swap).join(Customer)
        
        if start:
            swaps_query = swaps_query.filter(Swap.created_at >= start)
        if end:
            swaps_query = swaps_query.filter(Swap.created_at <= end)
        
        # Filter by staff if provided
        if staff_id:
            swaps_query = swaps_query.join(Invoice, Swap.invoice_number == Invoice.invoice_number).filter(Invoice.staff_id == staff_id)
        
        swaps = swaps_query.order_by(Swap.created_at.desc()).offset(skip).limit(limit).all()
        
        for swap in swaps:
            customer = db.query(Customer).filter(Customer.id == swap.customer_id).first()
            new_phone = db.query(Phone).filter(Phone.id == swap.new_phone_id).first()
            
            # Calculate profit (only if resold)
            if swap.resale_status == ResaleStatus.SOLD:
                profit = swap.profit_or_loss
            else:
                profit = None  # Pending
            
            results.append({
                "id": swap.id,
                "transaction_type": "Swap",
                "customer": {
                    "id": customer.id if customer else None,
                    "name": customer.full_name if customer else "Unknown",
                    "phone": customer.phone_number if customer else ""
                },
                "phone_received": {
                    "id": new_phone.id if new_phone else None,
                    "name": f"{new_phone.brand} {new_phone.model}" if new_phone else "Unknown",
                    "condition": new_phone.condition if new_phone else "",
                    "cost": new_phone.value if new_phone else 0
                },
                "exchanged_phone": {
                    "description": swap.given_phone_description,
                    "value": swap.given_phone_value
                },
                "original_price": new_phone.value if new_phone else 0,
                "cash_added": swap.final_price,  # Final cash after discount
                "discount": swap.discount_amount,
                "final_price": swap.final_price,
                "profit": profit if can_view_analytics(current_user) else None,
                "status": swap.resale_status.value,
                "invoice_number": swap.invoice_number,
                "created_at": swap.created_at.isoformat(),
                "is_swap": True
            })
    
    # Sort by date descending
    results.sort(key=lambda x: x['created_at'], reverse=True)
    
    return {
        "total": len(results),
        "transactions": results,
        "filters": {
            "start_date": start_date,
            "end_date": end_date,
            "type": transaction_type
        },
        "user_can_view_profit": can_view_analytics(current_user)
    }


@router.get("/pending-resales-detailed")
def get_pending_resales_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed pending resales report
    Shows all exchanged phones waiting to be resold
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view pending resales"
        )
    
    pending_swaps = (
        db.query(Swap)
        .filter(Swap.resale_status == ResaleStatus.PENDING)
        .filter(Swap.given_phone_value > 0)
        .order_by(Swap.created_at.desc())
        .all()
    )
    
    results = []
    total_pending_value = 0
    
    for swap in pending_swaps:
        customer = db.query(Customer).filter(Customer.id == swap.customer_id).first()
        new_phone = db.query(Phone).filter(Phone.id == swap.new_phone_id).first()
        
        # Calculate expected profit if sold at original value
        expected_profit = swap.given_phone_value + swap.final_price - (new_phone.value if new_phone else 0)
        
        total_pending_value += swap.given_phone_value
        
        results.append({
            "swap_id": swap.id,
            "customer_name": customer.full_name if customer else "Unknown",
            "exchanged_phone": swap.given_phone_description,
            "exchanged_phone_value": swap.given_phone_value,
            "cash_received": swap.final_price,
            "new_phone_given": f"{new_phone.brand} {new_phone.model}" if new_phone else "Unknown",
            "new_phone_cost": new_phone.value if new_phone else 0,
            "expected_profit_at_value": expected_profit if can_view_analytics(current_user) else None,
            "days_pending": (datetime.utcnow() - swap.created_at).days,
            "created_at": swap.created_at.isoformat(),
            "invoice_number": swap.invoice_number
        })
    
    return {
        "total_pending": len(results),
        "total_pending_value": total_pending_value,
        "average_pending_value": total_pending_value / len(results) if results else 0,
        "pending_resales": results,
        "user_can_view_profit": can_view_analytics(current_user)
    }


@router.get("/profit-summary")
def get_profit_summary_report(
    period: str = Query("all", regex="^(today|week|month|all)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get profit summary report (CEO/Admin only)
    Shows profit from sales, swaps, and repairs
    """
    if not can_view_analytics(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view financial reports"
        )
    
    # Calculate date range
    now = datetime.utcnow()
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = None
    
    # Sales profit
    sales_query = db.query(Sale).join(Phone)
    if start_date:
        sales_query = sales_query.filter(Sale.created_at >= start_date)
    
    sales = sales_query.all()
    sales_profit = sum(sale.amount_paid - (db.query(Phone).filter(Phone.id == sale.phone_id).first().value if db.query(Phone).filter(Phone.id == sale.phone_id).first() else 0) for sale in sales)
    
    # Swaps profit (only completed/sold)
    swaps_query = db.query(Swap).filter(Swap.resale_status == ResaleStatus.SOLD)
    if start_date:
        swaps_query = swaps_query.filter(Swap.created_at >= start_date)
    
    swaps = swaps_query.all()
    swaps_profit = sum(swap.profit_or_loss for swap in swaps)
    
    # Repairs revenue
    repairs_query = db.query(Repair)
    if start_date:
        repairs_query = repairs_query.filter(Repair.created_at >= start_date)
    
    repairs_revenue = repairs_query.with_entities(func.sum(Repair.cost)).scalar() or 0
    
    # Total discounts given
    total_discounts = (
        db.query(func.sum(Swap.discount_amount)).filter(
            Swap.created_at >= start_date if start_date else True
        ).scalar() or 0
    ) + (
        db.query(func.sum(Sale.discount_amount)).filter(
            Sale.created_at >= start_date if start_date else True
        ).scalar() or 0
    )
    
    total_profit = sales_profit + swaps_profit + repairs_revenue
    
    return {
        "period": period,
        "profit_breakdown": {
            "from_sales": round(sales_profit, 2),
            "from_swaps": round(swaps_profit, 2),
            "from_repairs": round(repairs_revenue, 2),
            "total": round(total_profit, 2)
        },
        "transactions_count": {
            "sales": len(sales),
            "swaps": len(swaps),
            "repairs": repairs_query.count()
        },
        "discounts_given": round(total_discounts, 2),
        "net_profit": round(total_profit - total_discounts, 2)
    }


@router.get("/repair-analytics")
def get_repair_analytics(
    period: str = Query("all", regex="^(today|week|month|all)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get repair analytics report
    Shows completed repairs, pending, fault types, etc.
    """
    if not can_manage_repairs(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view repair analytics"
        )
    
    # Calculate date range
    now = datetime.utcnow()
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = None
    
    # Query repairs
    repairs_query = db.query(Repair)
    if start_date:
        repairs_query = repairs_query.filter(Repair.created_at >= start_date)
    
    repairs = repairs_query.all()
    
    # Status breakdown
    status_counts = {
        "pending": len([r for r in repairs if r.status == "Pending"]),
        "in_progress": len([r for r in repairs if r.status == "In Progress"]),
        "completed": len([r for r in repairs if r.status == "Completed"]),
        "delivered": len([r for r in repairs if r.status == "Delivered"])
    }
    
    # Calculate average duration for completed repairs
    completed = [r for r in repairs if r.status in ["Completed", "Delivered"] and r.updated_at and r.created_at]
    avg_duration_days = 0
    if completed:
        durations = [(r.updated_at - r.created_at).days for r in completed]
        avg_duration_days = sum(durations) / len(durations)
    
    # Revenue
    total_revenue = sum(r.cost for r in repairs if r.cost)
    avg_repair_cost = total_revenue / len(repairs) if repairs else 0
    
    # Fault types (if diagnosis field exists)
    fault_types = {}
    for repair in repairs:
        if repair.diagnosis:
            fault_types[repair.diagnosis] = fault_types.get(repair.diagnosis, 0) + 1
    
    return {
        "period": period,
        "total_repairs": len(repairs),
        "status_breakdown": status_counts,
        "revenue": {
            "total": round(total_revenue, 2),
            "average_per_repair": round(avg_repair_cost, 2)
        },
        "average_duration_days": round(avg_duration_days, 1),
        "fault_types": fault_types,
        "completion_rate": round((status_counts["completed"] + status_counts["delivered"]) / len(repairs) * 100, 1) if repairs else 0
    }


@router.get("/export/csv")
def export_report_csv(
    report_type: str = Query(..., regex="^(sales_swaps|pending_resales|repairs)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export report as CSV data
    Returns CSV formatted string
    """
    if report_type in ["sales_swaps", "pending_resales"] and not can_manage_swaps(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if report_type == "repairs" and not can_manage_repairs(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate CSV data based on report type
    if report_type == "sales_swaps":
        # Get data from sales_swaps report
        report_data = get_sales_swaps_report(start_date, end_date, None, 0, 1000, db, current_user)
        
        csv_lines = ["ID,Type,Customer,Phone,Exchanged Phone,Cash,Discount,Final Price,Profit,Status,Date"]
        
        for tx in report_data["transactions"]:
            line = f"{tx['id']},{tx['transaction_type']},{tx['customer']['name']},"
            line += f"{tx['phone_received']['name']},{tx['exchanged_phone']['description'] if tx['exchanged_phone'] else 'N/A'},"
            line += f"{tx['cash_added']},{tx['discount']},{tx['final_price']},"
            line += f"{tx['profit'] if tx['profit'] is not None else 'N/A'},{tx['status']},{tx['created_at']}"
            csv_lines.append(line)
        
        csv_content = "\n".join(csv_lines)
        
        return {
            "filename": f"sales_swaps_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
            "content": csv_content,
            "content_type": "text/csv"
        }
    
    elif report_type == "pending_resales":
        report_data = get_pending_resales_report(db, current_user)
        
        csv_lines = ["Swap ID,Customer,Exchanged Phone,Value,Cash Received,New Phone,Days Pending,Expected Profit"]
        
        for item in report_data["pending_resales"]:
            line = f"{item['swap_id']},{item['customer_name']},{item['exchanged_phone']},"
            line += f"{item['exchanged_phone_value']},{item['cash_received']},{item['new_phone_given']},"
            line += f"{item['days_pending']},{item['expected_profit_at_value'] if item['expected_profit_at_value'] is not None else 'N/A'}"
            csv_lines.append(line)
        
        csv_content = "\n".join(csv_lines)
        
        return {
            "filename": f"pending_resales_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
            "content": csv_content,
            "content_type": "text/csv"
        }
    
    elif report_type == "repairs":
        repairs = db.query(Repair).join(Customer).all()
        
        csv_lines = ["ID,Customer,Phone,Issue,Status,Cost,Created,Updated"]
        
        for repair in repairs:
            customer = db.query(Customer).filter(Customer.id == repair.customer_id).first()
            line = f"{repair.id},{customer.full_name if customer else 'Unknown'},"
            line += f"{repair.phone_description},{repair.issue or 'N/A'},{repair.status},"
            line += f"{repair.cost},{repair.created_at},{repair.updated_at or 'N/A'}"
            csv_lines.append(line)
        
        csv_content = "\n".join(csv_lines)
        
        return {
            "filename": f"repairs_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
            "content": csv_content,
            "content_type": "text/csv"
        }


@router.get("/export/pdf")
def export_report_pdf(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    transaction_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export sales/swaps report as PDF
    Returns PDF file for download
    """
    if not can_manage_swaps(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to export reports"
        )
    
    # Get report data
    report_data = get_sales_swaps_report(start_date, end_date, transaction_type, 0, 1000, db, current_user)
    
    # Format transactions for PDF
    transactions = []
    for tx in report_data["transactions"]:
        transactions.append({
            "id": tx["id"],
            "type": tx["transaction_type"],
            "customer": tx["customer"]["name"],
            "phone": tx["phone_received"]["name"],
            "cash": tx["cash_added"],
            "discount": tx["discount"],
            "final_price": tx["final_price"],
            "date": tx["created_at"][:10]  # Just the date part
        })
    
    # Prepare filters for PDF header
    filters = {
        "start_date": start_date,
        "end_date": end_date,
        "transaction_type": transaction_type or "All"
    }
    
    # Generate PDF
    pdf_buffer = generate_sales_report_pdf(transactions, filters)
    
    # Return as streaming response
    filename = f"sales_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

