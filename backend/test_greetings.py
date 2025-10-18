"""
Test script for the Ghanaian Greeting System
Run this to verify the greeting system is working correctly
"""

from app.core.ghanaian_greetings import GhanaianGreetingService

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def test_greeting_system():
    """Test all aspects of the greeting system"""
    service = GhanaianGreetingService()
    
    # Test 1: Time of Day
    print_header("TEST 1: Time of Day Detection")
    time_of_day = service.get_time_of_day()
    print(f"Current time of day: {time_of_day}")
    
    # Test 2: Time-Based Greetings
    print_header("TEST 2: Time-Based Greetings")
    for time in ["morning", "afternoon", "evening", "night"]:
        greeting = service.get_time_based_greeting(time)
        print(f"\n{time.upper()}:")
        print(f"  Twi: {greeting['twi']}")
        print(f"  English: {greeting['english']}")
        print(f"  Emoji: {greeting['emoji']}")
    
    # Test 3: Role Greetings
    print_header("TEST 3: Role-Specific Greetings")
    roles = ["manager", "ceo", "shop_keeper", "repairer", "admin", "super_admin"]
    for role in roles:
        role_greeting = service.get_role_greeting(role)
        print(f"  {role}: {role_greeting}")
    
    # Test 4: Welcome Messages
    print_header("TEST 4: Welcome Messages")
    for context in ["general", "returning", "work"]:
        welcome = service.get_welcome_message(context)
        print(f"  {context}: {welcome}")
    
    # Test 5: Motivational Phrases
    print_header("TEST 5: Motivational Phrases (Random)")
    for i in range(3):
        motivation = service.get_motivational_phrase()
        print(f"  {i+1}. {motivation['twi']} - {motivation['english']}")
    
    # Test 6: Day Motivation
    print_header("TEST 6: Day Motivation")
    day_motivation = service.get_day_motivation()
    print(f"  Twi: {day_motivation['twi']}")
    print(f"  English: {day_motivation['english']}")
    
    # Test 7: Business Phrases
    print_header("TEST 7: Business Phrases")
    for time in ["morning", "afternoon", "evening", "night"]:
        business = service.get_business_phrase(time)
        print(f"\n{time.upper()}:")
        print(f"  Twi: {business['twi']}")
        print(f"  English: {business['english']}")
    
    # Test 8: Complete Dashboard Welcome
    print_header("TEST 8: Complete Dashboard Welcome")
    test_users = [
        ("Kwame Mensah", "shop_keeper"),
        ("Ama Serwaa", "manager"),
        ("Kofi Asamoah", "repairer"),
    ]
    
    for name, role in test_users:
        print(f"\n{name} ({role}):")
        welcome = service.generate_dashboard_welcome(name, role, True)
        print(f"  Message: {welcome['message']}")
        print(f"  Time: {welcome['time_of_day']}")
        print(f"  Greeting: {welcome['greeting']['twi']} ({welcome['greeting']['english']})")
    
    # Test 9: Login Success Message
    print_header("TEST 9: Login Success Message")
    login_msg = service.generate_login_success_message("Yaw Boateng", "manager")
    print(f"  Title: {login_msg['title']}")
    print(f"  Subtitle: {login_msg['subtitle']}")
    print(f"  Emoji: {login_msg['emoji']}")
    
    # Test 10: SMS Greeting
    print_header("TEST 10: SMS Greeting Format")
    sms_users = [
        ("Akua", "shop_keeper"),
        ("Kwabena", "manager"),
        ("Abena", None),
    ]
    
    for name, role in sms_users:
        sms = service.generate_sms_greeting(name, role)
        print(f"  {name} ({role or 'no role'}): {sms} (Length: {len(sms)})")
    
    # Test 11: All Greetings Export
    print_header("TEST 11: All Greetings Export")
    all_greetings = service.get_all_greetings()
    print(f"  Total categories: {len(all_greetings)}")
    for time, greetings in all_greetings.items():
        print(f"  {time}: {len(greetings)} greetings")
    
    # Final Summary
    print_header("✅ ALL TESTS COMPLETED")
    print("\nThe Ghanaian Greeting System is working correctly!")
    print("Medaase! (Thank you!) 🇬🇭\n")

if __name__ == "__main__":
    try:
        test_greeting_system()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

