"""Check database for products and sales"""
from app.core.database import SessionLocal
from app.models.pos_sale import POSSale, POSSaleItem
from app.models.product import Product
from datetime import datetime

db = SessionLocal()

print('=== PRODUCTS ===')
products = db.query(Product).all()
print(f'Total products: {len(products)}')
for p in products[:5]:
    print(f'- {p.name}: qty={p.quantity}, active={p.is_active}')

print('\n=== POS SALES ===')
sales = db.query(POSSale).all()
print(f'Total POS sales: {len(sales)}')

# Check today's sales
today = datetime.now().date()
today_sales = [s for s in sales if s.created_at.date() == today]
print(f'Today\'s sales: {len(today_sales)}')

for s in sales[-7:]:  # Last 7 sales
    print(f'- {s.transaction_id}: ₵{s.total_amount} on {s.created_at}')

print('\n=== POS SALE ITEMS ===')
items = db.query(POSSaleItem).all()
print(f'Total items sold (all time): {len(items)}')

# Count by product name
from collections import Counter
product_counts = Counter(i.product_name for i in items)
print('\nTop selling products (all time):')
for product, count in product_counts.most_common(5):
    print(f'- {product}: {count} units')

db.close()

