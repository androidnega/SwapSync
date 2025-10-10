"""
PDF Generation for Reports and Invoices using ReportLab
(Switched from WeasyPrint to avoid Windows DLL conflicts)
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from datetime import datetime
from typing import List, Dict, Any
from io import BytesIO


def generate_invoice_pdf(invoice_data: Dict[str, Any]) -> BytesIO:
    """
    Generate a PDF invoice from invoice data using ReportLab
    
    Args:
        invoice_data: Dictionary with invoice details
    
    Returns:
        BytesIO: PDF file in memory
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    # Header
    story.append(Paragraph("SWAPSYNC", title_style))
    story.append(Paragraph("Phone Shop Management System", subtitle_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Invoice Info Table
    invoice_info_data = [
        ['Invoice Number:', invoice_data['invoice_number']],
        ['Date:', invoice_data['date']],
        ['Transaction Type:', invoice_data['transaction']['type']],
    ]
    
    invoice_info_table = Table(invoice_info_data, colWidths=[2*inch, 3.5*inch])
    invoice_info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#4b5563')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1f2937')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(invoice_info_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Customer Information
    story.append(Paragraph("Customer Information", styles['Heading3']))
    story.append(Spacer(1, 0.1*inch))
    
    customer_data = [
        ['Name:', invoice_data['customer']['name']],
        ['Phone:', invoice_data['customer']['phone']],
        ['Customer ID:', f"#{invoice_data['customer']['id']}"],
    ]
    
    customer_table = Table(customer_data, colWidths=[2*inch, 3.5*inch])
    customer_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(customer_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Transaction Details
    story.append(Paragraph("Transaction Details", styles['Heading3']))
    story.append(Spacer(1, 0.1*inch))
    
    # Pricing table
    pricing_data = [
        ['Description', 'Amount (GH¢)'],
        ['Original Price', f"{invoice_data['pricing']['original_price']:.2f}"],
    ]
    
    # Add cash added if applicable (for swaps)
    if invoice_data['pricing']['cash_added'] > 0:
        pricing_data.append(['Cash Added', f"{invoice_data['pricing']['cash_added']:.2f}"])
    
    # Add discount if applicable
    if invoice_data['pricing']['discount'] > 0:
        pricing_data.append(['Discount', f"-{invoice_data['pricing']['discount']:.2f}"])
    
    pricing_data.append(['FINAL AMOUNT', f"{invoice_data['pricing']['final_amount']:.2f}"])
    
    pricing_table = Table(pricing_data, colWidths=[4*inch, 2*inch])
    pricing_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -2), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#f9fafb')]),
        
        # Total row
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('TOPPADDING', (0, -1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
    ]))
    story.append(pricing_table)
    story.append(Spacer(1, 0.5*inch))
    
    # Footer
    footer_text = [
        "Thank you for your business!",
        "SwapSync - Phone Shop Management System",
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
    ]
    
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    
    for text in footer_text:
        story.append(Paragraph(text, footer_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_sales_report_pdf(transactions: List[Dict[str, Any]], filters: Dict[str, Any]) -> BytesIO:
    """
    Generate a PDF sales/swaps report using ReportLab
    
    Args:
        transactions: List of transaction dictionaries
        filters: Applied filters (dates, type, etc.)
    
    Returns:
        BytesIO: PDF file in memory
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1f2937'),
        alignment=TA_CENTER,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    story.append(Paragraph("Sales & Swaps Report", title_style))
    story.append(Paragraph("SwapSync - Phone Shop Management", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Filters section
    filter_text = ""
    if filters.get('start_date'):
        filter_text += f"From: {filters['start_date']} "
    if filters.get('end_date'):
        filter_text += f"To: {filters['end_date']} "
    if filters.get('transaction_type'):
        filter_text += f"Type: {filters['transaction_type']} "
    
    if filter_text:
        filter_para = Paragraph(f"<b>Filters:</b> {filter_text}", styles['Normal'])
        story.append(filter_para)
        story.append(Spacer(1, 0.2*inch))
    
    # Transactions table
    if not transactions:
        story.append(Paragraph("No transactions found for the selected period.", styles['Normal']))
    else:
        # Table header
        table_data = [
            ['ID', 'Type', 'Customer', 'Phone', 'Cash', 'Discount', 'Final', 'Date']
        ]
        
        # Add transaction rows
        for txn in transactions:
            table_data.append([
                f"#{txn.get('id', '')}",
                txn.get('type', 'N/A'),
                txn.get('customer', 'N/A')[:20],  # Truncate long names
                txn.get('phone', 'N/A')[:20],
                f"{txn.get('cash', 0):.0f}",
                f"{txn.get('discount', 0):.0f}",
                f"{txn.get('final_price', 0):.0f}",
                txn.get('date', 'N/A')[:10],
            ])
        
        # Create table
        transactions_table = Table(table_data, colWidths=[
            0.4*inch, 0.6*inch, 1.3*inch, 1.3*inch, 0.7*inch, 0.7*inch, 0.7*inch, 0.9*inch
        ])
        
        transactions_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ALIGN', (4, 1), (-1, -1), 'RIGHT'),  # Align numbers right
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(transactions_table)
    
    story.append(Spacer(1, 0.3*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    
    story.append(Paragraph("SwapSync - Phone Shop Management System", footer_style))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", footer_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
