"""
Clear all POS sales data immediately - NO CONFIRMATION
Use this script to clear POS sales from command line
"""
from app.core.database import SessionLocal
from app.models.pos_sale import POSSale, POSSaleItem
from app.models.product_sale import ProductSale
from app.models.product import StockMovement

def clear_pos_sales_immediately():
    """Clear all POS sales without asking for confirmation"""
    db = SessionLocal()
    try:
        print("🗑️  Clearing POS sales data...")
        
        # Count before deletion
        pos_sales_count = db.query(POSSale).count()
        pos_items_count = db.query(POSSaleItem).count()
        product_sales_count = db.query(ProductSale).count()
        stock_movements_count = db.query(StockMovement).filter(
            StockMovement.reference_type == "pos_sale"
        ).count()
        
        print(f"\nFound:")
        print(f"  - {pos_sales_count} POS sales")
        print(f"  - {pos_items_count} POS sale items")
        print(f"  - {product_sales_count} product sales")
        print(f"  - {stock_movements_count} POS stock movements")
        
        # Delete in correct order (due to foreign keys)
        print("\nDeleting...")
        
        # 1. Delete POS sale items first
        db.query(POSSaleItem).delete()
        print("  ✓ POS sale items deleted")
        
        # 2. Delete POS sales
        db.query(POSSale).delete()
        print("  ✓ POS sales deleted")
        
        # 3. Delete product sales
        db.query(ProductSale).delete()
        print("  ✓ Product sales deleted")
        
        # 4. Delete stock movements related to POS sales
        db.query(StockMovement).filter(
            StockMovement.reference_type == "pos_sale"
        ).delete()
        print("  ✓ POS stock movements deleted")
        
        db.commit()
        print("\n✅ All POS sales data cleared successfully!")
        print("📊 The system is now ready for fresh transactions.")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error clearing data: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("  Clearing ALL POS sales history...")
    print("=" * 60)
    clear_pos_sales_immediately()

