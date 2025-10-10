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
    current_user: User = Depends(require_role(['manager', 'ceo']))
):
    """Download Excel template for bulk product upload"""
    # Create sample data
    data = {
        'name': ['iPhone 13 Case', 'Power Bank 20000mAh'],
        'category': ['Phone Accessories', 'Power Banks'],
        'brand': ['Apple', ''],
        'description': ['Silicone protective case', 'Fast charging portable battery'],
        'cost_price': [30.00, 120.00],
        'selling_price': [45.00, 180.00],
        'quantity': [50, 35],
        'min_stock_level': [10, 10]
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
                'Category name (must match existing category)',
                'Brand name (optional)',
                'Product description (optional)',
                'Cost price in GH₵',
                'Selling price in GH₵',
                'Available quantity',
                'Minimum stock level for alerts (optional, defaults to 10)'
            ]
        }
        instructions_df = pd.DataFrame(instructions_data)
        instructions_df.to_excel(writer, index=False, sheet_name='Instructions')
    
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
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed")
    
    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = ['name', 'category', 'cost_price', 'selling_price', 'quantity']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Get categories mapping
        from app.models.category import Category
        categories = db.query(Category).all()
        category_map = {cat.name: cat.id for cat in categories}
        
        # Process each row
        added_products = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Get category_id
                category_name = str(row['category'])
                category_id = category_map.get(category_name)
                if not category_id:
                    errors.append({
                        'row': index + 2,
                        'error': f"Category '{category_name}' not found. Available categories: {', '.join(category_map.keys())}"
                    })
                    continue
                
                # Create product
                product = Product(
                    name=str(row['name']),
                    category_id=category_id,
                    brand=str(row['brand']) if pd.notna(row.get('brand')) else None,
                    description=str(row['description']) if pd.notna(row.get('description')) else None,
                    cost_price=float(row['cost_price']),
                    selling_price=float(row['selling_price']),
                    quantity=int(row['quantity']),
                    min_stock_level=int(row.get('min_stock_level', 10)),
                    is_active=True,
                    is_available=True
                )
                
                db.add(product)
                db.flush()  # Get the ID
                
                # Generate unique_id
                product.unique_id = f"PROD-{str(product.id).zfill(4)}"
                
                added_products.append({
                    'id': product.id,
                    'name': product.name,
                    'category': category_name
                })
                
            except Exception as e:
                errors.append({
                    'row': index + 2,
                    'error': str(e)
                })
        
        db.commit()
        
        return {
            'success': True,
            'added': len(added_products),
            'errors': len(errors),
            'products': added_products,
            'error_details': errors
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

