"""
Create test users for SwapSync
Run this script to create shop keeper and repairer accounts
"""
import requests

API_URL = "http://127.0.0.1:8000/api"

# First login as admin to get token
print("🔐 Logging in as admin...")
login_response = requests.post(
    f"{API_URL}/auth/login-json",
    json={"username": "admin", "password": "admin123"}
)

if login_response.status_code != 200:
    print("❌ Failed to login as admin")
    print(f"Error: {login_response.json()}")
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("✅ Logged in successfully!\n")

# Create Shop Keeper
print("👤 Creating Shop Keeper...")
shop_keeper = {
    "username": "keeper",
    "email": "keeper@swapsync.local",
    "full_name": "Shop Keeper",
    "password": "keeper123",
    "role": "shop_keeper"
}

keeper_response = requests.post(
    f"{API_URL}/auth/register",
    json=shop_keeper,
    headers=headers
)

if keeper_response.status_code == 201:
    print("✅ Shop Keeper created successfully!")
    print(f"   Username: keeper")
    print(f"   Password: keeper123")
    print(f"   Role: shop_keeper\n")
else:
    print(f"⚠️ Shop Keeper creation: {keeper_response.json().get('detail', 'Unknown error')}\n")

# Create Repairer
print("🔧 Creating Repairer...")
repairer = {
    "username": "repairer",
    "email": "repairer@swapsync.local",
    "full_name": "Repair Technician",
    "password": "repair123",
    "role": "repairer"
}

repairer_response = requests.post(
    f"{API_URL}/auth/register",
    json=repairer,
    headers=headers
)

if repairer_response.status_code == 201:
    print("✅ Repairer created successfully!")
    print(f"   Username: repairer")
    print(f"   Password: repair123")
    print(f"   Role: repairer\n")
else:
    print(f"⚠️ Repairer creation: {repairer_response.json().get('detail', 'Unknown error')}\n")

# List all users
print("📋 All users in the system:")
print("-" * 60)

users_response = requests.get(f"{API_URL}/auth/users", headers=headers)
if users_response.status_code == 200:
    users = users_response.json()
    for user in users:
        print(f"👤 {user['full_name']}")
        print(f"   Username: {user['username']}")
        print(f"   Email: {user['email']}")
        print(f"   Role: {user['role']}")
        print(f"   Status: {'Active' if user['is_active'] else 'Inactive'}")
        print()
else:
    print("❌ Failed to list users")

print("=" * 60)
print("✅ Test users setup complete!")
print("\nYou can now login with:")
print("  Admin:       admin / admin123")
print("  Shop Keeper: keeper / keeper123")
print("  Repairer:    repairer / repair123")
print("=" * 60)

