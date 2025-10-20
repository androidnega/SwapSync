"""
Bulk Upload Routes
Handles Excel file uploads for phones and products
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.phone import Phone, PhoneStatus
from app.models.product import Product
from app.core.permissions import require_role

router = APIRouter(prefix="/bulk-upload", tags=["Bulk Upload"])


@router.get("/phones/template")
async def download_phones_template(
    current_user: User = Depends(require_role(['manager', 'ceo']))
):
    """Download Excel template for bulk phone upload"""
    # Create sample data
    data = {
        'brand': ['Apple', 'Samsung'],
        'model': ['iPhone 13', 'Galaxy S23'],
        'imei': ['123456789012345', '987654321098765'],
        'condition': ['Good', 'Excellent'],
        'value': [3500.00, 4200.00],
        'cost_price': [2450.00, 2940.00],
        'cpu': ['A15 Bionic', 'Snapdragon 8 Gen 2'],
        'ram': ['6GB', '8GB'],
        'storage': ['128GB', '256GB'],
        'battery': ['3240mAh', '3900mAh'],
        'battery_health': ['95%', '98%'],
        'color': ['Midnight Blue', 'Phantom Black'],
        'status': ['AVAILABLE', 'AVAILABLE']
    }
    
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Phones')
        
        # Add instructions sheet
        instructions_data = {
            'Column': ['brand', 'model', 'imei', 'condition', 'value', 'cost_price', 'cpu', 'ram', 'storage', 'battery', 'battery_health', 'color', 'status'],
            'Required': ['Yes', 'Yes', 'No', 'Yes', 'Yes', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'Yes'],
            'Description': [
                'Phone brand (e.g., Apple, Samsung)',
                'Phone model (e.g., iPhone 13)',
                '15-digit IMEI number (optional)',
                'Condition: Good, Excellent, Fair, or New',
                'Selling price in GH₵',
                'Cost price (optional, defaults to 70% of value)',
                'Processor name (optional)',
                'RAM size (optional, e.g., 8GB)',
                'Storage size (optional, e.g., 128GB)',
                'Battery capacity (optional, e.g., 5000mAh)',
                'Battery health percentage (optional, e.g., 95%)',
                'Phone color (optional)',
                'Status: AVAILABLE, SWAPPED, SOLD, or UNDER_REPAIR'
            ]
        }
        instructions_df = pd.DataFrame(instructions_data)
        instructions_df.to_excel(writer, index=False, sheet_name='Instructions')
    
    output.seek(0)
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(output.getvalue()),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=phones_template.xlsx'}
    )


@router.post("/phones")
async def bulk_upload_phones(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(['manager', 'ceo'])),
    db: Session = Depends(get_db)
):
    """Upload phones in bulk from Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed")
    
    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = ['brand', 'model', 'condition', 'value', 'status']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Process each row
        added_phones = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Get brand_id if exists
                from app.models.brand import Brand
                brand = db.query(Brand).filter(Brand.name == row['brand']).first()
                brand_id = brand.id if brand else None
                
                # Build specs JSON
                specs = {}
                if pd.notna(row.get('cpu')): specs['cpu'] = str(row['cpu'])
                if pd.notna(row.get('ram')): specs['ram'] = str(row['ram'])
                if pd.notna(row.get('storage')): specs['storage'] = str(row['storage'])
                if pd.notna(row.get('battery')): specs['battery'] = str(row['battery'])
                if pd.notna(row.get('battery_health')): specs['battery_health'] = str(row['battery_health'])
                if pd.notna(row.get('color')): specs['color'] = str(row['color'])
                
                # Determine cost_price
                cost_price = row.get('cost_price')
                if pd.isna(cost_price) or cost_price == '':
                    cost_price = float(row['value']) * 0.7
                else:
                    cost_price = float(cost_price)
                
                # Create phone
                phone = Phone(
                    brand=str(row['brand']),
                    brand_id=brand_id,
                    model=str(row['model']),
                    imei=str(row['imei']) if pd.notna(row.get('imei')) else None,
                    condition=str(row['condition']),
                    value=float(row['value']),
                    cost_price=cost_price,
                    specs=specs if specs else None,
                    status=PhoneStatus(row['status']),
                    is_available=(row['status'] == 'AVAILABLE')
                )
                
                db.add(phone)
                db.flush()  # Get the ID
                
                # Generate unique_id
                phone.unique_id = f"PHON-{str(phone.id).zfill(4)}"
                
                added_phones.append({
                    'id': phone.id,
                    'brand': phone.brand,
                    'model': phone.model
                })
                
            except Exception as e:
                errors.append({
                    'row': index + 2,  # +2 because Excel rows start at 1 and we have header
                    'error': str(e)
                })
        
        db.commit()
        
        return {
            'success': True,
            'added': len(added_phones),
            'errors': len(errors),
            'phones': added_phones,
            'error_details': errors
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@router.get("/products/template")
async def download_products_template(
    current_user: User = Depends(require_role(['manager', 'ceo'])),
    db: Session = Depends(get_db)
):
    """Download Excel template with 100 sample products ready to use"""
    # Get actual categories from database
    from app.models.category import Category
    categories = db.query(Category).limit(10).all()
    
    # Define product categories and sample products
    product_samples = [
        # Phone Accessories (30 items)
        *[('iPhone 13 Case', 'Phone Accessories', 'Apple', 'Silicone protective case', 25.00, 40.00, 100, 10),
          ('iPhone 14 Case', 'Phone Accessories', 'Apple', 'Leather protective case', 30.00, 50.00, 80, 10),
          ('Samsung S23 Case', 'Phone Accessories', 'Samsung', 'Clear protective case', 20.00, 35.00, 90, 10),
          ('Phone Ring Holder', 'Phone Accessories', '', 'Universal ring stand', 3.00, 8.00, 200, 20),
          ('Pop Socket', 'Phone Accessories', '', 'Phone grip holder', 4.00, 10.00, 150, 20),
          ('Phone Lanyard', 'Phone Accessories', '', 'Adjustable neck strap', 5.00, 12.00, 100, 15),
          ('Car Phone Mount', 'Phone Accessories', '', 'Dashboard mount', 15.00, 30.00, 60, 10),
          ('Waterproof Phone Pouch', 'Phone Accessories', '', 'IPX8 waterproof bag', 8.00, 18.00, 80, 15),
          ('Phone Armband', 'Phone Accessories', '', 'Sport running armband', 6.00, 15.00, 70, 10),
          ('Selfie Stick', 'Phone Accessories', '', 'Bluetooth selfie stick', 12.00, 25.00, 50, 10)],
        
        *[('Tempered Glass Screen', 'Screen Protectors', '', f'For iPhone {i}', 5.00, 12.00, 200, 30) for i in range(11, 16)],
        *[('Tempered Glass Screen', 'Screen Protectors', '', f'For Samsung S{i}', 5.00, 12.00, 180, 30) for i in range(20, 25)],
        
        # Chargers & Cables (25 items)
        *[('USB-C Cable 1m', 'Cables', 'Anker', 'Fast charging cable', 8.00, 15.00, 200, 20),
          ('USB-C Cable 2m', 'Cables', 'Anker', 'Fast charging cable', 10.00, 18.00, 150, 20),
          ('Lightning Cable 1m', 'Cables', 'Apple', 'Original MFi certified', 15.00, 30.00, 100, 15),
          ('Lightning Cable 2m', 'Cables', 'Apple', 'Original MFi certified', 18.00, 35.00, 80, 15),
          ('Micro USB Cable', 'Cables', '', 'Universal charging cable', 5.00, 10.00, 250, 30),
          ('3-in-1 Charging Cable', 'Cables', '', 'USB-C, Lightning, Micro', 12.00, 22.00, 120, 20),
          ('Magnetic Charging Cable', 'Cables', '', 'Fast charge magnetic', 15.00, 28.00, 90, 15),
          ('Coiled Charging Cable', 'Cables', '', 'Retractable cable', 10.00, 20.00, 100, 15)],
        
        *[('Fast Charger 20W', 'Chargers', 'Anker', 'USB-C PD charger', 20.00, 40.00, 100, 15),
          ('Fast Charger 30W', 'Chargers', 'Anker', 'Dual USB-C charger', 30.00, 55.00, 80, 10),
          ('Fast Charger 65W', 'Chargers', 'Anker', 'GaN III charger', 45.00, 80.00, 50, 10),
          ('Wireless Charger', 'Chargers', 'Samsung', '15W fast wireless', 25.00, 45.00, 70, 10),
          ('Car Charger', 'Chargers', '', 'Dual USB car charger', 12.00, 25.00, 90, 15),
          ('Multi-Port Charger', 'Chargers', '', '6-port USB hub', 35.00, 65.00, 40, 10)],
        
        *[('Power Bank 10000mAh', 'Power Banks', 'Anker', 'Compact portable charger', 35.00, 60.00, 80, 10),
          ('Power Bank 20000mAh', 'Power Banks', 'Anker', 'High capacity charger', 55.00, 95.00, 60, 10),
          ('Power Bank 30000mAh', 'Power Banks', 'Anker', 'Ultra high capacity', 75.00, 130.00, 40, 8),
          ('Solar Power Bank', 'Power Banks', '', 'Solar charging 20000mAh', 45.00, 85.00, 50, 10),
          ('Wireless Power Bank', 'Power Banks', '', '10000mAh wireless', 40.00, 70.00, 55, 10)],
        
        # Audio Accessories (15 items)
        *[('AirPods Pro', 'Earbuds', 'Apple', 'Active noise cancelling', 180.00, 280.00, 40, 5),
          ('AirPods 3rd Gen', 'Earbuds', 'Apple', 'Spatial audio', 140.00, 220.00, 50, 5),
          ('Galaxy Buds Pro', 'Earbuds', 'Samsung', 'ANC earbuds', 130.00, 200.00, 45, 5),
          ('Xiaomi Earbuds', 'Earbuds', 'Xiaomi', 'Budget wireless earbuds', 25.00, 45.00, 100, 10),
          ('JBL Earbuds', 'Earbuds', 'JBL', 'Sport earbuds', 50.00, 85.00, 70, 10),
          ('Wired Earphones', 'Earbuds', '', 'Universal 3.5mm', 5.00, 12.00, 200, 30),
          ('USB-C Earphones', 'Earbuds', '', 'Digital earphones', 8.00, 18.00, 150, 20)],
        
        *[('Bluetooth Speaker', 'Speakers', 'JBL', 'Portable waterproof', 60.00, 110.00, 50, 8),
          ('Mini Speaker', 'Speakers', '', 'Pocket speaker', 15.00, 30.00, 100, 15),
          ('Soundbar', 'Speakers', 'Samsung', 'TV soundbar 2.1', 120.00, 200.00, 30, 5)],
        
        # Storage & Memory (10 items)
        *[('USB Flash Drive 32GB', 'Storage', 'SanDisk', 'USB 3.0 flash drive', 8.00, 15.00, 150, 20),
          ('USB Flash Drive 64GB', 'Storage', 'SanDisk', 'USB 3.0 flash drive', 12.00, 22.00, 120, 20),
          ('USB Flash Drive 128GB', 'Storage', 'SanDisk', 'USB 3.0 flash drive', 18.00, 32.00, 100, 15),
          ('MicroSD Card 64GB', 'Storage', 'Samsung', 'Class 10 memory card', 10.00, 20.00, 200, 25),
          ('MicroSD Card 128GB', 'Storage', 'Samsung', 'Class 10 memory card', 18.00, 32.00, 150, 20),
          ('MicroSD Card 256GB', 'Storage', 'Samsung', 'Class 10 memory card', 30.00, 55.00, 100, 15),
          ('Card Reader', 'Storage', '', 'USB-C card reader', 8.00, 18.00, 80, 15),
          ('External SSD 500GB', 'Storage', 'Samsung', 'Portable SSD', 70.00, 120.00, 40, 8),
          ('External HDD 1TB', 'Storage', 'Seagate', 'Portable hard drive', 50.00, 85.00, 50, 10)],
        
        # Phone Holders & Stands (5 items)
        *[('Phone Stand Desktop', 'Phone Stands', '', 'Adjustable desk stand', 10.00, 20.00, 100, 15),
          ('Folding Phone Stand', 'Phone Stands', '', 'Portable foldable', 8.00, 16.00, 120, 20),
          ('Charging Dock', 'Phone Stands', '', 'Charging stand', 15.00, 28.00, 80, 12),
          ('Tablet Stand', 'Phone Stands', '', 'Universal tablet holder', 18.00, 35.00, 70, 10)],
    ]
    
    # Unpack into columns
    names, cats, brands, descs, costs, prices, qtys, mins = [], [], [], [], [], [], [], []
    for item in product_samples[:100]:  # Limit to 100 items
        names.append(item[0])
        cats.append(item[1])
        brands.append(item[2])
        descs.append(item[3])
        costs.append(item[4])
        prices.append(item[5])
        qtys.append(item[6])
        mins.append(item[7])
    
    data = {
        'name': names,
        'category': cats,
        'brand': brands,
        'description': descs,
        'cost_price': costs,
        'selling_price': prices,
        'quantity': qtys,
        'min_stock_level': mins
    }
    
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Products')
        
        # Add instructions sheet
        instructions_data = {
            'Column': ['name', 'category', 'brand', 'description', 'cost_price', 'selling_price', 'quantity', 'min_stock_level'],
            'Required': ['Yes', 'Yes', 'No', 'No', 'Yes', 'Yes', 'Yes', 'No'],
            'Description': [
                'Product name',
                'Category name (auto-creates if not exists)',
                'Brand name (optional)',
                'Product description (optional)',
                'Cost price in GH₵',
                'Selling price in GH₵',
                'Available quantity',
                'Minimum stock level for alerts (optional, defaults to 10)'
            ],
            'Example': [
                'iPhone 13 Case',
                'Phone Accessories',
                'Apple',
                'Silicone protective case',
                '25.00',
                '40.00',
                '100',
                '10'
            ]
        }
        instructions_df = pd.DataFrame(instructions_data)
        instructions_df.to_excel(writer, index=False, sheet_name='Instructions')
        
        # Add info sheet
        info_data = {
            'Information': [
                '✅ This template contains 100 ready-to-use sample products',
                '✅ You can edit any product details as needed',
                '✅ Categories are AUTO-CREATED if they don\'t exist',
                '✅ Delete rows you don\'t need',
                '✅ Add more rows if you need more products',
                '✅ Prices are in Ghana Cedis (GH₵)',
                '',
                'Categories included:',
                '- Phone Accessories (cases, holders, mounts)',
                '- Screen Protectors',
                '- Cables (USB-C, Lightning, Micro USB)',
                '- Chargers (fast chargers, wireless)',
                '- Power Banks (10000-30000mAh)',
                '- Earbuds (Apple, Samsung, JBL, etc)',
                '- Speakers',
                '- Storage (USB drives, SD cards, SSDs)',
                '- Phone Stands',
                '',
                'Tips:',
                '- Change prices to match your costs',
                '- Adjust quantities to your stock',
                '- Edit product names and descriptions',
                '- Use your own brand names',
                '- All categories will be created automatically!'
            ]
        }
        info_df = pd.DataFrame(info_data)
        info_df.to_excel(writer, index=False, sheet_name='How To Use')
    
    output.seek(0)
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(output.getvalue()),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=products_template.xlsx'}
    )


@router.post("/products")
async def bulk_upload_products(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(['manager', 'ceo'])),
    db: Session = Depends(get_db)
):
    """Upload products in bulk from Excel file"""
    print(f"📤 Starting bulk upload: {file.filename} by {current_user.username}")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed")
    
    try:
        # Read Excel file
        print(f"📖 Reading Excel file: {file.filename}")
        contents = await file.read()
        print(f"📊 File size: {len(contents)} bytes")
        
        df = pd.read_excel(io.BytesIO(contents))
        print(f"✅ Excel parsed successfully. Rows: {len(df)}, Columns: {list(df.columns)}")
        
        # Validate required columns
        required_columns = ['name', 'category', 'cost_price', 'selling_price', 'quantity']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}. Please download the latest template."
            )
        
        # Get categories mapping
        from app.models.category import Category
        categories = db.query(Category).all()
        category_map = {cat.name: cat.id for cat in categories}
        
        # Track auto-created categories
        new_categories_created = []
        
        # Get the next available unique_id number
        from sqlalchemy import func
        max_unique_id_row = db.query(Product.unique_id).filter(
            Product.unique_id.like('PROD-%')
        ).order_by(Product.unique_id.desc()).first()
        
        if max_unique_id_row and max_unique_id_row[0]:
            # Extract number from PROD-0001 format
            try:
                last_number = int(max_unique_id_row[0].split('-')[1])
                next_unique_number = last_number + 1
            except (ValueError, IndexError):
                next_unique_number = 1
        else:
            next_unique_number = 1
        
        print(f"📊 Starting unique_id sequence from: PROD-{str(next_unique_number).zfill(4)}")
        
        # Process each row
        added_products = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Skip empty rows
                if pd.isna(row['name']) or str(row['name']).strip() == '':
                    continue
                
                # Get or create category
                category_name = str(row['category']).strip()
                category_id = category_map.get(category_name)
                
                if not category_id:
                    # Auto-create category if it doesn't exist
                    print(f"🆕 Auto-creating category: {category_name}")
                    new_category = Category(
                        name=category_name,
                        description=f"Auto-created from bulk upload",
                        created_by_user_id=current_user.id
                    )
                    db.add(new_category)
                    db.flush()  # Get the ID
                    
                    # Add to map for future rows
                    category_map[category_name] = new_category.id
                    category_id = new_category.id
                    new_categories_created.append(category_name)
                    print(f"✅ Category created: {category_name} (ID: {category_id})")
                
                # Validate numeric fields
                try:
                    cost_price = float(row['cost_price'])
                    selling_price = float(row['selling_price'])
                    quantity = int(row['quantity'])
                except (ValueError, TypeError) as e:
                    errors.append({
                        'row': index + 2,
                        'product': str(row['name']),
                        'error': f"Invalid number format: {str(e)}"
                    })
                    continue
                
                # Create product
                product = Product(
                    name=str(row['name']).strip(),
                    category_id=category_id,
                    brand=str(row['brand']).strip() if pd.notna(row.get('brand')) and str(row.get('brand')).strip() else None,
                    description=str(row['description']).strip() if pd.notna(row.get('description')) and str(row.get('description')).strip() else None,
                    cost_price=cost_price,
                    selling_price=selling_price,
                    quantity=quantity,
                    min_stock_level=int(row.get('min_stock_level', 10)),
                    is_active=True,
                    is_available=True,
                    created_by_user_id=current_user.id
                )
                
                db.add(product)
                db.flush()  # Get the ID
                
                # Generate unique_id using incremental counter
                product.unique_id = f"PROD-{str(next_unique_number).zfill(4)}"
                next_unique_number += 1
                
                added_products.append({
                    'id': product.id,
                    'name': product.name,
                    'category': category_name,
                    'unique_id': product.unique_id
                })
                
            except Exception as e:
                errors.append({
                    'row': index + 2,
                    'product': str(row.get('name', 'Unknown')),
                    'error': str(e)
                })
        
        db.commit()
        
        # Return detailed response
        if len(added_products) == 0 and len(errors) > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No products added. Errors: {errors[0]['error']}"
            )
        
        # Build success message
        message_parts = [f"Successfully added {len(added_products)} products."]
        if new_categories_created:
            message_parts.append(f"Created {len(new_categories_created)} new categories: {', '.join(new_categories_created)}")
        if len(errors) > 0:
            message_parts.append(f"{len(errors)} rows had errors.")
        
        return {
            'success': True,
            'added': len(added_products),
            'errors': len(errors),
            'products': added_products,
            'new_categories': new_categories_created,
            'error_details': errors,
            'message': ' '.join(message_parts)
        }
        
    except HTTPException:
        raise
    except pd.errors.EmptyDataError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Excel file is empty or corrupted")
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"❌ Bulk upload error: {error_detail}")
        
        # Get more detailed error info
        error_msg = str(e) if str(e) else "Unknown error occurred"
        error_type = type(e).__name__
        
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process file ({error_type}): {error_msg}. Check server logs for details."
        )

