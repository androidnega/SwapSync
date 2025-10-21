"""
Clean up hardcoded brands and categories from database
This script removes all brands and categories that have NULL created_by_user_id
(meaning they were auto-inserted by migrations, not created by users)
"""
import sys
from app.core.database import SessionLocal
from app.models.brand import Brand
from app.models.category import Category
from app.models.phone import Phone
from app.models.product import Product


def cleanup_hardcoded_data():
    """
    Remove all brands and categories with NULL created_by_user_id
    These are hardcoded data from old migrations that should not exist
    """
    db = SessionLocal()
    
    try:
        print("🧹 Cleaning up hardcoded brands and categories...")
        print("-" * 60)
        
        # Count existing data
        total_brands = db.query(Brand).count()
        total_categories = db.query(Category).count()
        
        print(f"📊 Current state:")
        print(f"   Total brands: {total_brands}")
        print(f"   Total categories: {total_categories}")
        
        # Find hardcoded brands (NULL created_by_user_id)
        hardcoded_brands = db.query(Brand).filter(Brand.created_by_user_id == None).all()
        hardcoded_categories = db.query(Category).filter(Category.created_by_user_id == None).all()
        
        print(f"\n🔍 Found hardcoded data:")
        print(f"   Hardcoded brands: {len(hardcoded_brands)}")
        for brand in hardcoded_brands:
            print(f"      - {brand.name}")
        
        print(f"   Hardcoded categories: {len(hardcoded_categories)}")
        for cat in hardcoded_categories:
            print(f"      - {cat.name}")
        
        if len(hardcoded_brands) == 0 and len(hardcoded_categories) == 0:
            print("\n✅ No hardcoded data found. Database is clean!")
            return
        
        # Confirm deletion
        print(f"\n⚠️  WARNING: This will delete {len(hardcoded_brands)} brands and {len(hardcoded_categories)} categories")
        print("   Phones and products referencing these will have their foreign keys cleared.")
        
        response = input("\n❓ Proceed with cleanup? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Cleanup cancelled.")
            return
        
        # Clear foreign key references first
        print("\n🔄 Clearing foreign key references...")
        
        # Get IDs to clear
        brand_ids = [b.id for b in hardcoded_brands]
        category_ids = [c.id for c in hardcoded_categories]
        
        # Clear brand references from phones
        if brand_ids:
            phones_updated = db.query(Phone).filter(Phone.brand_id.in_(brand_ids)).update(
                {Phone.brand_id: None},
                synchronize_session=False
            )
            print(f"   ✓ Cleared brand_id from {phones_updated} phones")
        
        # Clear category references from phones
        if category_ids:
            phones_updated = db.query(Phone).filter(Phone.category_id.in_(category_ids)).update(
                {Phone.category_id: None},
                synchronize_session=False
            )
            print(f"   ✓ Cleared category_id from {phones_updated} phones")
        
        # Note: Products have NOT NULL constraint on category_id, so we delete products instead
        if category_ids:
            products_to_delete = db.query(Product).filter(Product.category_id.in_(category_ids)).count()
            if products_to_delete > 0:
                print(f"   ⚠️  Found {products_to_delete} products with hardcoded categories")
                delete_products = input("   ❓ Delete these products? (yes/no): ")
                if delete_products.lower() == 'yes':
                    db.query(Product).filter(Product.category_id.in_(category_ids)).delete(synchronize_session=False)
                    print(f"   ✓ Deleted {products_to_delete} products")
                else:
                    print("   ❌ Cannot proceed - products still reference hardcoded categories")
                    return
        
        # Delete hardcoded brands
        print("\n🗑️  Deleting hardcoded data...")
        if hardcoded_brands:
            for brand in hardcoded_brands:
                db.delete(brand)
            print(f"   ✓ Deleted {len(hardcoded_brands)} hardcoded brands")
        
        # Delete hardcoded categories
        if hardcoded_categories:
            for cat in hardcoded_categories:
                db.delete(cat)
            print(f"   ✓ Deleted {len(hardcoded_categories)} hardcoded categories")
        
        # Commit changes
        db.commit()
        
        # Final count
        remaining_brands = db.query(Brand).count()
        remaining_categories = db.query(Category).count()
        
        print(f"\n✅ Cleanup completed successfully!")
        print(f"📊 Final state:")
        print(f"   Remaining brands: {remaining_brands}")
        print(f"   Remaining categories: {remaining_categories}")
        print(f"\n💡 All remaining brands/categories were created by users.")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during cleanup: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("  HARDCODED DATA CLEANUP UTILITY")
    print("  Removes auto-generated brands and categories")
    print("=" * 60)
    cleanup_hardcoded_data()

