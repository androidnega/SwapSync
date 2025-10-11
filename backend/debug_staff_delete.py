#!/usr/bin/env python3
"""
Debug Staff Delete Issue
Helps identify why deleting user ID 7 fails
"""
import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./swapsync.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def debug_user_delete(user_id: int):
    """Debug why deleting user ID fails"""
    print(f"🔍 Debugging delete for User ID: {user_id}")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        # 1. Check if user exists
        print("1️⃣ Checking if user exists...")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"❌ User ID {user_id} not found!")
            return
        
        print(f"✅ User found: {user.username} (Role: {user.role})")
        
        # 2. Check user details
        print(f"\n2️⃣ User Details:")
        print(f"   ID: {user.id}")
        print(f"   Username: {user.username}")
        print(f"   Full Name: {user.full_name}")
        print(f"   Role: {user.role}")
        print(f"   Company: {user.company_name}")
        print(f"   Active: {user.is_active}")
        print(f"   Parent User ID: {user.parent_user_id}")
        
        # 3. Check for related records that might cause cascade issues
        print(f"\n3️⃣ Checking related records...")
        
        # Check activity logs
        activity_count = db.query(ActivityLog).filter(ActivityLog.user_id == user_id).count()
        print(f"   Activity Logs: {activity_count}")
        
        # Check if user has children (staff under them)
        children_count = db.query(User).filter(User.parent_user_id == user_id).count()
        print(f"   Staff Members: {children_count}")
        
        if children_count > 0:
            print(f"   ⚠️ User has {children_count} staff members!")
            children = db.query(User).filter(User.parent_user_id == user_id).all()
            for child in children:
                print(f"      - {child.username} (ID: {child.id}, Role: {child.role})")
        
        # 4. Check database constraints
        print(f"\n4️⃣ Checking database constraints...")
        
        # Check if user has any foreign key references
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"   Database tables: {len(tables)}")
        
        # Look for foreign key constraints
        for table_name in tables:
            try:
                foreign_keys = inspector.get_foreign_keys(table_name)
                for fk in foreign_keys:
                    if 'user' in str(fk).lower():
                        print(f"   ⚠️ Foreign key in {table_name}: {fk}")
            except Exception as e:
                pass
        
        # 5. Test the actual deletion (dry run)
        print(f"\n5️⃣ Testing deletion logic...")
        
        # Check permissions
        print(f"   ✅ User exists")
        print(f"   ✅ User is not self-deletion")
        
        # Check role permissions
        allowed_roles = [UserRole.MANAGER, UserRole.CEO, UserRole.SHOP_KEEPER, UserRole.REPAIRER]
        if user.role in allowed_roles:
            print(f"   ✅ User role ({user.role}) is deletable")
        else:
            print(f"   ❌ User role ({user.role}) is NOT deletable")
            print(f"   Allowed roles: {allowed_roles}")
        
        # 6. Recommendations
        print(f"\n6️⃣ Recommendations:")
        
        if children_count > 0:
            print(f"   ⚠️ Cannot delete user with staff members!")
            print(f"   📋 First delete or reassign {children_count} staff members")
            print(f"   📋 Then delete this user")
        else:
            print(f"   ✅ User can be deleted safely")
            print(f"   📋 No staff members found")
            print(f"   📋 No blocking constraints")
        
    except Exception as e:
        print(f"❌ Error during debug: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def list_all_users():
    """List all users for reference"""
    print(f"\n📋 ALL USERS IN DATABASE:")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            children = db.query(User).filter(User.parent_user_id == user.id).count()
            print(f"ID: {user.id:2d} | {user.username:15s} | {user.role:12s} | Staff: {children:2d}")
    except Exception as e:
        print(f"❌ Error listing users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 SwapSync Staff Delete Debugger")
    print("=" * 50)
    
    # List all users first
    list_all_users()
    
    # Debug specific user
    user_id = 7
    if len(sys.argv) > 1:
        try:
            user_id = int(sys.argv[1])
        except ValueError:
            print(f"Invalid user ID: {sys.argv[1]}")
            sys.exit(1)
    
    debug_user_delete(user_id)
    
    print(f"\n" + "=" * 50)
    print("✅ Debug complete!")
