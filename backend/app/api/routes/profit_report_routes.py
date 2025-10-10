"""
Profit Report API Routes - Manager Only
Generate PDF profit reports for different time periods
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_manager
from app.core.profit_reports import generate_profit_report
from app.models.user import User

router = APIRouter(prefix="/profit-reports", tags=["Profit Reports"])


@router.get("/daily")
def get_daily_profit_report(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format. Default: today"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate daily profit report (Manager ONLY)
    Returns PDF file
    """
    # Only managers can access profit reports
    require_manager(current_user)
    
    # Parse date
    if date:
        try:
            report_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        report_date = datetime.now()
    
    # Get company name
    company_name = current_user.company_name if current_user.company_name else "SwapSync"
    
    # Generate PDF
    try:
        pdf_bytes = generate_profit_report(
            db=db,
            period='daily',
            company_name=company_name,
            specific_date=report_date
        )
        
        # Return PDF response
        filename = f"Daily_Profit_Report_{report_date.strftime('%Y-%m-%d')}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/weekly")
def get_weekly_profit_report(
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format. Default: today"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate weekly profit report (last 7 days) (Manager ONLY)
    Returns PDF file
    """
    # Only managers can access profit reports
    require_manager(current_user)
    
    # Parse date
    if end_date:
        try:
            report_end_date = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        report_end_date = datetime.now()
    
    # Get company name
    company_name = current_user.company_name if current_user.company_name else "SwapSync"
    
    # Generate PDF
    try:
        pdf_bytes = generate_profit_report(
            db=db,
            period='weekly',
            company_name=company_name,
            specific_date=report_end_date
        )
        
        # Return PDF response
        filename = f"Weekly_Profit_Report_{report_end_date.strftime('%Y-%m-%d')}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/monthly")
def get_monthly_profit_report(
    year: Optional[int] = Query(None, description="Year (e.g., 2024). Default: current year"),
    month: Optional[int] = Query(None, description="Month (1-12). Default: current month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate monthly profit report (Manager ONLY)
    Returns PDF file
    """
    # Only managers can access profit reports
    require_manager(current_user)
    
    # Use current year/month if not specified
    if year is None or month is None:
        now = datetime.now()
        year = year or now.year
        month = month or now.month
    
    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12"
        )
    
    # Get company name
    company_name = current_user.company_name if current_user.company_name else "SwapSync"
    
    # Generate PDF
    try:
        pdf_bytes = generate_profit_report(
            db=db,
            period='monthly',
            company_name=company_name,
            year=year,
            month=month
        )
        
        # Return PDF response
        month_name = datetime(year, month, 1).strftime('%B')
        filename = f"Monthly_Profit_Report_{month_name}_{year}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/yearly")
def get_yearly_profit_report(
    year: Optional[int] = Query(None, description="Year (e.g., 2024). Default: current year"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate yearly profit report (Manager ONLY)
    Returns PDF file
    """
    # Only managers can access profit reports
    require_manager(current_user)
    
    # Use current year if not specified
    if year is None:
        year = datetime.now().year
    
    # Get company name
    company_name = current_user.company_name if current_user.company_name else "SwapSync"
    
    # Generate PDF
    try:
        pdf_bytes = generate_profit_report(
            db=db,
            period='yearly',
            company_name=company_name,
            year=year
        )
        
        # Return PDF response
        filename = f"Yearly_Profit_Report_{year}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/summary")
def get_profit_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get quick profit summary for today, this week, this month (Manager ONLY)
    Returns JSON with summary data
    """
    # Only managers can access profit reports
    require_manager(current_user)
    
    from app.models.sale import Sale
    from app.models.product_sale import ProductSale
    from app.models.phone import Phone
    from datetime import timedelta
    
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=6)
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = datetime(now.year, now.month, 1)
    
    # Today's data
    today_phone_sales = db.query(Sale).filter(Sale.created_at >= today_start).all()
    today_product_sales = db.query(ProductSale).filter(ProductSale.created_at >= today_start).all()
    
    today_revenue = sum(s.amount_paid for s in today_phone_sales) + sum(s.total_amount for s in today_product_sales)
    today_profit = sum(s.profit for s in today_product_sales)
    
    # Add phone profit
    for sale in today_phone_sales:
        phone = db.query(Phone).filter(Phone.id == sale.phone_id).first()
        if phone:
            today_profit += (sale.amount_paid - phone.value)
    
    # Week data
    week_phone_sales = db.query(Sale).filter(Sale.created_at >= week_start).all()
    week_product_sales = db.query(ProductSale).filter(ProductSale.created_at >= week_start).all()
    
    week_revenue = sum(s.amount_paid for s in week_phone_sales) + sum(s.total_amount for s in week_product_sales)
    week_profit = sum(s.profit for s in week_product_sales)
    
    for sale in week_phone_sales:
        phone = db.query(Phone).filter(Phone.id == sale.phone_id).first()
        if phone:
            week_profit += (sale.amount_paid - phone.value)
    
    # Month data
    month_phone_sales = db.query(Sale).filter(Sale.created_at >= month_start).all()
    month_product_sales = db.query(ProductSale).filter(ProductSale.created_at >= month_start).all()
    
    month_revenue = sum(s.amount_paid for s in month_phone_sales) + sum(s.total_amount for s in month_product_sales)
    month_profit = sum(s.profit for s in month_product_sales)
    
    for sale in month_phone_sales:
        phone = db.query(Phone).filter(Phone.id == sale.phone_id).first()
        if phone:
            month_profit += (sale.amount_paid - phone.value)
    
    return {
        "today": {
            "revenue": today_revenue,
            "profit": today_profit,
            "sales_count": len(today_phone_sales) + len(today_product_sales)
        },
        "this_week": {
            "revenue": week_revenue,
            "profit": week_profit,
            "sales_count": len(week_phone_sales) + len(week_product_sales)
        },
        "this_month": {
            "revenue": month_revenue,
            "profit": month_profit,
            "sales_count": len(month_phone_sales) + len(month_product_sales)
        }
    }

