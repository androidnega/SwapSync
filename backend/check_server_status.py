#!/usr/bin/env python3
"""
Quick Server Status Checker
Run this to test if your Railway backend is responding
"""
import requests
import sys

def check_server_status():
    """Check if the Railway backend is responding"""
    backend_url = "https://api.digitstec.store"
    
    print("🔍 Checking Railway Backend Status...")
    print(f"🌐 Backend URL: {backend_url}")
    print("-" * 50)
    
    try:
        # Test basic connectivity
        print("1️⃣ Testing basic connectivity...")
        response = requests.get(f"{backend_url}/ping", timeout=10)
        
        if response.status_code == 200:
            print("✅ Backend is RUNNING!")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"⚠️ Backend responded but with status: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR - Backend is DOWN!")
        print("   This means your Railway backend server is not running")
        return False
        
    except requests.exceptions.Timeout:
        print("⏰ TIMEOUT - Backend is not responding")
        print("   Server might be starting up or crashed")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def check_cors():
    """Test CORS headers"""
    backend_url = "https://api.digitstec.store"
    frontend_origin = "https://swapsync.digitstec.store"
    
    print("\n2️⃣ Testing CORS headers...")
    
    try:
        # Test OPTIONS request (preflight)
        headers = {
            'Origin': frontend_origin,
            'Access-Control-Request-Method': 'DELETE',
            'Access-Control-Request-Headers': 'Authorization, Content-Type'
        }
        
        response = requests.options(f"{backend_url}/api/staff/delete/1", headers=headers, timeout=10)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print("✅ CORS Headers Found:")
        for header, value in cors_headers.items():
            if value:
                print(f"   {header}: {value}")
            else:
                print(f"   {header}: ❌ MISSING")
        
        return True
        
    except Exception as e:
        print(f"❌ CORS Test Failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 SwapSync Backend Status Checker")
    print("=" * 50)
    
    # Check if server is running
    server_ok = check_server_status()
    
    if server_ok:
        # Check CORS if server is running
        cors_ok = check_cors()
        
        if cors_ok:
            print("\n🎉 SUCCESS! Backend is working correctly!")
            print("   If you're still getting CORS errors:")
            print("   1. Clear browser cache (Ctrl+Shift+R)")
            print("   2. Try incognito mode")
            print("   3. Check browser console for other errors")
        else:
            print("\n⚠️ Server is running but CORS might have issues")
    else:
        print("\n🚨 ACTION REQUIRED:")
        print("   1. Go to https://railway.app")
        print("   2. Login and find your SwapSync project")
        print("   3. Click on the Backend service")
        print("   4. Click the '⋮' menu → 'Restart'")
        print("   5. Wait 2-3 minutes for restart")
        print("   6. Run this script again to verify")
        
    print("\n" + "=" * 50)
