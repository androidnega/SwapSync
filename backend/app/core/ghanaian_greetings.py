"""
Ghanaian/Twi Greeting System - Backend Module
Provides culturally relevant greetings for SMS, email, and API responses
"""

from datetime import datetime
import random
from typing import Dict, List, Literal

# Type definitions
TimeOfDay = Literal["morning", "afternoon", "evening", "night"]
GreetingContext = Literal["general", "returning", "work"]


class Greeting:
    """Represents a greeting with Twi and English translations"""
    def __init__(self, twi: str, english: str, emoji: str):
        self.twi = twi
        self.english = english
        self.emoji = emoji
    
    def to_dict(self) -> Dict[str, str]:
        return {
            "twi": self.twi,
            "english": self.english,
            "emoji": self.emoji
        }


# Time-based greetings
GREETINGS = {
    "morning": [
        Greeting("Maakye", "Good morning", "🌅"),
        Greeting("Mema wo akye", "I greet you this morning", "☀️"),
        Greeting("Ɛte sɛn? Maakye", "How is it? Good morning", "🌄"),
    ],
    "afternoon": [
        Greeting("Maaha", "Good afternoon", "☀️"),
        Greeting("Mema wo aha", "I greet you this afternoon", "🌞"),
        Greeting("Ɛte sɛn? Maaha", "How is it? Good afternoon", "☀️"),
    ],
    "evening": [
        Greeting("Maadwo", "Good evening", "🌆"),
        Greeting("Mema wo adwo", "I greet you this evening", "🌇"),
        Greeting("Ɛte sɛn? Maadwo", "How is it? Good evening", "🌃"),
    ],
    "night": [
        Greeting("Da yie", "Good night / Sleep well", "🌙"),
        Greeting("Me kra wo da yie", "I wish you goodnight", "✨"),
        Greeting("Ɔdɛɛfo da yie", "Beloved one, sleep well", "🌟"),
    ],
}

# Welcome messages
WELCOME_MESSAGES = {
    "general": [
        "Akwaaba! Yɛn ani agye sɛ woaba",  # Welcome! We are happy you came
        "Woaba nti yɛn ani agye",  # We are happy because you came
        "Yɛma wo akwaaba",  # We welcome you
        "Yɛn koma mu agye akwaaba",  # You are heartily welcomed
    ],
    "returning": [
        "Yɛn ani agye sɛ woaba bio",  # We are happy you came again
        "Woasan aba, yɛda wo ase",  # You returned, we thank you
        "Akwaaba bio!",  # Welcome again!
        "Woaba bio! Yɛn ani agye",  # You came again! We are happy
    ],
    "work": [
        "Ɛnnɛ nso, yɛnkɔ adwuma!",  # Today too, let's go to work!
        "Ɔbra pa!",  # Good work!
        "Mema wo adwuma pa ho ahoɔden",  # I give you strength for good work
        "Nyame nhyira wo adwuma",  # God bless your work
    ],
}

# Motivational phrases
MOTIVATIONAL_PHRASES = [
    {"twi": "Wobɛyɛ yie!", "english": "You will do well!"},
    {"twi": "Hwɛ wo ho yie", "english": "Take care of yourself"},
    {"twi": "Nyame ne wo ho", "english": "God is with you"},
    {"twi": "Kɔ so!", "english": "Keep going!"},
    {"twi": "Di nkonim", "english": "Be victorious"},
    {"twi": "Ɛbɛyɛ yie", "english": "It will be well"},
    {"twi": "Gye wo ho di", "english": "Believe in yourself"},
    {"twi": "Nya anigye", "english": "Have joy"},
]

# Role-specific greetings
ROLE_GREETINGS = {
    "manager": [
        "Wura, akwaaba!",  # Boss, welcome!
        "Sahene, yɛma wo akwaaba",  # Leader, we welcome you
        "Kannifo, da yie",  # Leader, good day
    ],
    "ceo": [
        "Sahene, akwaaba!",  # Chief/Leader, welcome!
        "Wura kɛseɛ, yɛma wo akwaaba",  # Big boss, we welcome you
        "Otumfoɔ, da yie",  # Powerful one, good day
    ],
    "shop_keeper": [
        "Dwamaofoɔ, akwaaba!",  # Trader/Seller, welcome!
        "Aguadifoɔ, da yie",  # Businessperson, good day
        "Adwumayɛfoɔ pa, akwaaba",  # Good worker, welcome
    ],
    "repairer": [
        "Adwumayɛfoɔ, akwaaba!",  # Worker, welcome!
        "Nsamannefoɔ, da yie",  # Repairer/Fixer, good day
        "Nyansafoɔ, yɛma wo akwaaba",  # Skilled one, we welcome you
    ],
    "admin": [
        "Ɔhwɛfoɔ, akwaaba!",  # Overseer, welcome!
        "Ɔkannifoɔ, da yie",  # Administrator, good day
        "Systemni ɔhwɛfoɔ, akwaaba",  # System overseer, welcome
    ],
    "super_admin": [
        "Ɔkannifoɔ kɛseɛ, akwaaba!",  # Chief administrator, welcome!
        "Systemni wura, da yie",  # System boss, good day
        "Otumfoɔ, yɛma wo akwaaba",  # Powerful one, we welcome you
    ],
}

# Business phrases by time of day
BUSINESS_PHRASES = {
    "morning": [
        {"twi": "Ɛnnɛ bɛyɛ da pa!", "english": "Today will be a good day!"},
        {"twi": "Yɛn aguade bɛkɔ yie ɛnnɛ", "english": "Our business will go well today"},
        {"twi": "Yɛnfiri aseɛ nkonimdie mu", "english": "Let's start in victory"},
    ],
    "afternoon": [
        {"twi": "Yɛn adwuma rekɔ so yie", "english": "Our work is going well"},
        {"twi": "Yɛnkɔ so", "english": "Let's continue"},
        {"twi": "Awia yi yɛ yi bɛkɔ yie", "english": "This afternoon will go well"},
    ],
    "evening": [
        {"twi": "Yɛayɛ adwuma pa ɛnnɛ", "english": "We've done good work today"},
        {"twi": "Yɛda Nyame ase", "english": "We thank God"},
        {"twi": "Ɛnnɛ kɔɔ yie", "english": "Today went well"},
    ],
    "night": [
        {"twi": "Yɛn wiase yɛ", "english": "We are done"},
        {"twi": "Ɛnnɛ adwuma aba nʼawieeɛ", "english": "Today's work has ended"},
        {"twi": "Kɔ fie na kɔhome", "english": "Go home and rest"},
    ],
}

# Day-specific motivations
DAY_MOTIVATIONS = {
    0: {"twi": "Kwasida pa!", "english": "Happy Sunday!"},
    1: {"twi": "Dwowda pa! Yɛnfiri aseɛ yie", "english": "Happy Monday! Let's start well"},
    2: {"twi": "Benada pa! Kɔ so yɛ adwuma", "english": "Happy Tuesday! Keep working"},
    3: {"twi": "Wukuda pa! Yɛn adwuma rekɔ so yie", "english": "Happy Wednesday! Our work is going well"},
    4: {"twi": "Yawda pa! Yɛrebɛn nnaawɔtwe awieeɛ", "english": "Happy Thursday! We're nearing the weekend"},
    5: {"twi": "Fida pa! Nnaawɔtwe yi aba nʼawieeɛ", "english": "Happy Friday! The week has come to an end"},
    6: {"twi": "Memeneda pa! Nya ahomegyeɛ", "english": "Happy Saturday! Enjoy your rest"},
}


class GhanaianGreetingService:
    """Service for generating Ghanaian/Twi greetings"""
    
    @staticmethod
    def get_time_of_day(hour: int = None) -> TimeOfDay:
        """Get the current time of day category"""
        if hour is None:
            hour = datetime.now().hour
        
        if 5 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        elif 17 <= hour < 21:
            return "evening"
        else:
            return "night"
    
    @staticmethod
    def get_time_based_greeting(time_of_day: TimeOfDay = None) -> Dict[str, str]:
        """Get a random greeting for the time of day"""
        if time_of_day is None:
            time_of_day = GhanaianGreetingService.get_time_of_day()
        
        greeting = random.choice(GREETINGS[time_of_day])
        return greeting.to_dict()
    
    @staticmethod
    def get_role_greeting(role: str) -> str:
        """Get a role-specific greeting"""
        role_lower = role.lower()
        if role_lower in ROLE_GREETINGS:
            return random.choice(ROLE_GREETINGS[role_lower])
        return "Akwaaba!"  # Default welcome
    
    @staticmethod
    def get_welcome_message(context: GreetingContext = "general") -> str:
        """Get a welcome message for the context"""
        return random.choice(WELCOME_MESSAGES[context])
    
    @staticmethod
    def get_motivational_phrase() -> Dict[str, str]:
        """Get a random motivational phrase"""
        return random.choice(MOTIVATIONAL_PHRASES)
    
    @staticmethod
    def get_business_phrase(time_of_day: TimeOfDay = None) -> Dict[str, str]:
        """Get a business phrase for the time of day"""
        if time_of_day is None:
            time_of_day = GhanaianGreetingService.get_time_of_day()
        
        return random.choice(BUSINESS_PHRASES[time_of_day])
    
    @staticmethod
    def get_day_motivation() -> Dict[str, str]:
        """Get motivation for the current day of week"""
        day_of_week = datetime.now().weekday()
        return DAY_MOTIVATIONS[day_of_week]
    
    @staticmethod
    def generate_dashboard_welcome(
        user_name: str,
        user_role: str,
        is_returning_user: bool = True
    ) -> Dict[str, any]:
        """Generate a complete welcome message for dashboard"""
        time_of_day = GhanaianGreetingService.get_time_of_day()
        greeting = GhanaianGreetingService.get_time_based_greeting(time_of_day)
        
        # Determine context
        context: GreetingContext = "returning" if is_returning_user else "general"
        if time_of_day in ["morning", "afternoon"]:
            context = "work"
        
        role_greeting = GhanaianGreetingService.get_role_greeting(user_role)
        welcome_msg = GhanaianGreetingService.get_welcome_message(context)
        motivation = GhanaianGreetingService.get_motivational_phrase()
        
        message = f"{role_greeting} {user_name}! {welcome_msg}. {motivation['twi']}"
        
        return {
            "greeting": greeting,
            "message": message,
            "time_of_day": time_of_day,
            "motivation": motivation,
            "day_motivation": GhanaianGreetingService.get_day_motivation(),
            "business_phrase": GhanaianGreetingService.get_business_phrase(time_of_day),
        }
    
    @staticmethod
    def generate_login_success_message(user_name: str, user_role: str) -> Dict[str, str]:
        """Generate a login success message"""
        greeting = GhanaianGreetingService.get_time_based_greeting()
        role_greeting = GhanaianGreetingService.get_role_greeting(user_role)
        welcome_msg = GhanaianGreetingService.get_welcome_message("general")
        
        return {
            "title": f"{greeting['twi']}, {user_name}!",
            "subtitle": f"{welcome_msg} ({greeting['english']})",
            "emoji": greeting["emoji"],
        }
    
    @staticmethod
    def generate_sms_greeting(user_name: str, user_role: str = None) -> str:
        """Generate a greeting suitable for SMS (short and sweet)"""
        greeting = GhanaianGreetingService.get_time_based_greeting()
        
        if user_role:
            role_greeting = GhanaianGreetingService.get_role_greeting(user_role)
            return f"{greeting['twi']} {user_name}! {role_greeting}"
        
        return f"{greeting['twi']} {user_name}! Akwaaba"
    
    @staticmethod
    def get_all_greetings() -> Dict[str, List[Dict[str, str]]]:
        """Get all available greetings (for testing/documentation)"""
        result = {}
        for time, greetings in GREETINGS.items():
            result[time] = [g.to_dict() for g in greetings]
        return result


# Convenience functions
def get_greeting_for_user(user_name: str, user_role: str) -> Dict[str, any]:
    """Get a complete greeting package for a user"""
    return GhanaianGreetingService.generate_dashboard_welcome(user_name, user_role)


def get_sms_greeting(user_name: str, user_role: str = None) -> str:
    """Get an SMS-friendly greeting"""
    return GhanaianGreetingService.generate_sms_greeting(user_name, user_role)


# Example usage
if __name__ == "__main__":
    # Test the greeting system
    service = GhanaianGreetingService()
    
    print("=== Ghanaian Greeting System Test ===\n")
    
    # Test time of day
    print(f"Current time of day: {service.get_time_of_day()}")
    print(f"Current greeting: {service.get_time_based_greeting()}\n")
    
    # Test role greetings
    print("Role Greetings:")
    for role in ["manager", "shop_keeper", "repairer"]:
        print(f"  {role}: {service.get_role_greeting(role)}")
    print()
    
    # Test complete welcome
    print("Complete Welcome Message:")
    welcome = service.generate_dashboard_welcome("Kwame Mensah", "shop_keeper")
    print(f"  Message: {welcome['message']}")
    print(f"  Time: {welcome['time_of_day']}")
    print(f"  Greeting: {welcome['greeting']}")
    print()
    
    # Test SMS greeting
    print("SMS Greeting:")
    print(f"  {service.generate_sms_greeting('Kwame', 'manager')}")

