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
    current_user: User = Depends(require_role(['manager', 'ceo'])),
    db: Session = Depends(get_db)
):
    """Download Excel template with 100 sample phones - uses actual brands from database"""
    # Get actual brands from database
    from app.models.brand import Brand
    brands = db.query(Brand).all()
    brand_names = [b.name for b in brands] if brands else []
    
    # Use actual brands if available, otherwise use defaults
    apple_brand = 'Apple' if 'Apple' in brand_names or not brand_names else (brand_names[0] if brand_names else 'Apple')
    samsung_brand = 'Samsung' if 'Samsung' in brand_names or not brand_names else (brand_names[1] if len(brand_names) > 1 else 'Samsung')
    
    # Generate 100 diverse phone samples (using dynamic brands when possible)
    phone_samples = [
        # iPhone Models (25 phones)
        *[('Apple', 'iPhone 15 Pro Max', '', 'Excellent', 5500.00, 3850.00, 'A17 Pro', '8GB', '256GB', '4422mAh', '100%', 'Natural Titanium', 'AVAILABLE'),
          ('Apple', 'iPhone 15 Pro Max', '', 'Excellent', 6200.00, 4340.00, 'A17 Pro', '8GB', '512GB', '4422mAh', '100%', 'Blue Titanium', 'AVAILABLE'),
          ('Apple', 'iPhone 15 Pro', '', 'Excellent', 4800.00, 3360.00, 'A17 Pro', '8GB', '256GB', '3274mAh', '100%', 'White Titanium', 'AVAILABLE'),
          ('Apple', 'iPhone 15 Plus', '', 'Good', 4200.00, 2940.00, 'A16 Bionic', '6GB', '256GB', '4383mAh', '98%', 'Blue', 'AVAILABLE'),
          ('Apple', 'iPhone 15', '', 'Good', 3800.00, 2660.00, 'A16 Bionic', '6GB', '128GB', '3349mAh', '97%', 'Pink', 'AVAILABLE'),
          ('Apple', 'iPhone 14 Pro Max', '', 'Excellent', 4500.00, 3150.00, 'A16 Bionic', '6GB', '256GB', '4323mAh', '95%', 'Deep Purple', 'AVAILABLE'),
          ('Apple', 'iPhone 14 Pro', '', 'Good', 3800.00, 2660.00, 'A16 Bionic', '6GB', '128GB', '3200mAh', '93%', 'Space Black', 'AVAILABLE'),
          ('Apple', 'iPhone 14 Plus', '', 'Good', 3200.00, 2240.00, 'A15 Bionic', '6GB', '256GB', '4325mAh', '95%', 'Blue', 'AVAILABLE'),
          ('Apple', 'iPhone 14', '', 'Good', 2800.00, 1960.00, 'A15 Bionic', '6GB', '128GB', '3279mAh', '92%', 'Midnight', 'AVAILABLE'),
          ('Apple', 'iPhone 13 Pro Max', '', 'Good', 3500.00, 2450.00, 'A15 Bionic', '6GB', '256GB', '4352mAh', '90%', 'Sierra Blue', 'AVAILABLE'),
          ('Apple', 'iPhone 13 Pro', '', 'Good', 3000.00, 2100.00, 'A15 Bionic', '6GB', '128GB', '3095mAh', '88%', 'Graphite', 'AVAILABLE'),
          ('Apple', 'iPhone 13', '', 'Good', 2400.00, 1680.00, 'A15 Bionic', '4GB', '128GB', '3240mAh', '87%', 'Starlight', 'AVAILABLE'),
          ('Apple', 'iPhone 13 Mini', '', 'Good', 2200.00, 1540.00, 'A15 Bionic', '4GB', '128GB', '2438mAh', '85%', 'Pink', 'AVAILABLE'),
          ('Apple', 'iPhone 12 Pro Max', '', 'Fair', 2800.00, 1960.00, 'A14 Bionic', '6GB', '256GB', '3687mAh', '83%', 'Pacific Blue', 'AVAILABLE'),
          ('Apple', 'iPhone 12 Pro', '', 'Fair', 2400.00, 1680.00, 'A14 Bionic', '6GB', '128GB', '2815mAh', '80%', 'Gold', 'AVAILABLE'),
          ('Apple', 'iPhone 12', '', 'Fair', 2000.00, 1400.00, 'A14 Bionic', '4GB', '128GB', '2815mAh', '78%', 'Blue', 'AVAILABLE'),
          ('Apple', 'iPhone 12 Mini', '', 'Fair', 1800.00, 1260.00, 'A14 Bionic', '4GB', '64GB', '2227mAh', '75%', 'Green', 'AVAILABLE'),
          ('Apple', 'iPhone 11 Pro Max', '', 'Fair', 2200.00, 1540.00, 'A13 Bionic', '4GB', '256GB', '3969mAh', '70%', 'Midnight Green', 'AVAILABLE'),
          ('Apple', 'iPhone 11 Pro', '', 'Fair', 1900.00, 1330.00, 'A13 Bionic', '4GB', '64GB', '3046mAh', '68%', 'Space Gray', 'AVAILABLE'),
          ('Apple', 'iPhone 11', '', 'Fair', 1600.00, 1120.00, 'A13 Bionic', '4GB', '128GB', '3110mAh', '65%', 'Purple', 'AVAILABLE'),
          ('Apple', 'iPhone XS Max', '', 'Fair', 1500.00, 1050.00, 'A12 Bionic', '4GB', '256GB', '3174mAh', '60%', 'Silver', 'AVAILABLE'),
          ('Apple', 'iPhone XS', '', 'Fair', 1300.00, 910.00, 'A12 Bionic', '4GB', '64GB', '2658mAh', '58%', 'Gold', 'AVAILABLE'),
          ('Apple', 'iPhone XR', '', 'Fair', 1200.00, 840.00, 'A12 Bionic', '3GB', '128GB', '2942mAh', '55%', 'Red', 'AVAILABLE'),
          ('Apple', 'iPhone X', '', 'Fair', 1100.00, 770.00, 'A11 Bionic', '3GB', '64GB', '2716mAh', '50%', 'Space Gray', 'AVAILABLE'),
          ('Apple', 'iPhone SE 2022', '', 'Good', 1500.00, 1050.00, 'A15 Bionic', '4GB', '64GB', '2018mAh', '90%', 'Midnight', 'AVAILABLE')],
        
        # Samsung Galaxy S Series (20 phones)
        *[('Samsung', 'Galaxy S24 Ultra', '', 'Excellent', 5200.00, 3640.00, 'Snapdragon 8 Gen 3', '12GB', '512GB', '5000mAh', '100%', 'Titanium Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy S24 Plus', '', 'Excellent', 4200.00, 2940.00, 'Snapdragon 8 Gen 3', '12GB', '256GB', '4900mAh', '100%', 'Onyx Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy S24', '', 'Excellent', 3500.00, 2450.00, 'Snapdragon 8 Gen 3', '8GB', '256GB', '4000mAh', '100%', 'Cream', 'AVAILABLE'),
          ('Samsung', 'Galaxy S23 Ultra', '', 'Excellent', 4500.00, 3150.00, 'Snapdragon 8 Gen 2', '12GB', '512GB', '5000mAh', '98%', 'Phantom Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy S23 Plus', '', 'Good', 3600.00, 2520.00, 'Snapdragon 8 Gen 2', '8GB', '256GB', '4700mAh', '96%', 'Cream', 'AVAILABLE'),
          ('Samsung', 'Galaxy S23', '', 'Good', 3000.00, 2100.00, 'Snapdragon 8 Gen 2', '8GB', '256GB', '3900mAh', '95%', 'Lavender', 'AVAILABLE'),
          ('Samsung', 'Galaxy S22 Ultra', '', 'Good', 3800.00, 2660.00, 'Snapdragon 8 Gen 1', '12GB', '512GB', '5000mAh', '92%', 'Burgundy', 'AVAILABLE'),
          ('Samsung', 'Galaxy S22 Plus', '', 'Good', 2800.00, 1960.00, 'Snapdragon 8 Gen 1', '8GB', '256GB', '4500mAh', '90%', 'Phantom White', 'AVAILABLE'),
          ('Samsung', 'Galaxy S22', '', 'Good', 2400.00, 1680.00, 'Snapdragon 8 Gen 1', '8GB', '128GB', '3700mAh', '88%', 'Green', 'AVAILABLE'),
          ('Samsung', 'Galaxy S21 Ultra', '', 'Fair', 2800.00, 1960.00, 'Snapdragon 888', '12GB', '256GB', '5000mAh', '85%', 'Phantom Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy S21 Plus', '', 'Fair', 2200.00, 1540.00, 'Snapdragon 888', '8GB', '256GB', '4800mAh', '83%', 'Phantom Silver', 'AVAILABLE'),
          ('Samsung', 'Galaxy S21', '', 'Fair', 1900.00, 1330.00, 'Snapdragon 888', '8GB', '128GB', '4000mAh', '80%', 'Phantom Gray', 'AVAILABLE'),
          ('Samsung', 'Galaxy S20 Ultra', '', 'Fair', 2400.00, 1680.00, 'Snapdragon 865', '12GB', '256GB', '5000mAh', '75%', 'Cosmic Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy S20 Plus', '', 'Fair', 2000.00, 1400.00, 'Snapdragon 865', '8GB', '128GB', '4500mAh', '72%', 'Cloud Blue', 'AVAILABLE'),
          ('Samsung', 'Galaxy S20', '', 'Fair', 1700.00, 1190.00, 'Snapdragon 865', '8GB', '128GB', '4000mAh', '70%', 'Cosmic Gray', 'AVAILABLE'),
          ('Samsung', 'Galaxy S10 Plus', '', 'Fair', 1500.00, 1050.00, 'Snapdragon 855', '8GB', '128GB', '4100mAh', '65%', 'Prism Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy S10', '', 'Fair', 1300.00, 910.00, 'Snapdragon 855', '8GB', '128GB', '3400mAh', '60%', 'Prism White', 'AVAILABLE'),
          ('Samsung', 'Galaxy S10e', '', 'Fair', 1100.00, 770.00, 'Snapdragon 855', '6GB', '128GB', '3100mAh', '58%', 'Canary Yellow', 'AVAILABLE'),
          ('Samsung', 'Galaxy S9 Plus', '', 'Fair', 1000.00, 700.00, 'Snapdragon 845', '6GB', '64GB', '3500mAh', '55%', 'Midnight Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy S9', '', 'Fair', 900.00, 630.00, 'Snapdragon 845', '4GB', '64GB', '3000mAh', '50%', 'Coral Blue', 'AVAILABLE')],
        
        # Samsung Galaxy A Series (15 phones)
        *[('Samsung', 'Galaxy A54', '', 'Good', 1800.00, 1260.00, 'Exynos 1380', '8GB', '256GB', '5000mAh', '95%', 'Awesome Violet', 'AVAILABLE'),
          ('Samsung', 'Galaxy A34', '', 'Good', 1400.00, 980.00, 'Dimensity 1080', '8GB', '256GB', '5000mAh', '93%', 'Awesome Lime', 'AVAILABLE'),
          ('Samsung', 'Galaxy A24', '', 'Good', 1100.00, 770.00, 'Helio G99', '6GB', '128GB', '5000mAh', '92%', 'Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy A14', '', 'Good', 800.00, 560.00, 'Helio G80', '4GB', '128GB', '5000mAh', '90%', 'Silver', 'AVAILABLE'),
          ('Samsung', 'Galaxy A53', '', 'Fair', 1600.00, 1120.00, 'Exynos 1280', '8GB', '256GB', '5000mAh', '85%', 'Awesome Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy A33', '', 'Fair', 1300.00, 910.00, 'Exynos 1280', '6GB', '128GB', '5000mAh', '83%', 'Awesome Blue', 'AVAILABLE'),
          ('Samsung', 'Galaxy A23', '', 'Fair', 1000.00, 700.00, 'Snapdragon 680', '6GB', '128GB', '5000mAh', '80%', 'Peach', 'AVAILABLE'),
          ('Samsung', 'Galaxy A13', '', 'Fair', 700.00, 490.00, 'Exynos 850', '4GB', '64GB', '5000mAh', '78%', 'White', 'AVAILABLE'),
          ('Samsung', 'Galaxy A73', '', 'Good', 2000.00, 1400.00, 'Snapdragon 778G', '8GB', '256GB', '5000mAh', '90%', 'Gray', 'AVAILABLE'),
          ('Samsung', 'Galaxy A52', '', 'Fair', 1400.00, 980.00, 'Snapdragon 720G', '6GB', '128GB', '4500mAh', '75%', 'Violet', 'AVAILABLE'),
          ('Samsung', 'Galaxy A32', '', 'Fair', 1000.00, 700.00, 'Helio G80', '6GB', '128GB', '5000mAh', '70%', 'Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy A22', '', 'Fair', 800.00, 560.00, 'Helio G80', '4GB', '128GB', '5000mAh', '68%', 'Mint', 'AVAILABLE'),
          ('Samsung', 'Galaxy A12', '', 'Fair', 600.00, 420.00, 'Helio P35', '4GB', '64GB', '5000mAh', '65%', 'Blue', 'AVAILABLE'),
          ('Samsung', 'Galaxy A51', '', 'Fair', 1200.00, 840.00, 'Exynos 9611', '6GB', '128GB', '4000mAh', '60%', 'Prism Black', 'AVAILABLE'),
          ('Samsung', 'Galaxy A71', '', 'Fair', 1500.00, 1050.00, 'Snapdragon 730', '8GB', '128GB', '4500mAh', '62%', 'Prism Silver', 'AVAILABLE')],
        
        # Xiaomi/Redmi (15 phones)
        *[('Xiaomi', 'Xiaomi 14 Pro', '', 'Excellent', 3500.00, 2450.00, 'Snapdragon 8 Gen 3', '12GB', '512GB', '4880mAh', '100%', 'Black', 'AVAILABLE'),
          ('Xiaomi', 'Xiaomi 13 Pro', '', 'Good', 2800.00, 1960.00, 'Snapdragon 8 Gen 2', '12GB', '256GB', '4820mAh', '95%', 'White', 'AVAILABLE'),
          ('Xiaomi', 'Xiaomi 13', '', 'Good', 2400.00, 1680.00, 'Snapdragon 8 Gen 2', '8GB', '256GB', '4500mAh', '93%', 'Green', 'AVAILABLE'),
          ('Xiaomi', 'Xiaomi 12 Pro', '', 'Good', 2200.00, 1540.00, 'Snapdragon 8 Gen 1', '12GB', '256GB', '4600mAh', '90%', 'Blue', 'AVAILABLE'),
          ('Xiaomi', 'Xiaomi 12', '', 'Fair', 1900.00, 1330.00, 'Snapdragon 8 Gen 1', '8GB', '256GB', '4500mAh', '85%', 'Gray', 'AVAILABLE'),
          ('Xiaomi', 'Xiaomi 11', '', 'Fair', 1600.00, 1120.00, 'Snapdragon 888', '8GB', '128GB', '4600mAh', '80%', 'Midnight Gray', 'AVAILABLE'),
          ('Xiaomi', 'Redmi Note 13 Pro', '', 'Good', 1500.00, 1050.00, 'Snapdragon 7s Gen 2', '8GB', '256GB', '5100mAh', '95%', 'Black', 'AVAILABLE'),
          ('Xiaomi', 'Redmi Note 13', '', 'Good', 1200.00, 840.00, 'Snapdragon 685', '8GB', '256GB', '5000mAh', '93%', 'Blue', 'AVAILABLE'),
          ('Xiaomi', 'Redmi Note 12 Pro', '', 'Good', 1300.00, 910.00, 'Dimensity 1080', '8GB', '256GB', '5000mAh', '90%', 'Graphite Gray', 'AVAILABLE'),
          ('Xiaomi', 'Redmi Note 12', '', 'Fair', 1000.00, 700.00, 'Snapdragon 685', '6GB', '128GB', '5000mAh', '85%', 'Onyx Gray', 'AVAILABLE'),
          ('Xiaomi', 'Redmi Note 11 Pro', '', 'Fair', 1100.00, 770.00, 'Helio G96', '6GB', '128GB', '5000mAh', '80%', 'Star Blue', 'AVAILABLE'),
          ('Xiaomi', 'Redmi Note 11', '', 'Fair', 900.00, 630.00, 'Snapdragon 680', '4GB', '128GB', '5000mAh', '75%', 'Graphite Gray', 'AVAILABLE'),
          ('Xiaomi', 'Redmi 13C', '', 'Good', 700.00, 490.00, 'Helio G85', '4GB', '128GB', '5000mAh', '92%', 'Navy Blue', 'AVAILABLE'),
          ('Xiaomi', 'Redmi 12', '', 'Good', 800.00, 560.00, 'Helio G88', '6GB', '128GB', '5000mAh', '90%', 'Silver', 'AVAILABLE'),
          ('Xiaomi', 'POCO X5 Pro', '', 'Good', 1400.00, 980.00, 'Snapdragon 778G', '8GB', '256GB', '5000mAh', '88%', 'Yellow', 'AVAILABLE')],
        
        # Other Brands - Google, OnePlus, Oppo, Vivo, Huawei (25 phones)
        *[('Google', 'Pixel 8 Pro', '', 'Excellent', 4200.00, 2940.00, 'Tensor G3', '12GB', '256GB', '5050mAh', '100%', 'Obsidian', 'AVAILABLE'),
          ('Google', 'Pixel 8', '', 'Excellent', 3200.00, 2240.00, 'Tensor G3', '8GB', '256GB', '4575mAh', '100%', 'Rose', 'AVAILABLE'),
          ('Google', 'Pixel 7 Pro', '', 'Good', 3000.00, 2100.00, 'Tensor G2', '12GB', '256GB', '5000mAh', '93%', 'Snow', 'AVAILABLE'),
          ('Google', 'Pixel 7', '', 'Good', 2400.00, 1680.00, 'Tensor G2', '8GB', '128GB', '4355mAh', '90%', 'Lemongrass', 'AVAILABLE'),
          ('Google', 'Pixel 6 Pro', '', 'Fair', 2000.00, 1400.00, 'Tensor', '12GB', '128GB', '5003mAh', '80%', 'Stormy Black', 'AVAILABLE'),
          ('OnePlus', 'OnePlus 12', '', 'Excellent', 3800.00, 2660.00, 'Snapdragon 8 Gen 3', '12GB', '256GB', '5400mAh', '100%', 'Flowy Emerald', 'AVAILABLE'),
          ('OnePlus', 'OnePlus 11', '', 'Good', 2800.00, 1960.00, 'Snapdragon 8 Gen 2', '8GB', '128GB', '5000mAh', '92%', 'Titan Black', 'AVAILABLE'),
          ('OnePlus', 'OnePlus 10 Pro', '', 'Fair', 2200.00, 1540.00, 'Snapdragon 8 Gen 1', '8GB', '128GB', '5000mAh', '85%', 'Volcanic Black', 'AVAILABLE'),
          ('OnePlus', 'OnePlus Nord 3', '', 'Good', 1600.00, 1120.00, 'Dimensity 9000', '8GB', '128GB', '5000mAh', '90%', 'Misty Green', 'AVAILABLE'),
          ('OnePlus', 'OnePlus Nord CE 3', '', 'Good', 1200.00, 840.00, 'Snapdragon 782G', '8GB', '128GB', '5000mAh', '88%', 'Aqua Surge', 'AVAILABLE'),
          ('Oppo', 'Oppo Find X6 Pro', '', 'Excellent', 3500.00, 2450.00, 'Snapdragon 8 Gen 2', '12GB', '256GB', '5000mAh', '98%', 'Black', 'AVAILABLE'),
          ('Oppo', 'Oppo Reno 10 Pro', '', 'Good', 1800.00, 1260.00, 'Snapdragon 778G', '12GB', '256GB', '4600mAh', '92%', 'Silvery Gray', 'AVAILABLE'),
          ('Oppo', 'Oppo Reno 8 Pro', '', 'Fair', 1600.00, 1120.00, 'Dimensity 8100', '8GB', '256GB', '4500mAh', '85%', 'Glazed Black', 'AVAILABLE'),
          ('Oppo', 'Oppo A78', '', 'Good', 1100.00, 770.00, 'Dimensity 700', '8GB', '256GB', '5000mAh', '90%', 'Blue', 'AVAILABLE'),
          ('Oppo', 'Oppo A58', '', 'Good', 900.00, 630.00, 'Helio G85', '6GB', '128GB', '5000mAh', '88%', 'Black', 'AVAILABLE'),
          ('Vivo', 'Vivo X90 Pro', '', 'Excellent', 3200.00, 2240.00, 'Dimensity 9200', '12GB', '256GB', '4870mAh', '98%', 'Legendary Black', 'AVAILABLE'),
          ('Vivo', 'Vivo V29', '', 'Good', 1600.00, 1120.00, 'Snapdragon 778G', '12GB', '256GB', '4600mAh', '92%', 'Noble Black', 'AVAILABLE'),
          ('Vivo', 'Vivo V27', '', 'Fair', 1400.00, 980.00, 'Dimensity 7200', '8GB', '256GB', '4600mAh', '85%', 'Magic Blue', 'AVAILABLE'),
          ('Vivo', 'Vivo Y100', '', 'Good', 1200.00, 840.00, 'Snapdragon 685', '8GB', '128GB', '5000mAh', '90%', 'Metal Black', 'AVAILABLE'),
          ('Vivo', 'Vivo Y36', '', 'Good', 900.00, 630.00, 'Snapdragon 680', '8GB', '128GB', '5000mAh', '88%', 'Meteor Black', 'AVAILABLE'),
          ('Huawei', 'Huawei P60 Pro', '', 'Excellent', 3500.00, 2450.00, 'Snapdragon 8+ Gen 1', '8GB', '256GB', '4815mAh', '98%', 'Black', 'AVAILABLE'),
          ('Huawei', 'Huawei Nova 11', '', 'Good', 1500.00, 1050.00, 'Snapdragon 778G', '8GB', '256GB', '4500mAh', '90%', 'Green', 'AVAILABLE'),
          ('Huawei', 'Huawei P50 Pro', '', 'Fair', 2000.00, 1400.00, 'Snapdragon 888', '8GB', '256GB', '4360mAh', '80%', 'Golden Black', 'AVAILABLE'),
          ('Tecno', 'Tecno Phantom X2 Pro', '', 'Good', 1400.00, 980.00, 'Dimensity 9000', '12GB', '256GB', '5160mAh', '92%', 'Mars Orange', 'AVAILABLE'),
          ('Tecno', 'Tecno Camon 20 Pro', '', 'Good', 1100.00, 770.00, 'Dimensity 8050', '8GB', '256GB', '5000mAh', '90%', 'Serenity Blue', 'AVAILABLE'),
          ('Tecno', 'Tecno Spark 10 Pro', '', 'Good', 700.00, 490.00, 'Helio G88', '8GB', '256GB', '5000mAh', '88%', 'Pearl White', 'AVAILABLE')],
        
        # Budget & Mid-Range Phones (15 phones)
        *[('Infinix', 'Infinix Note 30 Pro', '', 'Good', 1000.00, 700.00, 'Dimensity 8050', '8GB', '256GB', '5000mAh', '90%', 'Obsidian Black', 'AVAILABLE'),
          ('Infinix', 'Infinix Hot 30', '', 'Good', 600.00, 420.00, 'Helio G88', '8GB', '128GB', '5000mAh', '88%', 'Knight Black', 'AVAILABLE'),
          ('Infinix', 'Infinix Smart 8', '', 'Good', 500.00, 350.00, 'Helio G36', '4GB', '64GB', '5000mAh', '85%', 'Timber Black', 'AVAILABLE'),
          ('Realme', 'Realme GT 3', '', 'Good', 1800.00, 1260.00, 'Snapdragon 8+ Gen 1', '8GB', '128GB', '4600mAh', '90%', 'Booster Black', 'AVAILABLE'),
          ('Realme', 'Realme 11 Pro', '', 'Good', 1400.00, 980.00, 'Dimensity 7050', '8GB', '256GB', '5000mAh', '88%', 'Sunrise Beige', 'AVAILABLE'),
          ('Realme', 'Realme C55', '', 'Good', 800.00, 560.00, 'Helio G88', '8GB', '256GB', '5000mAh', '85%', 'Rainforest Green', 'AVAILABLE'),
          ('Realme', 'Realme C53', '', 'Good', 650.00, 455.00, 'Unisoc T612', '6GB', '128GB', '5000mAh', '83%', 'Champion Gold', 'AVAILABLE'),
          ('Nokia', 'Nokia G42', '', 'Good', 900.00, 630.00, 'Snapdragon 480+', '6GB', '128GB', '5000mAh', '88%', 'So Purple', 'AVAILABLE'),
          ('Nokia', 'Nokia X30', '', 'Good', 1500.00, 1050.00, 'Snapdragon 695', '8GB', '256GB', '4200mAh', '85%', 'Cloudy Blue', 'AVAILABLE'),
          ('Nokia', 'Nokia C32', '', 'Fair', 550.00, 385.00, 'Unisoc SC9863A', '3GB', '64GB', '5000mAh', '80%', 'Charcoal', 'AVAILABLE'),
          ('Motorola', 'Moto Edge 40 Pro', '', 'Excellent', 2500.00, 1750.00, 'Snapdragon 8 Gen 2', '12GB', '256GB', '4600mAh', '95%', 'Interstellar Black', 'AVAILABLE'),
          ('Motorola', 'Moto G84', '', 'Good', 1200.00, 840.00, 'Snapdragon 695', '8GB', '256GB', '5000mAh', '88%', 'Viva Magenta', 'AVAILABLE'),
          ('Motorola', 'Moto G54', '', 'Good', 900.00, 630.00, 'Dimensity 7020', '8GB', '256GB', '5000mAh', '85%', 'Midnight Blue', 'AVAILABLE'),
          ('Nothing', 'Nothing Phone 2', '', 'Excellent', 2800.00, 1960.00, 'Snapdragon 8+ Gen 1', '12GB', '256GB', '4700mAh', '95%', 'White', 'AVAILABLE'),
          ('Nothing', 'Nothing Phone 1', '', 'Good', 1800.00, 1260.00, 'Snapdragon 778+', '8GB', '128GB', '4500mAh', '85%', 'Black', 'AVAILABLE')],
    ]
    
    # Unpack into columns
    brands, models, imeis, conds, vals, costs, cpus, rams, storages, bats, bat_healths, colors, stats = [], [], [], [], [], [], [], [], [], [], [], [], []
    for item in phone_samples[:100]:  # Limit to 100 items
        brands.append(item[0])
        models.append(item[1])
        imeis.append(item[2])
        conds.append(item[3])
        vals.append(item[4])
        costs.append(item[5])
        cpus.append(item[6])
        rams.append(item[7])
        storages.append(item[8])
        bats.append(item[9])
        bat_healths.append(item[10])
        colors.append(item[11])
        stats.append(item[12])
    
    data = {
        'brand': brands,
        'model': models,
        'imei': imeis,
        'condition': conds,
        'value': vals,
        'cost_price': costs,
        'cpu': cpus,
        'ram': rams,
        'storage': storages,
        'battery': bats,
        'battery_health': bat_healths,
        'color': colors,
        'status': stats
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
            ],
            'Example': [
                'Apple',
                'iPhone 13 Pro',
                '123456789012345',
                'Excellent',
                '3500.00',
                '2450.00',
                'A15 Bionic',
                '6GB',
                '128GB',
                '3095mAh',
                '95%',
                'Graphite',
                'AVAILABLE'
            ]
        }
        instructions_df = pd.DataFrame(instructions_data)
        instructions_df.to_excel(writer, index=False, sheet_name='Instructions')
        
        # Add info sheet
        info_data = {
            'Information': [
                '✅ This template contains 100 ready-to-use sample phones',
                '✅ Mix of premium, mid-range, and budget phones',
                '✅ You can edit any phone details as needed',
                '✅ Delete rows you don\'t need',
                '✅ Add more rows if you need more phones',
                '✅ Prices are in Ghana Cedis (GH₵)',
                '✅ IMEI can be left blank - system generates unique IDs',
                '',
                'Phone brands included:',
                '- Apple (25 phones: iPhone 15 Pro Max to iPhone X)',
                '- Samsung S Series (20 phones: S24 Ultra to S9)',
                '- Samsung A Series (15 phones: A54 to A12)',
                '- Xiaomi/Redmi (15 phones: Xiaomi 14 Pro to Redmi 12)',
                '- Google Pixel (5 phones)',
                '- OnePlus (5 phones)',
                '- Oppo (5 phones)',
                '- Vivo (5 phones)',
                '- Huawei (3 phones)',
                '- Tecno (3 phones)',
                '- Infinix (3 phones)',
                '- Realme (4 phones)',
                '- Nokia (3 phones)',
                '- Motorola (3 phones)',
                '- Nothing (2 phones)',
                '',
                'Condition mix:',
                '- Excellent: Latest flagship models (2024-2025)',
                '- Good: Recent models (2022-2023)',
                '- Fair: Older models (2019-2021)',
                '',
                'Price Range:',
                '- Premium: ₵3500 - ₵6200 (Flagships)',
                '- Mid-range: ₵1500 - ₵3500 (Good phones)',
                '- Budget: ₵500 - ₵1500 (Entry-level)',
                '',
                'Tips:',
                '- Adjust prices to match your market',
                '- Update battery health for used phones',
                '- Add IMEI for tracking (optional)',
                '- Change colors and storage as needed',
                '- Mix and match models you actually have'
            ]
        }
        info_df = pd.DataFrame(info_data)
        info_df.to_excel(writer, index=False, sheet_name='How To Use')
    
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
        
        # Get the next available unique_id number
        from sqlalchemy import func
        max_unique_id_row = db.query(Phone.unique_id).filter(
            Phone.unique_id.like('PHON-%')
        ).order_by(Phone.unique_id.desc()).first()
        
        if max_unique_id_row and max_unique_id_row[0]:
            # Extract number from PHON-0001 format
            try:
                last_number = int(max_unique_id_row[0].split('-')[1])
                next_unique_number = last_number + 1
            except (ValueError, IndexError):
                next_unique_number = 1
        else:
            next_unique_number = 1
        
        print(f"📊 Starting phone unique_id sequence from: PHON-{str(next_unique_number).zfill(4)}")
        
        # Process each row
        added_phones = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Get brand_id if exists (or auto-create)
                from app.models.brand import Brand
                brand = db.query(Brand).filter(Brand.name == row['brand']).first()
                
                if not brand:
                    # Auto-create brand if it doesn't exist
                    print(f"🆕 Auto-creating brand: {row['brand']}")
                    brand = Brand(
                        name=str(row['brand']),
                        description=f"Auto-created from bulk upload",
                        created_by_user_id=current_user.id
                    )
                    db.add(brand)
                    db.flush()
                    print(f"✅ Brand created: {brand.name} (ID: {brand.id})")
                
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
                
                # Generate unique_id using incremental counter
                phone.unique_id = f"PHON-{str(next_unique_number).zfill(4)}"
                next_unique_number += 1
                
                added_phones.append({
                    'id': phone.id,
                    'brand': phone.brand,
                    'model': phone.model,
                    'unique_id': phone.unique_id
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

