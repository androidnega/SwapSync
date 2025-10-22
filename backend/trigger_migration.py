"""
Script to trigger the phone fields migration via API
This can be run to fix the 500 error by calling the migration endpoint
"""
import requests
import os
import sys

def trigger_migration():
    """Trigger the migration via API call"""
    
    # Get API URL from environment or use default
    api_url = os.getenv('API_URL', 'https://api.digitstec.store')
    
    # You'll need to get a valid token for a manager user
    # This is a placeholder - you'll need to replace with actual token
    token = input("Enter manager token (or press Enter to skip): ").strip()
    
    if not token:
        print("❌ No token provided. Please get a manager token and run again.")
        print("You can get a token by logging in as a manager and checking the browser's network tab.")
        return False
    
    try:
        print(f"🔄 Triggering migration via API: {api_url}/api/migrations/add-phone-fields")
        
        response = requests.post(
            f"{api_url}/api/migrations/add-phone-fields",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ {data.get('message')}")
                print(f"📊 Added fields: {', '.join(data.get('added_fields', []))}")
                return True
            else:
                print(f"❌ Migration failed: {data.get('message')}")
                return False
        else:
            print(f"❌ API call failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error calling migration API: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Phone Fields Migration Trigger")
    print("=" * 40)
    print("This script will call the migration API to add phone fields to the products table.")
    print("You need a manager token to run this migration.")
    print()
    
    success = trigger_migration()
    
    if success:
        print("\n✅ Migration completed successfully!")
        print("The products API should now work correctly.")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
        sys.exit(1)
