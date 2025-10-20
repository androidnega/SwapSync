#!/usr/bin/env python3
"""
EMERGENCY: Clear all POS sales from production database
Run this on Railway: railway run python backend/EMERGENCY_CLEAR_POS.py
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import SessionLocal
    from app.models.pos_sale import POSSale, POSSaleItem
    from app.models.product_sale import ProductSale
    from app.models.product import StockMovement
    
    print("=" * 60)
    print("  EMERGENCY: Clearing ALL POS Sales Data")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Count before deletion
        pos_sales_count = db.query(POSSale).count()
        pos_items_count = db.query(POSSaleItem).count()
        product_sales_count = db.query(ProductSale).count()
        stock_movements_count = db.query(StockMovement).filter(
            StockMovement.reference_type == "pos_sale"
        ).count()
        
        print(f"\n📊 Found in database:")
        print(f"   • {pos_sales_count} POS sales")
        print(f"   • {pos_items_count} POS sale items")
        print(f"   • {product_sales_count} product sales")
        print(f"   • {stock_movements_count} stock movements")
        
        print(f"\n🗑️  Deleting...")
        
        # Delete in correct order (foreign keys)
        db.query(POSSaleItem).delete()
        print("   ✓ POS sale items deleted")
        
        db.query(POSSale).delete()
        print("   ✓ POS sales deleted")
        
        db.query(ProductSale).delete()
        print("   ✓ Product sales deleted")
        
        db.query(StockMovement).filter(
            StockMovement.reference_type == "pos_sale"
        ).delete()
        print("   ✓ Stock movements deleted")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print("  ✅ SUCCESS! All POS data cleared!")
        print("=" * 60)
        print("\n🔄 Now refresh your POS Monitor page:")
        print("   https://swapsync.digitstec.store/pos-monitor")
        print("\n")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        
except ImportError as e:
    print(f"\n❌ Import Error: {e}")
    print("\nMake sure you run this from the Railway environment:")
    print("  railway run python backend/EMERGENCY_CLEAR_POS.py")

