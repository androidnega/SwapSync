"""
Create a test CEO user directly in the database
Run this with: python create_ceo_test_user.py
"""
import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db
from app.models.user import User, UserRole

def create_ceo_user():
    """Create a test CEO user"""
    
    # Initialize database
    print("📊 Initializing database...")
    init_db()
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Check if CEO already exists
        existing_ceo = db.query(User).filter(User.username == "ceo1").first()
        
        if existing_ceo:
            print("❌ CEO user 'ceo1' already exists!")
            return
        
        # Get the admin user who will be the parent
        admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
        
        if not admin_user:
            print("❌ Admin user not found! Create admin first.")
            return
        
        print(f"\n👑 Creating CEO user...")
        print(f"   Parent: {admin_user.full_name} (ID: {admin_user.id})")
        
        # Create CEO user
        ceo_user = User(
            username="ceo1",
            email="ceo@swapsync.local",
            full_name="CEO Manager",
            hashed_password=User.hash_password("ceo123"),
            role=UserRole.CEO,
            parent_user_id=admin_user.id,  # Created by admin
            is_active=1
        )
        
        db.add(ceo_user)
        db.commit()
        db.refresh(ceo_user)
        
        print("\n✅ CEO user created successfully!")
        print("\n" + "="*60)
        print("👔 CEO CREDENTIALS:")
        print("="*60)
        print(f"Username: ceo1")
        print(f"Password: ceo123")
        print(f"Role: CEO")
        print(f"Email: ceo@swapsync.local")
        print(f"Created by: {admin_user.full_name}")
        print("="*60)
        
        print("\n✅ Test this login in your SwapSync app!")
        print("   CEO can:")
        print("   - Create Shop Keeper and Repairer accounts")
        print("   - View staff activities")
        print("   - Access all shop modules")
        print("   - View CEO Dashboard")
        
    except Exception as e:
        print(f"\n❌ Error creating CEO user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_ceo_user()

