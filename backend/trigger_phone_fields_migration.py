"""
Script to trigger the phone fields migration via API
This will add missing columns to the products table on Railway
"""
import requests
import os
import sys

def trigger_migration():
    """Trigger the migration via API endpoint"""
    
    # Railway API URL
    api_url = "https://api.digitstec.store/api/migrations/add-phone-fields"
    
    # You need to provide authentication
    print("🔐 Please provide authentication credentials:")
    username = input("Username (manager/admin): ").strip()
    password = input("Password: ").strip()
    
    if not username or not password:
        print("❌ Username and password are required!")
        return False
    
    # First, login to get token
    login_url = "https://api.digitstec.store/api/auth/login"
    print(f"\n🔄 Logging in to {login_url}...")
    
    try:
        login_response = requests.post(
            login_url,
            data={
                "username": username,
                "password": password
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return False
        
        token_data = login_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            print("❌ Failed to get access token")
            return False
        
        print("✅ Login successful!")
        
        # Now trigger the migration
        print(f"\n🔄 Triggering migration at {api_url}...")
        
        migration_response = requests.post(
            api_url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
        )
        
        if migration_response.status_code == 200:
            result = migration_response.json()
            print("\n✅ Migration completed successfully!")
            print(f"📊 Added fields: {result.get('added_fields', [])}")
            print(f"📊 Existing fields: {result.get('existing_fields', [])}")
            print(f"📊 Total products: {result.get('total_products', 0)}")
            print(f"\n{result.get('message', '')}")
            return True
        else:
            print(f"\n❌ Migration failed!")
            print(f"Status code: {migration_response.status_code}")
            print(f"Response: {migration_response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("SwapSync - Phone Fields Migration Trigger")
    print("=" * 60)
    print("\nThis script will add missing phone fields to the products table")
    print("on your Railway PostgreSQL database.\n")
    
    success = trigger_migration()
    
    if success:
        print("\n✅ All done! Your dashboard should now work correctly.")
        print("Please refresh your frontend application.")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)

