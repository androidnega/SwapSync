"""
SIMPLIFIED SMS SERVICE
Just uses Arkasel API directly - no database complexity!
Configure via environment variable: ARKASEL_API_KEY
"""
import requests
import os
import logging

logger = logging.getLogger(__name__)

# Simple config from environment
ARKASEL_API_KEY = os.getenv("ARKASEL_API_KEY", "")
ARKASEL_SENDER_ID = os.getenv("ARKASEL_SENDER_ID", "SwapSync")
ARKASEL_URL = "https://sms.arkesel.com/api/v2/sms/send"


def send_sms(phone_number: str, message: str) -> dict:
    """
    Send SMS via Arkasel API
    Simple, direct, no database needed!
    """
    if not ARKASEL_API_KEY:
        logger.warning("⚠️ ARKASEL_API_KEY not set. SMS disabled.")
        return {"success": False, "error": "API key not configured"}
    
    # Format phone number
    phone = phone_number.strip()
    if phone.startswith('0'):
        phone = '+233' + phone[1:]  # Ghana country code
    elif not phone.startswith('+'):
        phone = '+233' + phone
    
    logger.info(f"📱 Sending SMS to {phone_number} → {phone}")
    
    try:
        response = requests.post(
            ARKASEL_URL,
            headers={
                'api-key': ARKASEL_API_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'sender': ARKASEL_SENDER_ID,
                'recipients': [phone],
                'message': message
            },
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info(f"✅ SMS sent successfully to {phone}")
            return {"success": True, "provider": "arkasel"}
        else:
            logger.error(f"❌ Arkasel API error: {response.status_code} - {response.text}")
            return {"success": False, "error": f"API returned {response.status_code}"}
            
    except Exception as e:
        logger.error(f"❌ SMS send failed: {e}")
        return {"success": False, "error": str(e)}


def send_welcome_sms(username: str, password: str, phone_number: str, role: str, company_name: str = "SwapSync"):
    """Send welcome SMS when account is created"""
    
    # Role-specific welcome messages
    role_messages = {
        'manager': f"""Welcome to {company_name}!

🎯 MANAGER ACCOUNT CREATED
Username: {username}
Password: {password}

🔗 Login: https://swapsync.digitstec.store

📱 As a Manager, you can:
• Create shop keepers & repairers
• Manage your business operations
• View analytics & reports
• Access all company features

Welcome to SwapSync!

- SwapSync Team""",
        
        'shop_keeper': f"""Welcome to {company_name}!

🛍️ SHOP KEEPER ACCOUNT CREATED
Username: {username}
Password: {password}

🔗 Login: https://swapsync.digitstec.store

📱 As a Shop Keeper, you can:
• Process phone swaps & sales
• Manage customer transactions
• Handle daily operations

Welcome to SwapSync!

- SwapSync Team""",
        
        'repairer': f"""Welcome to {company_name}!

🔧 REPAIRER ACCOUNT CREATED
Username: {username}
Password: {password}

🔗 Login: https://swapsync.digitstec.store

📱 As a Repairer, you can:
• Manage repair jobs
• Update repair status
• Track repair progress

Welcome to SwapSync!

- SwapSync Team""",
        
        'ceo': f"""Welcome to {company_name}!

👑 CEO ACCOUNT CREATED
Username: {username}
Password: {password}

🔗 Login: https://swapsync.digitstec.store

📱 As a CEO, you can:
• Full business management
• Create managers & staff
• Access all system features
• View company analytics

Welcome to SwapSync!

- SwapSync Team"""
    }
    
    # Get role-specific message or default
    message = role_messages.get(role.lower(), f"""Welcome to {company_name}!

ACCOUNT CREATED
Username: {username}
Password: {password}

🔗 Login: https://swapsync.digitstec.store

Welcome to SwapSync!

- SwapSync Team""")
    
    return send_sms(phone_number, message)


# Test if configured
if ARKASEL_API_KEY:
    logger.info("✅ Simple SMS Service configured (Arkasel)")
else:
    logger.warning("⚠️ Simple SMS Service NOT configured. Set ARKASEL_API_KEY in Railway.")

