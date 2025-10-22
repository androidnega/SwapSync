#!/usr/bin/env python3
"""
Script to run repair items company isolation migration via API
This script calls the deployed API to run the migration
"""

import requests
import json
import sys

def run_migration_via_api():
    """Run the repair items migration via API call"""
    
    # API endpoint - update this to match your deployed URL
    api_base_url = "https://swapsync.digitstec.store/api"
    migration_endpoint = f"{api_base_url}/migration/repair-items-company-isolation"
    
    print("🔄 Running Repair Items Company Isolation Migration via API...")
    print(f"📡 API Endpoint: {migration_endpoint}")
    
    # You'll need to provide admin credentials
    # For now, we'll try without authentication first
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        print("📞 Making API call...")
        response = requests.post(
            migration_endpoint,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Migration completed successfully!")
            print(f"📊 Results:")
            print(f"   Items updated: {result.get('items_updated', 0)}")
            print(f"   Total items: {result.get('total_items', 0)}")
            print(f"   Items with company isolation: {result.get('items_with_company_isolation', 0)}")
            print(f"   Migrated by: {result.get('migrated_by', 'Unknown')}")
            return True
        elif response.status_code == 403:
            print("❌ Authentication required!")
            print("🔑 You need to provide admin credentials to run this migration")
            print("💡 Try logging in as a super admin and running this from the admin panel")
            return False
        else:
            print(f"❌ Migration failed with status code: {response.status_code}")
            print(f"📝 Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {str(e)}")
        print("🌐 Make sure the API is accessible and running")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def main():
    """Main function"""
    print("=" * 70)
    print("🏢 REPAIR ITEMS COMPANY ISOLATION MIGRATION (API)")
    print("=" * 70)
    
    success = run_migration_via_api()
    
    print("=" * 70)
    if success:
        print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        print("✅ Repair items now have company isolation")
        print("✅ Each company will only see their own repair items")
        print("✅ Repair items profit calculations will work correctly")
    else:
        print("❌ MIGRATION FAILED!")
        print("💡 Alternative approaches:")
        print("   1. Log in as super admin and run migration from admin panel")
        print("   2. Run the migration directly on the server")
        print("   3. Contact system administrator")
    print("=" * 70)
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
