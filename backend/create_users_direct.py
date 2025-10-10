"""
Create users directly in database (bypasses API)
"""
from app.core.database import SessionLocal, init_db
from app.models.user import User, UserRole
from datetime import datetime

# Initialize database
init_db()

# Create database session
db = SessionLocal()

try:
    # Check existing users
    existing_users = db.query(User).all()
    print(f"📊 Current users in database: {len(existing_users)}")
    for user in existing_users:
        print(f"   - {user.username} ({user.role.value})")
    
    print("\n" + "="*60)
    
    # Create Admin (if doesn't exist)
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        print("👑 Creating ADMIN...")
        admin = User(
            username="admin",
            email="admin@swapsync.local",
            full_name="System Administrator",
            hashed_password=User.hash_password("admin123"),
            role=UserRole.ADMIN,
            is_active=1,
            created_at=datetime.utcnow()
        )
        db.add(admin)
        db.commit()
        print("   ✅ Admin created: admin / admin123")
    else:
        print("   ✓ Admin already exists")
    
    # Create Shop Keeper
    keeper = db.query(User).filter(User.username == "keeper").first()
    if not keeper:
        print("\n👤 Creating SHOP KEEPER...")
        keeper = User(
            username="keeper",
            email="keeper@swapsync.local",
            full_name="Shop Keeper",
            hashed_password=User.hash_password("keeper123"),
            role=UserRole.SHOP_KEEPER,
            is_active=1,
            created_at=datetime.utcnow()
        )
        db.add(keeper)
        db.commit()
        print("   ✅ Shop Keeper created: keeper / keeper123")
    else:
        print("\n   ✓ Shop Keeper already exists")
    
    # Create Repairer
    repairer = db.query(User).filter(User.username == "repairer").first()
    if not repairer:
        print("\n🔧 Creating REPAIRER...")
        repairer = User(
            username="repairer",
            email="repairer@swapsync.local",
            full_name="Repair Technician",
            hashed_password=User.hash_password("repair123"),
            role=UserRole.REPAIRER,
            is_active=1,
            created_at=datetime.utcnow()
        )
        db.add(repairer)
        db.commit()
        print("   ✅ Repairer created: repairer / repair123")
    else:
        print("\n   ✓ Repairer already exists")
    
    # List all users
    print("\n" + "="*60)
    print("📋 All Users in System:")
    print("="*60)
    
    all_users = db.query(User).all()
    for user in all_users:
        print(f"\n👤 {user.full_name}")
        print(f"   Username: {user.username}")
        print(f"   Email:    {user.email}")
        print(f"   Role:     {user.role.value}")
        print(f"   Status:   {'✅ Active' if user.is_active else '❌ Inactive'}")
    
    print("\n" + "="*60)
    print("✅ All users created successfully!")
    print("\nYou can now login with:")
    print("  👑 Admin:       admin    / admin123")
    print("  👤 Shop Keeper: keeper   / keeper123")
    print("  🔧 Repairer:    repairer / repair123")
    print("="*60)

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

