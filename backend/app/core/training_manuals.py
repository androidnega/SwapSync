"""
Training Manual PDF Generator for SwapSync
Generates role-specific training manuals for Shop Keepers, Managers, and Repairers
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    PageBreak, Image, ListFlowable, ListItem
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from io import BytesIO
from datetime import datetime


def generate_shopkeeper_manual() -> BytesIO:
    """Generate comprehensive training manual for Shop Keepers"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                           topMargin=0.75*inch, bottomMargin=0.75*inch,
                           leftMargin=0.75*inch, rightMargin=0.75*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=colors.HexColor('#3b82f6'),
        spaceAfter=8,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=6,
        alignment=TA_JUSTIFY
    )
    
    # Cover Page
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("SwapSync Training Manual", title_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("SHOP KEEPER GUIDE", ParagraphStyle(
        'RoleTitle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#10b981'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Complete Walkthrough & Training", ParagraphStyle(
        'Subtitle2',
        parent=styles['Normal'],
        fontSize=13,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER
    )))
    story.append(Spacer(1, 1*inch))
    
    # Version info box
    version_data = [
        ['Document Version:', '1.0'],
        ['Last Updated:', datetime.now().strftime('%B %d, %Y')],
        ['Role:', 'Shop Keeper'],
        ['Access Level:', 'POS Sales, Customers, Products']
    ]
    version_table = Table(version_data, colWidths=[2.5*inch, 3*inch])
    version_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f9ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1e40af')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#3b82f6')),
    ]))
    story.append(version_table)
    
    story.append(PageBreak())
    
    # Table of Contents
    story.append(Paragraph("Table of Contents", heading_style))
    toc_data = [
        "1. Welcome to SwapSync",
        "2. Getting Started - First Login",
        "3. Your Dashboard Overview",
        "4. Point of Sale (POS) System",
        "5. Managing Products",
        "6. Customer Management",
        "7. Daily Tasks & Best Practices",
        "8. Troubleshooting & FAQ",
        "9. Contact & Support"
    ]
    for item in toc_data:
        story.append(Paragraph(f"• {item}", body_style))
    story.append(PageBreak())
    
    # Section 1: Welcome
    story.append(Paragraph("1. Welcome to SwapSync", heading_style))
    story.append(Paragraph(
        "Welcome to your role as a Shop Keeper! SwapSync is designed to make your daily sales operations smooth and efficient. "
        "This manual will guide you through everything you need to know to excel in your role.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Your Responsibilities:", subheading_style))
    responsibilities = [
        "Process customer sales through the POS system",
        "Manage product inventory and stock levels",
        "Create and manage customer records",
        "Handle walk-in customers and regular customers",
        "Generate receipts and send SMS confirmations",
        "Keep track of daily sales targets"
    ]
    for resp in responsibilities:
        story.append(Paragraph(f"✓ {resp}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Section 2: Getting Started
    story.append(PageBreak())
    story.append(Paragraph("2. Getting Started - First Login", heading_style))
    
    story.append(Paragraph("Step 1: Accessing the System", subheading_style))
    story.append(Paragraph(
        "Your manager will provide you with login credentials (username and password). "
        "Access the system at: <b>swapsync.digitstec.store</b>",
        body_style
    ))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Step 2: First-Time Login", subheading_style))
    login_steps = [
        "<b>Enter your username</b> - Provided by your manager",
        "<b>Enter your password</b> - You'll be required to change it on first login",
        "<b>Change password</b> - Create a strong, memorable password",
        "<b>Access granted</b> - You'll see your personalized dashboard"
    ]
    for step in login_steps:
        story.append(Paragraph(f"→ {step}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Password Requirements:", subheading_style))
    story.append(Paragraph(
        "• Minimum 8 characters<br/>"
        "• Mix of letters and numbers recommended<br/>"
        "• Keep it secure and don't share with anyone",
        body_style
    ))
    
    # Section 3: Dashboard
    story.append(PageBreak())
    story.append(Paragraph("3. Your Dashboard Overview", heading_style))
    story.append(Paragraph(
        "Your dashboard shows today's performance and quick access to all features.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Dashboard Cards:", subheading_style))
    dashboard_items = [
        ["<b>Total Items in Stock</b>", "Shows how many products you have available to sell"],
        ["<b>Sold Today</b>", "Number of items you've sold today"],
        ["<b>Amount Recorded</b>", "Total revenue collected today"],
    ]
    for title, desc in dashboard_items:
        story.append(Paragraph(f"{title}: {desc}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Section 4: POS System (Most Important!)
    story.append(PageBreak())
    story.append(Paragraph("4. Point of Sale (POS) System", heading_style))
    story.append(Paragraph(
        "<b>This is your main tool for making sales!</b> The POS system allows you to sell multiple items in one transaction.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("How to Make a Sale - Step by Step:", subheading_style))
    
    pos_steps = [
        ("<b>Step 1: Search for Products</b>", 
         "Use the search bar to find products by name or brand. You can also filter by category."),
        
        ("<b>Step 2: Add to Cart</b>", 
         "Click 'Add to Cart' on each product you want to sell. You can add multiple different items."),
        
        ("<b>Step 3: Adjust Quantities</b>", 
         "In the cart, use + and - buttons to change quantities. You can also manually type the number."),
        
        ("<b>Step 4: Apply Discounts (Optional)</b>", 
         "Each item can have its own discount, plus you can add an overall discount for the entire sale."),
        
        ("<b>Step 5: Select Payment Method</b>", 
         "Choose: Cash, Card, or Mobile Money (MoMo)."),
        
        ("<b>Step 6: Select Customer Type</b>", 
         "Choose Walk-in (quick sale), Existing (select from customer list), or New (register new customer)."),
        
        ("<b>Step 7: Complete Sale</b>", 
         "Click 'Complete Sale' button. Enter customer phone number for SMS receipt."),
        
        ("<b>Step 8: Receipt</b>", 
         "Thermal receipt appears on screen. Customer receives SMS receipt automatically.")
    ]
    
    for title, desc in pos_steps:
        story.append(Paragraph(title, subheading_style))
        story.append(Paragraph(desc, body_style))
        story.append(Spacer(1, 0.1*inch))
    
    # Important Notes for POS
    story.append(PageBreak())
    story.append(Paragraph("Important POS Notes:", subheading_style))
    
    notes_data = [
        ['Stock Checking', 'Always check available stock before adding to cart. Out of stock items are automatically disabled.'],
        ['Phone Numbers', 'Phone numbers must be 10-15 digits. SMS receipts require valid Ghana phone numbers.'],
        ['Walk-in Customers', 'For quick sales, use Walk-in option. You can still send receipt to their phone.'],
        ['Editing Prices', 'You can adjust prices for special deals, but be sure to get manager approval for large discounts.'],
        ['Multiple Items', 'Add all items to cart before completing sale. This creates one receipt for everything.']
    ]
    
    notes_table = Table(notes_data, colWidths=[2*inch, 4*inch])
    notes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#dbeafe')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1e40af')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#93c5fd')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(notes_table)
    
    # Section 5: Managing Products
    story.append(PageBreak())
    story.append(Paragraph("5. Managing Products", heading_style))
    story.append(Paragraph(
        "You can view all products in your inventory, check stock levels, and see which items are low on stock.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Product Features You Can Use:", subheading_style))
    product_features = [
        "<b>View All Products:</b> See complete product list with prices and stock",
        "<b>Search Products:</b> Find products quickly by name, brand, or category",
        "<b>Filter by Category:</b> Show only specific product types",
        "<b>Stock Alerts:</b> Products with low stock show orange/red warnings",
        "<b>Product Details:</b> Click on any product to see full specifications"
    ]
    for feature in product_features:
        story.append(Paragraph(f"• {feature}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Section 6: Customer Management
    story.append(PageBreak())
    story.append(Paragraph("6. Customer Management", heading_style))
    story.append(Paragraph(
        "Building a customer database helps you track repeat customers and provide better service.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Adding New Customers:", subheading_style))
    customer_steps = [
        "Click 'Customers' in the menu",
        "Click '+ Add Customer' button",
        "Fill in: Full Name, Phone Number, Email (optional)",
        "Click 'Save' - Customer is now in the system",
        "Next time they visit, select them from 'Existing Customer' in POS"
    ]
    for i, step in enumerate(customer_steps, 1):
        story.append(Paragraph(f"{i}. {step}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Customer Benefits:", subheading_style))
    story.append(Paragraph(
        "• <b>Purchase History:</b> See what they bought before<br/>"
        "• <b>SMS Receipts:</b> Automatic receipts to their saved number<br/>"
        "• <b>Loyalty Tracking:</b> Identify repeat customers<br/>"
        "• <b>Quick Checkout:</b> Faster than entering details every time",
        body_style
    ))
    
    # Section 7: Daily Tasks
    story.append(PageBreak())
    story.append(Paragraph("7. Daily Tasks & Best Practices", heading_style))
    
    story.append(Paragraph("Morning Routine:", subheading_style))
    morning_tasks = [
        "Login to system",
        "Check today's stock levels on dashboard",
        "Review any low-stock alerts",
        "Prepare for customer arrivals"
    ]
    for task in morning_tasks:
        story.append(Paragraph(f"✓ {task}", body_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("During Sales Hours:", subheading_style))
    daytime_tasks = [
        "Process all sales through POS system",
        "Always send SMS receipts to customers",
        "Register new customers when possible",
        "Keep work area organized",
        "Ask for manager help if unsure about pricing"
    ]
    for task in daytime_tasks:
        story.append(Paragraph(f"✓ {task}", body_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("End of Day:", subheading_style))
    evening_tasks = [
        "Review your sales total for the day",
        "Check stock levels - note what needs restocking",
        "Report any issues to manager",
        "Logout from system"
    ]
    for task in evening_tasks:
        story.append(Paragraph(f"✓ {task}", body_style))
    
    # Section 8: Common Scenarios & Solutions
    story.append(PageBreak())
    story.append(Paragraph("8. Common Scenarios & How to Handle Them", heading_style))
    
    scenarios = [
        ("<b>Q: Customer wants discount?</b>",
         "<b>A:</b> You can apply item-level or overall discounts in POS. For large discounts (over 20%), check with your manager first."),
        
        ("<b>Q: Product is out of stock?</b>",
         "<b>A:</b> Product shows 'Out of Stock' and can't be added to cart. Tell customer when restocking expected or suggest alternative products."),
        
        ("<b>Q: Customer has no phone?</b>",
         "<b>A:</b> You can still complete the sale. Use a dummy number like 0000000000 for walk-in customers without phones."),
        
        ("<b>Q: Made a mistake in sale?</b>",
         "<b>A:</b> Before completing, you can edit quantities, remove items from cart, or clear entire cart. After completing, contact your manager for refund."),
        
        ("<b>Q: System is slow or not responding?</b>",
         "<b>A:</b> Refresh the page (F5). If problem persists, logout and login again. Report to manager if continues."),
        
        ("<b>Q: Customer didn't receive SMS?</b>",
         "<b>A:</b> Check if phone number is correct. You can resend receipt from POS Monitor by clicking 'View' on the transaction."),
        
        ("<b>Q: Product price seems wrong?</b>",
         "<b>A:</b> You can adjust price in cart before completing sale. However, report pricing issues to manager to update in system."),
        
        ("<b>Q: Customer wants to pay half cash, half mobile money?</b>",
         "<b>A:</b> Choose the primary payment method in POS. Note the split in the transaction notes field.")
    ]
    
    for question, answer in scenarios:
        story.append(Paragraph(question, subheading_style))
        story.append(Paragraph(answer, body_style))
        story.append(Spacer(1, 0.1*inch))
    
    # Section 9: Tips for Success
    story.append(PageBreak())
    story.append(Paragraph("9. Tips for Success", heading_style))
    
    success_tips = [
        ("<b>Always Send SMS Receipts</b>", "Customers appreciate receipts. It's professional and builds trust."),
        ("<b>Register Regular Customers</b>", "Save their details so next time is faster and you can track their history."),
        ("<b>Check Stock Before Promising</b>", "Always verify stock availability before telling customer you have an item."),
        ("<b>Be Accurate with Prices</b>", "Double-check prices in cart before completing sale to avoid errors."),
        ("<b>Keep Your Manager Informed</b>", "Report low stock, pricing issues, or customer feedback promptly."),
        ("<b>Stay Organized</b>", "Process sales one at a time. Complete each transaction fully before starting next."),
        ("<b>Customer Service</b>", "Be friendly and patient. Happy customers return and bring more business!")
    ]
    
    for title, tip in success_tips:
        story.append(Paragraph(title, subheading_style))
        story.append(Paragraph(tip, body_style))
        story.append(Spacer(1, 0.1*inch))
    
    # Quick Reference Card
    story.append(PageBreak())
    story.append(Paragraph("Quick Reference Card", heading_style))
    story.append(Paragraph("Common Actions & Where to Find Them:", subheading_style))
    
    quick_ref_data = [
        ['<b>Action</b>', '<b>Location</b>', '<b>Button/Link</b>'],
        ['Make a sale', 'POS System page', 'Add items → Complete Sale'],
        ['View today\'s sales', 'Dashboard', 'Stats cards at top'],
        ['Add customer', 'Customers page', '+ Add Customer'],
        ['Search products', 'POS System', 'Search bar'],
        ['Check stock levels', 'Products page', 'View All Products'],
        ['View receipt', 'POS Monitor', 'View button on transaction'],
        ['Resend SMS', 'POS Monitor', 'View transaction → Resend'],
    ]
    
    quick_table = Table(quick_ref_data, colWidths=[2*inch, 2*inch, 2.5*inch])
    quick_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#3b82f6')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f9ff')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(quick_table)
    
    # Contact & Support
    story.append(PageBreak())
    story.append(Paragraph("10. Contact & Support", heading_style))
    story.append(Paragraph(
        "If you need help or have questions:",
        body_style
    ))
    story.append(Spacer(1, 0.1*inch))
    
    contact_data = [
        ['First Contact', 'Your Manager', 'For daily operational questions'],
        ['Technical Issues', 'System Administrator', 'For login or system problems'],
        ['Emergency', 'Manager Phone', 'For urgent customer issues']
    ]
    
    contact_table = Table(contact_data, colWidths=[1.8*inch, 2*inch, 2.7*inch])
    contact_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#dbeafe')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#3b82f6')),
    ]))
    story.append(contact_table)
    
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(
        "<b>Remember:</b> You are the face of the business to customers. Your professionalism and efficiency directly impact sales success!",
        ParagraphStyle(
            'FinalNote',
            parent=body_style,
            fontSize=12,
            textColor=colors.HexColor('#059669'),
            borderWidth=1,
            borderColor=colors.HexColor('#10b981'),
            borderPadding=10,
            backColor=colors.HexColor('#d1fae5')
        )
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_manager_manual() -> BytesIO:
    """Generate comprehensive training manual for Managers"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                           topMargin=0.75*inch, bottomMargin=0.75*inch,
                           leftMargin=0.75*inch, rightMargin=0.75*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#7c2d12'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#ea580c'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=colors.HexColor('#f97316'),
        spaceAfter=8,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=6,
        alignment=TA_JUSTIFY
    )
    
    # Cover Page
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("SwapSync Training Manual", title_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("MANAGER GUIDE", ParagraphStyle(
        'RoleTitle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#ea580c'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Complete Business Management & Staff Oversight", ParagraphStyle(
        'Subtitle2',
        parent=styles['Normal'],
        fontSize=13,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER
    )))
    story.append(Spacer(1, 1*inch))
    
    # Version info
    version_data = [
        ['Document Version:', '1.0'],
        ['Last Updated:', datetime.now().strftime('%B %d, %Y')],
        ['Role:', 'Manager / CEO'],
        ['Access Level:', 'Full System Access & Analytics']
    ]
    version_table = Table(version_data, colWidths=[2.5*inch, 3*inch])
    version_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff7ed')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#7c2d12')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#ea580c')),
    ]))
    story.append(version_table)
    
    story.append(PageBreak())
    
    # Table of Contents
    story.append(Paragraph("Table of Contents", heading_style))
    manager_toc = [
        "1. Manager Role Overview",
        "2. Staff Management",
        "3. Inventory & Product Management",
        "4. Sales Monitoring & Analytics",
        "5. POS System Oversight",
        "6. Profit & Financial Reports",
        "7. Customer Database Management",
        "8. System Administration",
        "9. Daily/Weekly/Monthly Tasks",
        "10. Audit Controls & Security",
        "11. Best Practices & Tips"
    ]
    for item in manager_toc:
        story.append(Paragraph(f"• {item}", body_style))
    story.append(PageBreak())
    
    # Section 1: Manager Role
    story.append(Paragraph("1. Manager Role Overview", heading_style))
    story.append(Paragraph(
        "As a Manager/CEO, you have <b>full control</b> over your business operations. You can create staff, "
        "manage inventory, monitor sales, and access detailed analytics.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Your Key Responsibilities:", subheading_style))
    manager_resp = [
        "<b>Staff Management:</b> Create shop keepers and repairers, manage their access",
        "<b>Inventory Control:</b> Add products, manage stock, set pricing strategies",
        "<b>Sales Monitoring:</b> Track all POS transactions and staff performance",
        "<b>Financial Oversight:</b> Review revenue analytics and business metrics",
        "<b>Customer Relations:</b> Oversee customer database and satisfaction",
        "<b>System Security:</b> Use audit codes for sensitive operations",
        "<b>Business Growth:</b> Make data-driven decisions using analytics"
    ]
    for resp in manager_resp:
        story.append(Paragraph(f"• {resp}", body_style))
    
    # Section 2: Staff Management
    story.append(PageBreak())
    story.append(Paragraph("2. Staff Management", heading_style))
    
    story.append(Paragraph("Creating New Staff Members:", subheading_style))
    staff_steps = [
        "Go to <b>'Staff Management'</b> page",
        "Click <b>'+ Create Staff'</b> button",
        "Choose role: <b>Shop Keeper</b> or <b>Repairer</b>",
        "Fill in details: Full Name, Username, Phone Number",
        "Set initial password (they'll change it on first login)",
        "Click <b>'Create'</b> - Staff can now login!"
    ]
    for i, step in enumerate(staff_steps, 1):
        story.append(Paragraph(f"{i}. {step}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Managing Existing Staff:", subheading_style))
    staff_mgmt = [
        "<b>View Staff:</b> See all shop keepers and repairers",
        "<b>Edit Details:</b> Update phone numbers, names, etc.",
        "<b>Reset Password:</b> If staff forgets password",
        "<b>Deactivate:</b> Temporarily disable access without deleting",
        "<b>Delete:</b> Permanently remove staff (requires audit code)"
    ]
    for item in staff_mgmt:
        story.append(Paragraph(f"• {item}", body_style))
    
    # Section 3: Inventory Management
    story.append(PageBreak())
    story.append(Paragraph("3. Inventory & Product Management", heading_style))
    
    story.append(Paragraph("Adding Products Manually:", subheading_style))
    product_steps = [
        "Go to <b>'Products'</b> page",
        "Click <b>'+ Add Product'</b>",
        "Fill in required fields:",
        "  - Name (e.g., 'iPhone 13 Case')",
        "  - Category (must exist first - create in Phone Categories if needed)",
        "  - Cost Price (what you paid)",
        "  - Selling Price (what you sell for)",
        "  - Quantity (current stock)",
        "Optional: Brand, Description, Discount Price, Min Stock Level",
        "Click <b>'Save'</b> - Product is now available for sale!"
    ]
    for step in product_steps:
        story.append(Paragraph(step, body_style))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Bulk Upload (Add 100+ Products at Once):", subheading_style))
    story.append(Paragraph(
        "1. Click <b>'Bulk Upload'</b> button<br/>"
        "2. Download the template (contains 100 sample products ready to use!)<br/>"
        "3. Edit the Excel file:<br/>"
        "   - Keep products you sell<br/>"
        "   - Delete products you don't sell<br/>"
        "   - Update prices to match your costs<br/>"
        "   - Categories auto-create from Excel!<br/>"
        "4. Upload the file<br/>"
        "5. System adds all products and creates categories automatically!",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Managing Phone Categories:", subheading_style))
    story.append(Paragraph(
        "Categories help organize products. Go to <b>'Phone Categories'</b> to:<br/>"
        "• Create new categories (Accessories, Chargers, Cases, etc.)<br/>"
        "• Edit existing categories<br/>"
        "• Add icons to categories<br/>"
        "• Delete unused categories",
        body_style
    ))
    
    # Section 4: Sales Monitoring
    story.append(PageBreak())
    story.append(Paragraph("4. Sales Monitoring & Analytics", heading_style))
    
    story.append(Paragraph("POS Monitor - Real-Time Sales Tracking:", subheading_style))
    story.append(Paragraph(
        "The POS Monitor shows ALL sales from all shop keepers in real-time. Access it anytime to see:",
        body_style
    ))
    story.append(Spacer(1, 0.1*inch))
    
    pos_monitor_features = [
        "<b>Total Revenue:</b> All money collected today/this week/this month",
        "<b>Total Profit:</b> Revenue minus costs - your actual earnings",
        "<b>Items Sold:</b> How many products moved",
        "<b>Payment Methods:</b> Breakdown by Cash, Card, Mobile Money",
        "<b>Top Selling Products:</b> Which items sell the most",
        "<b>Individual Transactions:</b> See each sale with staff name, customer, items, amount",
        "<b>Filter Options:</b> View by date range, payment method, etc."
    ]
    for feature in pos_monitor_features:
        story.append(Paragraph(f"• {feature}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Understanding Your Analytics:", subheading_style))
    story.append(Paragraph(
        "<b>Dashboard Analytics</b> shows:<br/>"
        "• Weekly trends and patterns<br/>"
        "• Month-over-month growth<br/>"
        "• Staff performance comparison<br/>"
        "• Best and worst selling products<br/>"
        "• Peak sales hours and days",
        body_style
    ))
    
    # Section 5: System Administration
    story.append(PageBreak())
    story.append(Paragraph("5. System Administration", heading_style))
    
    story.append(Paragraph("Audit Codes - Enhanced Security:", subheading_style))
    story.append(Paragraph(
        "Sensitive operations require your audit code for verification:",
        body_style
    ))
    story.append(Spacer(1, 0.1*inch))
    
    audit_operations = [
        "Deleting staff members",
        "Deleting products with existing sales history",
        "Clearing database records",
        "Accessing sensitive reports",
        "Modifying critical system settings"
    ]
    for op in audit_operations:
        story.append(Paragraph(f"• {op}", body_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph(
        "<b>Getting Your Audit Code:</b><br/>"
        "Go to 'Manager Audit Code' page → Click 'Generate Code' → Code valid for 1 hour → Use when prompted for sensitive operations",
        body_style
    ))
    
    # Section 7: Database Management
    story.append(PageBreak())
    story.append(Paragraph("7. Database & Backup Management", heading_style))
    
    story.append(Paragraph("System Database Page:", subheading_style))
    story.append(Paragraph(
        "Access at <b>'System Database'</b> to manage your data:",
        body_style
    ))
    story.append(Spacer(1, 0.1*inch))
    
    db_features = [
        "<b>Backups Tab:</b> Create and restore database backups (Railway auto-backs up daily)",
        "<b>Tables Tab:</b> View database statistics and record counts",
        "<b>Clear Data Tab:</b> Remove specific data types (customers, sales, etc.)",
        "<b>Export Data:</b> Download all data as JSON for external backup"
    ]
    for feature in db_features:
        story.append(Paragraph(f"• {feature}", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("⚠️ Important Backup Tips:", subheading_style))
    story.append(Paragraph(
        "• <b>Weekly backups:</b> Create backup every Friday<br/>"
        "• <b>Before major changes:</b> Always backup before clearing data<br/>"
        "• <b>Railway backups:</b> Your database auto-backs up daily on Railway<br/>"
        "• <b>Test restores:</b> Occasionally test that backups work properly",
        body_style
    ))
    
    # Section 8: Daily/Weekly Tasks
    story.append(PageBreak())
    story.append(Paragraph("8. Daily, Weekly & Monthly Tasks", heading_style))
    
    story.append(Paragraph("Daily Tasks:", subheading_style))
    daily = [
        "Check dashboard for today's sales progress",
        "Review POS Monitor for all transactions",
        "Check low stock alerts and reorder if needed",
        "Monitor staff performance and sales activity",
        "Respond to customer issues or complaints",
        "Review profit margins on high-volume items"
    ]
    for task in daily:
        story.append(Paragraph(f"✓ {task}", body_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Weekly Tasks:", subheading_style))
    weekly = [
        "Review weekly sales report and trends",
        "Compare staff performance metrics",
        "Analyze top selling products and restock",
        "Review and update product prices if needed",
        "Check customer feedback and satisfaction",
        "Plan next week's inventory purchases",
        "Create database backup (recommended)"
    ]
    for task in weekly:
        story.append(Paragraph(f"✓ {task}", body_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Monthly Tasks:", subheading_style))
    monthly = [
        "Generate monthly profit & loss report",
        "Review total revenue and growth trends",
        "Assess staff productivity and bonuses",
        "Analyze product categories performance",
        "Update pricing strategy based on data",
        "Review customer retention rates",
        "Plan inventory for next month",
        "Export data for accounting/tax purposes"
    ]
    for task in monthly:
        story.append(Paragraph(f"✓ {task}", body_style))
    
    # Section 9: Managing Bulk Uploads
    story.append(PageBreak())
    story.append(Paragraph("9. Bulk Upload - Quick Inventory Setup", heading_style))
    
    story.append(Paragraph("Products Bulk Upload:", subheading_style))
    story.append(Paragraph(
        "Upload 100+ products at once using Excel:<br/><br/>"
        "1. Go to <b>Products</b> page → Click <b>'Bulk Upload'</b><br/>"
        "2. Download template (contains 100 ready products!)<br/>"
        "3. Edit Excel file:<br/>"
        "   - Adjust prices to your market<br/>"
        "   - Delete items you don't sell<br/>"
        "   - Add your own products<br/>"
        "   - <b>Categories auto-create</b> from Excel - no manual setup needed!<br/>"
        "4. Upload file → All products added instantly!<br/><br/>"
        "<b>Pro Tip:</b> You can upload as-is for instant 100-product inventory, then edit later.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Phones Bulk Upload:", subheading_style))
    story.append(Paragraph(
        "Upload 100+ phones at once:<br/><br/>"
        "1. Go to <b>Swapping Hub</b> → Click <b>'Bulk Upload'</b><br/>"
        "2. Download template (100 sample phones included!)<br/>"
        "3. Edit Excel:<br/>"
        "   - Mix of iPhone, Samsung, Xiaomi, and other brands<br/>"
        "   - Update prices and conditions<br/>"
        "   - <b>Brands auto-create</b> from Excel!<br/>"
        "4. Upload → 100 phones ready for swapping/selling!",
        body_style
    ))
    
    # Section 10: Key Features
    story.append(PageBreak())
    story.append(Paragraph("10. Key Manager Features", heading_style))
    
    features_data = [
        ['<b>Feature</b>', '<b>Location</b>', '<b>What It Does</b>'],
        ['Staff Management', 'Staff Management page', 'Create, edit, delete shop keepers and repairers'],
        ['POS Monitor', 'POS Monitor page', 'See all sales from all staff in real-time'],
        ['Products Hub', 'Products page', 'Manage inventory, pricing, stock levels'],
        ['Swapping Hub', 'Swapping Hub page', 'Manage phone swaps and inventory'],
        ['Analytics', 'Reports page', 'Business intelligence and trends'],
        ['Audit Codes', 'Manager Audit Code', 'Security verification for sensitive actions'],
        ['System Database', 'System Database', 'Backups, data management, system stats'],
        ['Settings', 'Settings page', 'Company name, branding, SMS configuration']
    ]
    
    features_table = Table(features_data, colWidths=[1.8*inch, 1.8*inch, 3*inch])
    features_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c2d12')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ea580c')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fff7ed')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(features_table)
    
    # Best Practices
    story.append(PageBreak())
    story.append(Paragraph("11. Manager Best Practices", heading_style))
    
    best_practices = [
        ("<b>Daily Monitoring</b>", "Check POS Monitor at least 3 times daily - morning, midday, evening. Know your numbers!"),
        ("<b>Staff Training</b>", "Ensure all staff read their training manuals. Review with them weekly."),
        ("<b>Inventory Planning</b>", "Never run out of top-selling items. Check low stock alerts daily."),
        ("<b>Pricing Strategy</b>", "Aim for 30-50% profit margins. Adjust based on competition and demand."),
        ("<b>Customer Database</b>", "Encourage staff to register customers. Bigger database = better loyalty."),
        ("<b>Security</b>", "Change audit codes weekly. Never share with staff."),
        ("<b>Data Backup</b>", "Weekly backups minimum. Monthly full exports recommended."),
        ("<b>Performance Review</b>", "Monthly staff reviews based on sales data. Reward top performers.")
    ]
    
    for title, tip in best_practices:
        story.append(Paragraph(title, subheading_style))
        story.append(Paragraph(tip, body_style))
        story.append(Spacer(1, 0.1*inch))
    
    # Final Notes
    story.append(PageBreak())
    story.append(Paragraph("Success Tips", heading_style))
    story.append(Paragraph(
        "SwapSync gives you complete visibility and control over your business. Use the data to make smart decisions:<br/><br/>"
        "✓ <b>Track everything:</b> Every sale, every customer, every product<br/>"
        "✓ <b>Analyze regularly:</b> Weekly reviews show patterns<br/>"
        "✓ <b>Trust your data:</b> Numbers don't lie - use them to grow<br/>"
        "✓ <b>Train your team:</b> Well-trained staff = more sales<br/>"
        "✓ <b>Stay organized:</b> Clean data = better insights<br/><br/>"
        "<b>Your success is our success. Use SwapSync to its fullest potential!</b>",
        ParagraphStyle(
            'FinalNote',
            parent=body_style,
            fontSize=11,
            textColor=colors.HexColor('#7c2d12'),
            borderWidth=2,
            borderColor=colors.HexColor('#ea580c'),
            borderPadding=15,
            backColor=colors.HexColor('#fff7ed')
        )
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_repairer_manual() -> BytesIO:
    """Generate comprehensive training manual for Repairers"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                           topMargin=0.75*inch, bottomMargin=0.75*inch,
                           leftMargin=0.75*inch, rightMargin=0.75*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#7c3aed'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#7c3aed'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=colors.HexColor('#a78bfa'),
        spaceAfter=8,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=6,
        alignment=TA_JUSTIFY
    )
    
    # Cover Page
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("SwapSync Training Manual", title_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("REPAIRER GUIDE", ParagraphStyle(
        'RoleTitle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#7c3aed'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Phone Repair Management & Customer Service", ParagraphStyle(
        'Subtitle2',
        parent=styles['Normal'],
        fontSize=13,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER
    )))
    story.append(Spacer(1, 1*inch))
    
    # Version info
    version_data = [
        ['Document Version:', '1.0'],
        ['Last Updated:', datetime.now().strftime('%B %d, %Y')],
        ['Role:', 'Repairer / Technician'],
        ['Access Level:', 'Repairs, Customers, Inventory Items']
    ]
    version_table = Table(version_data, colWidths=[2.5*inch, 3*inch])
    version_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f3ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#5b21b6')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#7c3aed')),
    ]))
    story.append(version_table)
    
    story.append(PageBreak())
    
    # Table of Contents
    story.append(Paragraph("Table of Contents", heading_style))
    repairer_toc = [
        "1. Welcome - Your Role as Repairer",
        "2. Getting Started",
        "3. Creating New Repair Jobs",
        "4. Managing Repairs",
        "5. Repair Status Updates",
        "6. Using Repair Items & Inventory",
        "7. Customer Communication",
        "8. Best Practices",
        "9. Common Issues & FAQ",
        "10. Quality Standards"
    ]
    for item in repairer_toc:
        story.append(Paragraph(f"• {item}", body_style))
    story.append(PageBreak())
    
    # Section 1: Welcome
    story.append(Paragraph("1. Welcome - Your Role as Repairer", heading_style))
    story.append(Paragraph(
        "As a Repairer/Technician, you are responsible for diagnosing, repairing, and maintaining phones. "
        "Your expertise directly impacts customer satisfaction and business reputation.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Your Responsibilities:", subheading_style))
    repairer_resp = [
        "Create and manage repair jobs for customers",
        "Update repair status as work progresses",
        "Track parts and items used in repairs",
        "Communicate with customers via SMS",
        "Maintain quality standards",
        "Complete repairs within estimated timeframes",
        "Keep accurate records of all work done"
    ]
    for resp in repairer_resp:
        story.append(Paragraph(f"✓ {resp}", body_style))
    
    # Section 2: Creating Repairs
    story.append(PageBreak())
    story.append(Paragraph("2. Creating New Repair Jobs", heading_style))
    
    story.append(Paragraph("Step-by-Step Process:", subheading_style))
    repair_creation = [
        ("<b>1. Access Repairs Page</b>", "Click 'Repairs' in the menu"),
        ("<b>2. Click '+ Create Repair'</b>", "Opens the repair creation form"),
        ("<b>3. Select Customer</b>", "Choose existing customer or create new one"),
        ("<b>4. Enter Phone Details</b>", "Brand, Model, IMEI (if available), Phone number"),
        ("<b>5. Describe the Issue</b>", "Be specific: 'Cracked screen', 'Battery draining fast', 'Won't charge', etc."),
        ("<b>6. Set Repair Cost</b>", "Total amount customer will pay for the repair"),
        ("<b>7. Set Estimated Completion</b>", "When you expect to finish (date and time)"),
        ("<b>8. Save Repair Job</b>", "System generates unique repair ID and sends SMS to customer")
    ]
    for title, desc in repair_creation:
        story.append(Paragraph(title, subheading_style))
        story.append(Paragraph(desc, body_style))
        story.append(Spacer(1, 0.08*inch))
    
    # Section 3: Repair Statuses
    story.append(PageBreak())
    story.append(Paragraph("3. Repair Status Management", heading_style))
    story.append(Paragraph(
        "Keep customers informed by updating status as you work:",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    status_data = [
        ['<b>Status</b>', '<b>When to Use</b>', '<b>SMS Sent?</b>'],
        ['PENDING', 'New repair just created, waiting to start', 'Yes - Initial notification'],
        ['IN_PROGRESS', 'You are actively working on it', 'Yes - Started work notification'],
        ['COMPLETED', 'Repair finished, ready for pickup', 'Yes - Ready for pickup'],
        ['DELIVERED', 'Customer collected the phone', 'Yes - Thank you message'],
        ['CANCELLED', 'Customer cancelled or unfixable', 'Yes - Cancellation notice']
    ]
    
    status_table = Table(status_data, colWidths=[1.5*inch, 3*inch, 2*inch])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#a78bfa')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f3ff')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(status_table)
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("How to Update Status:", subheading_style))
    story.append(Paragraph(
        "1. Go to <b>Repairs</b> page<br/>"
        "2. Find the repair in the list<br/>"
        "3. Click <b>'Update Status'</b> button<br/>"
        "4. Select new status from dropdown<br/>"
        "5. Click <b>'Update'</b><br/>"
        "6. Customer automatically receives SMS update!",
        body_style
    ))
    
    # Section 4: Tracking Repair Items
    story.append(PageBreak())
    story.append(Paragraph("4. Using Repair Items & Parts Tracking", heading_style))
    story.append(Paragraph(
        "Track parts and materials used in each repair for accurate costing:",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Adding Items Used:", subheading_style))
    story.append(Paragraph(
        "When you use parts (screen, battery, etc.):<br/><br/>"
        "1. Open the repair details<br/>"
        "2. Click <b>'Add Item Used'</b><br/>"
        "3. Select the product from inventory<br/>"
        "4. Enter quantity used<br/>"
        "5. System automatically deducts from stock<br/>"
        "6. Item appears in repair invoice",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Why Track Items?", subheading_style))
    tracking_reasons = [
        "Manager sees exactly what parts were used",
        "Profit calculation accounts for parts cost",
        "Inventory stays accurate",
        "Customer sees itemized invoice",
        "You can't forget to bill for parts used"
    ]
    for reason in tracking_reasons:
        story.append(Paragraph(f"• {reason}", body_style))
    
    # Section 5: Best Practices
    story.append(PageBreak())
    story.append(Paragraph("5. Repairer Best Practices", heading_style))
    
    quality_tips = [
        ("<b>Communication is Key</b>", "Always update status promptly. Customers appreciate knowing their phone status."),
        ("<b>Be Accurate with Estimates</b>", "Set realistic completion dates. Better to under-promise and over-deliver."),
        ("<b>Document Everything</b>", "Note all issues found and work done. Helps if customer returns with issues."),
        ("<b>Track All Parts</b>", "Log every part used, even small items. Accuracy matters for profit."),
        ("<b>Quality Over Speed</b>", "Do it right the first time. Rushed repairs lead to returns and unhappy customers."),
        ("<b>Keep Workspace Clean</b>", "Organized workspace = fewer lost parts and better efficiency."),
        ("<b>Test Thoroughly</b>", "Before marking COMPLETED, test all functions. Ensure repair actually worked."),
        ("<b>Customer Satisfaction</b>", "When customer picks up, show them the fix works. Build confidence in your work.")
    ]
    
    for title, tip in quality_tips:
        story.append(Paragraph(title, subheading_style))
        story.append(Paragraph(tip, body_style))
        story.append(Spacer(1, 0.1*inch))
    
    # Common Issues
    story.append(PageBreak())
    story.append(Paragraph("6. Common Questions & Answers", heading_style))
    
    repairer_qa = [
        ("<b>Q: Customer wants estimate before committing?</b>",
         "<b>A:</b> Create repair with estimated cost. If actual cost differs, update before marking COMPLETED and inform customer."),
        
        ("<b>Q: Need a part not in inventory?</b>",
         "<b>A:</b> Inform manager to order it. Update repair status notes with 'Waiting for part: [name]' so customer knows."),
        
        ("<b>Q: Repair taking longer than estimated?</b>",
         "<b>A:</b> Update the customer via SMS or call. Update completion date in system. Communication prevents complaints."),
        
        ("<b>Q: Phone is unfixable?</b>",
         "<b>A:</b> Update status to CANCELLED. Add note explaining why. Customer receives notification."),
        
        ("<b>Q: Customer doesn't pick up phone?</b>",
         "<b>A:</b> Call them after 2 days. System tracks how long phone has been ready. Manager can see overdue pickups."),
        
        ("<b>Q: Made mistake in repair details?</b>",
         "<b>A:</b> Click 'Edit' on the repair to update information. Can update everything except customer name."),
    ]
    
    for question, answer in repairer_qa:
        story.append(Paragraph(question, subheading_style))
        story.append(Paragraph(answer, body_style))
        story.append(Spacer(1, 0.1*inch))
    
    # Daily Workflow
    story.append(PageBreak())
    story.append(Paragraph("7. Your Daily Workflow", heading_style))
    
    story.append(Paragraph("Start of Day:", subheading_style))
    morning = [
        "Login to system",
        "Check repairs dashboard - see pending count",
        "Review IN_PROGRESS repairs - prioritize by deadline",
        "Check if any parts/items needed",
        "Plan your day's work order"
    ]
    for task in morning:
        story.append(Paragraph(f"→ {task}", body_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("During Work:", subheading_style))
    during = [
        "Update status to IN_PROGRESS when starting",
        "Log parts used as you use them",
        "Take notes on any additional issues found",
        "Test thoroughly before marking COMPLETED",
        "Update status to COMPLETED when ready",
        "Notify customer (SMS auto-sent)"
    ]
    for task in during:
        story.append(Paragraph(f"→ {task}", body_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("End of Day:", subheading_style))
    evening = [
        "Review all COMPLETED repairs waiting pickup",
        "Check if any repairs overdue",
        "Report inventory/parts needs to manager",
        "Clean workspace for next day"
    ]
    for task in evening:
        story.append(Paragraph(f"→ {task}", body_style))
    
    # Final message
    story.append(PageBreak())
    story.append(Paragraph("Your Impact", heading_style))
    story.append(Paragraph(
        "As a repairer, you are crucial to customer satisfaction and business reputation. "
        "Quality repairs mean happy customers, good reviews, and repeat business.<br/><br/>"
        "<b>Key Principles:</b><br/>"
        "✓ Quality workmanship always<br/>"
        "✓ Clear communication with customers<br/>"
        "✓ Accurate documentation<br/>"
        "✓ Timely completion<br/>"
        "✓ Professional customer service<br/><br/>"
        "<b>Your skills drive success. Take pride in every repair!</b>",
        ParagraphStyle(
            'FinalNote',
            parent=body_style,
            fontSize=11,
            textColor=colors.HexColor('#5b21b6'),
            borderWidth=2,
            borderColor=colors.HexColor('#7c3aed'),
            borderPadding=15,
            backColor=colors.HexColor('#f5f3ff')
        )
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer

