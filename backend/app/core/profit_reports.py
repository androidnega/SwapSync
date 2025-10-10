"""
Profit Report Generator - Creates beautiful PDF reports for different time periods
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Tuple
import io

from app.models.sale import Sale
from app.models.product_sale import ProductSale
from app.models.phone import Phone
from app.models.product import Product
from app.models.user import User


class ProfitReportGenerator:
    """Generate profit reports in PDF format"""
    
    def __init__(self, db: Session, company_name: str = "SwapSync"):
        self.db = db
        self.company_name = company_name
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a56db'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        # Subtitle style
        self.subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#6b7280'),
            spaceAfter=20,
            alignment=TA_CENTER
        )
        
        # Section header style
        self.section_style = ParagraphStyle(
            'SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
    
    def _calculate_phone_sales_data(self, start_date: datetime, end_date: datetime) -> Dict:
        """Calculate phone sales data for the period"""
        sales = self.db.query(Sale).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date
        ).all()
        
        total_revenue = sum(s.amount_paid for s in sales)
        total_sales = len(sales)
        
        # Calculate costs and profits
        total_cost = 0
        for sale in sales:
            phone = self.db.query(Phone).filter(Phone.id == sale.phone_id).first()
            if phone:
                total_cost += phone.value
        
        total_profit = total_revenue - total_cost
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        return {
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'total_profit': total_profit,
            'profit_margin': profit_margin,
            'sales': sales
        }
    
    def _calculate_product_sales_data(self, start_date: datetime, end_date: datetime) -> Dict:
        """Calculate product sales data for the period"""
        sales = self.db.query(ProductSale).filter(
            ProductSale.created_at >= start_date,
            ProductSale.created_at <= end_date
        ).all()
        
        total_revenue = sum(s.total_amount for s in sales)
        total_sales = len(sales)
        total_profit = sum(s.profit for s in sales)
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        return {
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'total_profit': total_profit,
            'profit_margin': profit_margin,
            'sales': sales
        }
    
    def _create_summary_table(self, phone_data: Dict, product_data: Dict) -> Table:
        """Create summary table with key metrics"""
        total_revenue = phone_data['total_revenue'] + product_data['total_revenue']
        total_profit = phone_data['total_profit'] + product_data['total_profit']
        total_sales = phone_data['total_sales'] + product_data['total_sales']
        overall_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        data = [
            ['Metric', 'Phone Sales', 'Product Sales', 'Total'],
            ['Number of Sales', str(phone_data['total_sales']), str(product_data['total_sales']), str(total_sales)],
            ['Total Revenue', f'₵{phone_data["total_revenue"]:.2f}', f'₵{product_data["total_revenue"]:.2f}', f'₵{total_revenue:.2f}'],
            ['Total Profit', f'₵{phone_data["total_profit"]:.2f}', f'₵{product_data["total_profit"]:.2f}', f'₵{total_profit:.2f}'],
            ['Profit Margin', f'{phone_data["profit_margin"]:.1f}%', f'{product_data["profit_margin"]:.1f}%', f'{overall_margin:.1f}%'],
        ]
        
        table = Table(data, colWidths=[2.5*inch, 1.8*inch, 1.8*inch, 1.8*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ]))
        
        return table
    
    def _create_top_items_table(self, phone_data: Dict, product_data: Dict) -> Table:
        """Create table showing top selling items"""
        # Count phone sales
        phone_counts = {}
        for sale in phone_data['sales']:
            phone = self.db.query(Phone).filter(Phone.id == sale.phone_id).first()
            if phone:
                key = f"{phone.brand} {phone.model}"
                phone_counts[key] = phone_counts.get(key, 0) + 1
        
        # Count product sales
        product_counts = {}
        for sale in product_data['sales']:
            product = self.db.query(Product).filter(Product.id == sale.product_id).first()
            if product:
                key = product.name
                product_counts[key] = product_counts.get(key, 0) + sale.quantity
        
        # Get top 5 of each
        top_phones = sorted(phone_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        data = [['Top Selling Phones', 'Qty', 'Top Selling Products', 'Qty']]
        
        max_rows = max(len(top_phones), len(top_products))
        for i in range(max_rows):
            phone_name = top_phones[i][0] if i < len(top_phones) else ''
            phone_qty = str(top_phones[i][1]) if i < len(top_phones) else ''
            product_name = top_products[i][0] if i < len(top_products) else ''
            product_qty = str(top_products[i][1]) if i < len(top_products) else ''
            data.append([phone_name, phone_qty, product_name, product_qty])
        
        table = Table(data, colWidths=[3*inch, 0.8*inch, 3*inch, 0.8*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('ALIGN', (3, 0), (3, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
        ]))
        
        return table
    
    def generate_daily_report(self, report_date: datetime = None) -> bytes:
        """Generate daily profit report"""
        if report_date is None:
            report_date = datetime.now()
        
        start_date = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = report_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        return self._generate_report(
            start_date, 
            end_date, 
            f"Daily Profit Report - {report_date.strftime('%B %d, %Y')}"
        )
    
    def generate_weekly_report(self, end_date: datetime = None) -> bytes:
        """Generate weekly profit report (last 7 days)"""
        if end_date is None:
            end_date = datetime.now()
        
        start_date = end_date - timedelta(days=6)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        return self._generate_report(
            start_date, 
            end_date, 
            f"Weekly Profit Report - {start_date.strftime('%b %d')} to {end_date.strftime('%b %d, %Y')}"
        )
    
    def generate_monthly_report(self, year: int = None, month: int = None) -> bytes:
        """Generate monthly profit report"""
        if year is None or month is None:
            now = datetime.now()
            year = now.year
            month = now.month
        
        start_date = datetime(year, month, 1)
        
        # Get last day of month
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        month_name = start_date.strftime('%B %Y')
        
        return self._generate_report(
            start_date, 
            end_date, 
            f"Monthly Profit Report - {month_name}"
        )
    
    def generate_yearly_report(self, year: int = None) -> bytes:
        """Generate yearly profit report"""
        if year is None:
            year = datetime.now().year
        
        start_date = datetime(year, 1, 1)
        end_date = datetime(year, 12, 31, 23, 59, 59, 999999)
        
        return self._generate_report(
            start_date, 
            end_date, 
            f"Yearly Profit Report - {year}"
        )
    
    def _generate_report(self, start_date: datetime, end_date: datetime, title: str) -> bytes:
        """Generate PDF report for the specified period"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []
        
        # Title
        story.append(Paragraph(self.company_name, self.title_style))
        story.append(Paragraph(title, self.subtitle_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Period info
        period_text = f"Period: {start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')}"
        story.append(Paragraph(period_text, self.styles['Normal']))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Calculate data
        phone_data = self._calculate_phone_sales_data(start_date, end_date)
        product_data = self._calculate_product_sales_data(start_date, end_date)
        
        # Summary section
        story.append(Paragraph("Summary Overview", self.section_style))
        story.append(self._create_summary_table(phone_data, product_data))
        story.append(Spacer(1, 0.3*inch))
        
        # Top items section
        story.append(Paragraph("Top Performing Items", self.section_style))
        story.append(self._create_top_items_table(phone_data, product_data))
        story.append(Spacer(1, 0.3*inch))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(f"© {datetime.now().year} {self.company_name}. All rights reserved.", footer_style))
        story.append(Paragraph("This report is confidential and for internal use only.", footer_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return buffer.getvalue()


def generate_profit_report(
    db: Session,
    period: str,
    company_name: str = "SwapSync",
    specific_date: datetime = None,
    year: int = None,
    month: int = None
) -> bytes:
    """
    Generate profit report for specified period
    
    Args:
        db: Database session
        period: 'daily', 'weekly', 'monthly', or 'yearly'
        company_name: Company name for branding
        specific_date: Specific date for daily/weekly reports
        year: Year for monthly/yearly reports
        month: Month for monthly reports
    
    Returns:
        PDF bytes
    """
    generator = ProfitReportGenerator(db, company_name)
    
    if period == 'daily':
        return generator.generate_daily_report(specific_date)
    elif period == 'weekly':
        return generator.generate_weekly_report(specific_date)
    elif period == 'monthly':
        return generator.generate_monthly_report(year, month)
    elif period == 'yearly':
        return generator.generate_yearly_report(year)
    else:
        raise ValueError(f"Invalid period: {period}. Must be 'daily', 'weekly', 'monthly', or 'yearly'")

