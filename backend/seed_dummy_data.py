"""
Seed dummy data for SwapSync system
- Phone Brands & Categories
- Products (accessories, parts)
- Phones (for swapping)
- Customers
"""
import sqlite3
from datetime import datetime, timedelta
import random

def seed_data():
    conn = sqlite3.connect('swapsync.db')
    cursor = conn.cursor()
    
    print("🌱 Seeding dummy data...")
    
    # ============= PHONE BRANDS =============
    print("\n📱 Adding Phone Brands...")
    brands = [
        'Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Tecno',
        'Infinix', 'Vivo', 'Realme', 'OnePlus', 'Huawei'
    ]
    
    for brand in brands:
        try:
            cursor.execute("""
                INSERT OR IGNORE INTO brands (name, description, created_at)
                VALUES (?, ?, ?)
            """, (brand, f"Official {brand} products", datetime.now()))
            print(f"  ✅ {brand}")
        except Exception as e:
            print(f"  ⚠️  {brand}: {e}")
    
    # ============= PRODUCT CATEGORIES =============
    print("\n📦 Adding Product Categories...")
    categories = [
        ('Phone Accessories', 'Cases, screen protectors, chargers'),
        ('Earphones & Audio', 'Earphones, headphones, speakers'),
        ('Power Banks', 'Portable chargers and power banks'),
        ('Phone Parts', 'Screens, batteries, charging ports'),
        ('Memory Cards', 'SD cards and storage devices'),
        ('Cables & Adapters', 'USB cables, adapters, converters'),
        ('Smart Watches', 'Smartwatches and fitness bands'),
        ('Phone Stands', 'Holders, mounts, and stands')
    ]
    
    for name, desc in categories:
        try:
            cursor.execute("""
                INSERT OR IGNORE INTO categories (name, description, created_at)
                VALUES (?, ?, ?)
            """, (name, desc, datetime.now()))
            print(f"  ✅ {name}")
        except Exception as e:
            print(f"  ⚠️  {name}: {e}")
    
    # ============= PRODUCTS =============
    print("\n🛍️  Adding Products...")
    
    # Get category IDs
    cursor.execute("SELECT id, name FROM categories")
    category_map = {name: id for id, name in cursor.fetchall()}
    
    products = [
        # Phone Accessories - Mixed Stock Levels
        ('iPhone 13 Case', 'Phone Accessories', 'Apple', 'Silicone protective case', 45.00, 50, 10, True),  # In Stock
        ('Samsung S23 Screen Protector', 'Phone Accessories', 'Samsung', 'Tempered glass', 25.00, 0, 20, False),  # OUT OF STOCK
        ('USB-C Fast Charger', 'Phone Accessories', None, '65W fast charging', 80.00, 8, 10, True),  # LOW STOCK
        ('Wireless Charger Pad', 'Phone Accessories', None, '15W Qi wireless charging', 120.00, 30, 10, True),
        ('Phone Ring Holder', 'Phone Accessories', None, 'Magnetic ring stand', 15.00, 0, 15, False),  # OUT OF STOCK
        
        # Earphones & Audio
        ('AirPods Pro', 'Earphones & Audio', 'Apple', 'Active noise cancellation', 850.00, 15, 5, True),
        ('Galaxy Buds 2', 'Earphones & Audio', 'Samsung', 'True wireless earbuds', 450.00, 3, 5, True),  # LOW STOCK
        ('Xiaomi Buds 3', 'Earphones & Audio', 'Xiaomi', 'Affordable wireless buds', 180.00, 40, 10, True),
        ('Bluetooth Speaker', 'Earphones & Audio', None, 'Portable waterproof speaker', 250.00, 20, 5, True),
        ('Wired Earphones', 'Earphones & Audio', None, '3.5mm jack earphones', 35.00, 0, 20, False),  # OUT OF STOCK
        
        # Power Banks - Mixed
        ('20000mAh Power Bank', 'Power Banks', None, 'Fast charging portable battery', 180.00, 35, 10, True),
        ('10000mAh Mini Power Bank', 'Power Banks', None, 'Compact portable charger', 95.00, 7, 15, True),  # LOW STOCK
        ('30000mAh Solar Power Bank', 'Power Banks', None, 'Solar charging power bank', 280.00, 15, 5, True),
        ('5000mAh Power Bank', 'Power Banks', None, 'Ultra compact charger', 55.00, 0, 10, False),  # OUT OF STOCK
        
        # Phone Parts
        ('iPhone 12 Display', 'Phone Parts', 'Apple', 'Original OLED screen', 1200.00, 10, 2, True),
        ('Samsung A54 Battery', 'Phone Parts', 'Samsung', 'Original replacement battery', 150.00, 1, 5, True),  # LOW STOCK
        ('Tecno Spark Charging Port', 'Phone Parts', 'Tecno', 'USB-C charging port', 45.00, 30, 8, True),
        ('iPhone 11 Battery', 'Phone Parts', 'Apple', 'Original replacement battery', 180.00, 0, 5, False),  # OUT OF STOCK
        
        # Memory Cards
        ('128GB SD Card', 'Memory Cards', None, 'Class 10 high speed', 120.00, 40, 10, True),
        ('256GB MicroSD', 'Memory Cards', None, 'UHS-I U3 A1', 220.00, 6, 10, True),  # LOW STOCK
        ('64GB Flash Drive', 'Memory Cards', None, 'USB 3.0 OTG', 65.00, 50, 15, True),
        ('512GB MicroSD', 'Memory Cards', None, 'Ultra high speed', 380.00, 0, 5, False),  # OUT OF STOCK
        
        # Cables & Adapters
        ('USB-C to Lightning Cable', 'Cables & Adapters', 'Apple', '1m fast charging cable', 85.00, 60, 15, True),
        ('USB-C to USB-C Cable', 'Cables & Adapters', None, '2m 100W cable', 55.00, 9, 20, True),  # LOW STOCK
        ('3-in-1 Charging Cable', 'Cables & Adapters', None, 'USB-C, Lightning, Micro USB', 45.00, 80, 20, True),
        ('USB-C to HDMI Adapter', 'Cables & Adapters', None, '4K output adapter', 95.00, 25, 8, True),
        ('Lightning to 3.5mm Adapter', 'Cables & Adapters', 'Apple', 'Audio adapter', 35.00, 0, 10, False),  # OUT OF STOCK
        
        # Smart Watches
        ('Apple Watch Series 8', 'Smart Watches', 'Apple', 'GPS + Cellular', 2200.00, 8, 2, True),
        ('Samsung Galaxy Watch 5', 'Smart Watches', 'Samsung', 'Advanced health tracking', 1500.00, 2, 3, True),  # LOW STOCK
        ('Xiaomi Smart Band 7', 'Smart Watches', 'Xiaomi', 'Affordable fitness tracker', 180.00, 40, 10, True),
        ('Huawei Watch Fit', 'Smart Watches', 'Huawei', 'Fitness smartwatch', 420.00, 0, 5, False),  # OUT OF STOCK
        
        # Phone Stands
        ('Adjustable Phone Stand', 'Phone Stands', None, 'Desktop holder', 35.00, 45, 12, True),
        ('Car Phone Mount', 'Phone Stands', None, 'Dashboard/windshield mount', 55.00, 35, 10, True),
        ('Tripod Phone Stand', 'Phone Stands', None, 'Portable tripod stand', 75.00, 4, 10, True),  # LOW STOCK
    ]
    
    for name, cat_name, brand, desc, price, stock, low_stock, is_available in products:
        try:
            cat_id = category_map.get(cat_name)
            if not cat_id:
                continue
                
            cursor.execute("""
                INSERT OR IGNORE INTO products 
                (name, description, category_id, brand, cost_price, selling_price, quantity, min_stock_level, is_active, is_available, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (name, desc, cat_id, brand, price * 0.7, price, stock, low_stock, True, is_available, datetime.now(), datetime.now()))
            print(f"  ✅ {name} (₵{price})")
        except Exception as e:
            print(f"  ⚠️  {name}: {e}")
    
    # Generate unique IDs for products
    cursor.execute("SELECT id FROM products WHERE unique_id IS NULL ORDER BY id")
    product_ids = [row[0] for row in cursor.fetchall()]
    cursor.execute("SELECT COALESCE(MAX(CAST(SUBSTR(unique_id, 6) AS INTEGER)), 0) FROM products WHERE unique_id IS NOT NULL")
    start_id = cursor.fetchone()[0] + 1
    for idx, prod_id in enumerate(product_ids, start_id):
        cursor.execute(
            "UPDATE products SET unique_id = ? WHERE id = ?",
            (f"PROD-{str(idx).zfill(4)}", prod_id)
        )
    
    # ============= PHONES =============
    print("\n📱 Adding Phones for Swapping...")
    
    cursor.execute("SELECT id, name FROM brands")
    brand_ids = {name: id for id, name in cursor.fetchall()}
    
    phones = [
        ('iPhone 13', 'Apple', 'A15 Bionic', '6GB', '128GB', '3240mAh', '95%', 'Midnight Blue', 'Good', 3500.00, True, '356789012345671'),
        ('iPhone 12', 'Apple', 'A14 Bionic', '4GB', '64GB', '2815mAh', '88%', 'White', 'Excellent', 2800.00, True, '356789012345672'),
        ('iPhone 11', 'Apple', 'A13 Bionic', '4GB', '128GB', '3110mAh', '82%', 'Black', 'Fair', 2200.00, True, '356789012345673'),
        ('iPhone XR', 'Apple', 'A12 Bionic', '3GB', '64GB', '2942mAh', '75%', 'Red', 'Good', 1650.00, True, '356789012345674'),
        ('Samsung S23', 'Samsung', 'Snapdragon 8 Gen 2', '8GB', '256GB', '3900mAh', '98%', 'Phantom Black', 'Excellent', 4200.00, True, '356789012345675'),
        ('Samsung A54', 'Samsung', 'Exynos 1380', '8GB', '128GB', '5000mAh', '92%', 'Awesome Violet', 'Good', 1800.00, True, '356789012345676'),
        ('Samsung A34', 'Samsung', 'Dimensity 1080', '6GB', '128GB', '5000mAh', '90%', 'Awesome Silver', 'Good', 1500.00, True, '356789012345677'),
        ('Samsung S22', 'Samsung', 'Snapdragon 8 Gen 1', '8GB', '128GB', '3700mAh', '85%', 'Green', 'Excellent', 3600.00, True, '356789012345678'),
        ('Xiaomi 13 Pro', 'Xiaomi', 'Snapdragon 8 Gen 2', '12GB', '256GB', '4820mAh', '96%', 'Ceramic Black', 'Excellent', 3200.00, True, '356789012345679'),
        ('Redmi Note 12', 'Xiaomi', 'Snapdragon 4 Gen 1', '6GB', '128GB', '5000mAh', '94%', 'Onyx Gray', 'Good', 950.00, True, '356789012345680'),
        ('Redmi 12', 'Xiaomi', 'Helio G88', '4GB', '128GB', '5000mAh', '91%', 'Sky Blue', 'Good', 750.00, True, '356789012345681'),
        ('Oppo Reno 8', 'Oppo', 'Dimensity 1300', '8GB', '256GB', '4500mAh', '89%', 'Shimmer Gold', 'Good', 2100.00, True, '356789012345682'),
        ('Oppo A78', 'Oppo', 'Dimensity 700', '8GB', '128GB', '5000mAh', '93%', 'Glowing Black', 'Excellent', 1100.00, True, '356789012345683'),
        ('Tecno Phantom X2', 'Tecno', 'Dimensity 9000', '8GB', '256GB', '5160mAh', '97%', 'Stardust Gray', 'Excellent', 1800.00, True, '356789012345684'),
        ('Tecno Camon 20', 'Tecno', 'Helio G85', '8GB', '256GB', '5000mAh', '94%', 'Serenity Blue', 'Good', 980.00, True, '356789012345685'),
        ('Infinix Note 30', 'Infinix', 'Dimensity 6080', '8GB', '128GB', '5000mAh', '95%', 'Magic Black', 'Good', 1200.00, True, '356789012345686'),
        ('Infinix Hot 30', 'Infinix', 'Helio G88', '8GB', '128GB', '5000mAh', '92%', 'Knight Black', 'Good', 850.00, True, '356789012345687'),
        ('Vivo V27', 'Vivo', 'Dimensity 7200', '8GB', '256GB', '4600mAh', '90%', 'Noble Black', 'Good', 2300.00, True, '356789012345688'),
        ('Vivo Y36', 'Vivo', 'Snapdragon 680', '8GB', '128GB', '5000mAh', '93%', 'Meteor Black', 'Excellent', 1050.00, True, '356789012345689'),
        ('Realme GT 2', 'Realme', 'Snapdragon 888', '8GB', '128GB', '5000mAh', '91%', 'Paper Green', 'Excellent', 1650.00, True, '356789012345690'),
        ('Realme 11 Pro', 'Realme', 'Dimensity 7050', '8GB', '256GB', '5000mAh', '96%', 'Sunrise Beige', 'Excellent', 1750.00, True, '356789012345691'),
        ('OnePlus 11', 'OnePlus', 'Snapdragon 8 Gen 2', '16GB', '256GB', '5000mAh', '98%', 'Titan Black', 'Excellent', 3800.00, True, '356789012345692'),
        ('OnePlus Nord 3', 'OnePlus', 'Dimensity 9000', '8GB', '128GB', '5000mAh', '94%', 'Misty Green', 'Excellent', 2100.00, True, '356789012345693'),
        ('Huawei P50', 'Huawei', 'Snapdragon 888', '8GB', '128GB', '4100mAh', '87%', 'Golden Black', 'Good', 2400.00, True, '356789012345694'),
    ]
    
    for model, brand_name, cpu, ram, storage, battery, battery_health, color, condition, value, available, imei in phones:
        try:
            brand_id = brand_ids.get(brand_name)
            specs_json = f'{{"cpu": "{cpu}", "ram": "{ram}", "storage": "{storage}", "battery": "{battery}", "battery_health": "{battery_health}", "color": "{color}"}}'
            cursor.execute("""
                INSERT OR IGNORE INTO phones 
                (brand, brand_id, model, imei, specs, condition, value, cost_price, is_available, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (brand_name, brand_id, model, imei, specs_json, condition, value, value * 0.7, available, 'AVAILABLE' if available else 'SOLD'))
            print(f"  ✅ {brand_name} {model} - ₵{value} ({storage}, {color})")
        except Exception as e:
            print(f"  ⚠️  {model}: {e}")
    
    # Generate unique IDs for phones
    cursor.execute("SELECT id FROM phones WHERE unique_id IS NULL ORDER BY id")
    phone_ids = [row[0] for row in cursor.fetchall()]
    cursor.execute("SELECT COALESCE(MAX(CAST(SUBSTR(unique_id, 6) AS INTEGER)), 0) FROM phones WHERE unique_id IS NOT NULL")
    start_id = cursor.fetchone()[0] + 1
    for idx, phone_id in enumerate(phone_ids, start_id):
        cursor.execute(
            "UPDATE phones SET unique_id = ? WHERE id = ?",
            (f"PHON-{str(idx).zfill(4)}", phone_id)
        )
    
    # ============= CUSTOMERS =============
    print("\n👥 Adding Customers...")
    
    customers = [
        ('Kwame Mensah', '0244567890', 'kwame.mensah@email.com'),
        ('Ama Serwaa', '0209876543', 'ama.serwaa@email.com'),
        ('Kofi Asante', '0551234567', 'kofi.asante@email.com'),
        ('Akua Boateng', '0208765432', 'akua.boateng@email.com'),
        ('Yaw Agyemang', '0243456789', 'yaw.agyemang@email.com'),
        ('Efua Darko', '0554321098', 'efua.darko@email.com'),
        ('Kwesi Adjei', '0245678901', 'kwesi.adjei@email.com'),
        ('Abena Owusu', '0207654321', 'abena.owusu@email.com'),
    ]
    
    for name, phone, email in customers:
        try:
            cursor.execute("""
                INSERT OR IGNORE INTO customers 
                (full_name, phone_number, email, created_at)
                VALUES (?, ?, ?, ?)
            """, (name, phone, email, datetime.now()))
            print(f"  ✅ {name}")
        except Exception as e:
            print(f"  ⚠️  {name}: {e}")
    
    # Generate unique IDs for customers
    cursor.execute("SELECT id FROM customers WHERE unique_id IS NULL ORDER BY id")
    customer_ids = [row[0] for row in cursor.fetchall()]
    cursor.execute("SELECT COALESCE(MAX(CAST(SUBSTR(unique_id, 6) AS INTEGER)), 0) FROM customers WHERE unique_id IS NOT NULL")
    start_id = cursor.fetchone()[0] + 1
    for idx, cust_id in enumerate(customer_ids, start_id):
        cursor.execute(
            "UPDATE customers SET unique_id = ? WHERE id = ?",
            (f"CUST-{str(idx).zfill(4)}", cust_id)
        )
    
    conn.commit()
    conn.close()
    
    print("\n✅ Dummy data seeding completed successfully!")
    print("\n📊 Summary:")
    print(f"  • {len(brands)} Phone Brands")
    print(f"  • {len(categories)} Product Categories")
    print(f"  • {len(products)} Products")
    print(f"  • {len(phones)} Phones")
    print(f"  • {len(customers)} Customers")

if __name__ == "__main__":
    seed_data()

