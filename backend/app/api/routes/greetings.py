"""
API Routes for Ghanaian/Twi Greeting System
Provides endpoints for fetching culturally relevant greetings
"""

from fastapi import APIRouter, Depends
from typing import Optional
from app.core.ghanaian_greetings import GhanaianGreetingService
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/greetings", tags=["Greetings"])


@router.get("/current")
async def get_current_greeting(
    current_user: User = Depends(get_current_user)
):
    """
    Get a personalized greeting for the current user based on time and role
    """
    service = GhanaianGreetingService()
    
    welcome = service.generate_dashboard_welcome(
        user_name=current_user.full_name or current_user.username,
        user_role=current_user.role,
        is_returning_user=True
    )
    
    return {
        "success": True,
        "data": welcome,
        "user": {
            "name": current_user.full_name or current_user.username,
            "role": current_user.role
        }
    }


@router.get("/login-message")
async def get_login_message(
    current_user: User = Depends(get_current_user)
):
    """
    Get a welcome message for successful login
    """
    service = GhanaianGreetingService()
    
    message = service.generate_login_success_message(
        user_name=current_user.full_name or current_user.username,
        user_role=current_user.role
    )
    
    return {
        "success": True,
        "data": message
    }


@router.get("/time-based")
async def get_time_based_greeting(
    time_of_day: Optional[str] = None
):
    """
    Get a greeting for a specific time of day
    Query params:
    - time_of_day: morning, afternoon, evening, or night (optional, defaults to current)
    """
    service = GhanaianGreetingService()
    
    if time_of_day and time_of_day not in ["morning", "afternoon", "evening", "night"]:
        return {
            "success": False,
            "error": "Invalid time_of_day. Must be: morning, afternoon, evening, or night"
        }
    
    greeting = service.get_time_based_greeting(time_of_day)
    current_time = service.get_time_of_day()
    
    return {
        "success": True,
        "data": {
            "greeting": greeting,
            "current_time_of_day": current_time,
            "requested_time": time_of_day or current_time
        }
    }


@router.get("/motivational")
async def get_motivational_phrase():
    """
    Get a random motivational phrase in Twi with English translation
    """
    service = GhanaianGreetingService()
    motivation = service.get_motivational_phrase()
    
    return {
        "success": True,
        "data": motivation
    }


@router.get("/day-motivation")
async def get_day_motivation():
    """
    Get a motivation for the current day of the week
    """
    service = GhanaianGreetingService()
    day_motivation = service.get_day_motivation()
    
    return {
        "success": True,
        "data": day_motivation
    }


@router.get("/business-phrase")
async def get_business_phrase(
    time_of_day: Optional[str] = None
):
    """
    Get a business-related phrase for the time of day
    """
    service = GhanaianGreetingService()
    
    if time_of_day and time_of_day not in ["morning", "afternoon", "evening", "night"]:
        return {
            "success": False,
            "error": "Invalid time_of_day. Must be: morning, afternoon, evening, or night"
        }
    
    business_phrase = service.get_business_phrase(time_of_day)
    
    return {
        "success": True,
        "data": business_phrase
    }


@router.get("/role-greeting")
async def get_role_greeting(
    role: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a greeting for a specific role
    Query params:
    - role: manager, ceo, shop_keeper, repairer, admin, super_admin
    """
    service = GhanaianGreetingService()
    role_greeting = service.get_role_greeting(role)
    
    return {
        "success": True,
        "data": {
            "greeting": role_greeting,
            "role": role
        }
    }


@router.get("/all")
async def get_all_greetings():
    """
    Get all available greetings (for testing/documentation purposes)
    No authentication required
    """
    service = GhanaianGreetingService()
    all_greetings = service.get_all_greetings()
    
    return {
        "success": True,
        "data": {
            "time_based_greetings": all_greetings,
            "roles": list(["manager", "ceo", "shop_keeper", "repairer", "admin", "super_admin"]),
            "contexts": ["general", "returning", "work"],
            "times": ["morning", "afternoon", "evening", "night"]
        }
    }


@router.get("/sms-format")
async def get_sms_greeting(
    current_user: User = Depends(get_current_user)
):
    """
    Get a greeting formatted for SMS (short and concise)
    """
    service = GhanaianGreetingService()
    
    sms_greeting = service.generate_sms_greeting(
        user_name=current_user.full_name or current_user.username,
        user_role=current_user.role
    )
    
    return {
        "success": True,
        "data": {
            "message": sms_greeting,
            "length": len(sms_greeting),
            "user": current_user.full_name or current_user.username
        }
    }


@router.get("/personalized")
async def get_personalized_greeting(
    name: str,
    role: str,
    context: Optional[str] = "general"
):
    """
    Get a personalized greeting for any name and role
    Query params:
    - name: User's name
    - role: User's role
    - context: general, returning, or work (optional, default: general)
    """
    if context not in ["general", "returning", "work"]:
        return {
            "success": False,
            "error": "Invalid context. Must be: general, returning, or work"
        }
    
    service = GhanaianGreetingService()
    
    welcome = service.generate_dashboard_welcome(
        user_name=name,
        user_role=role,
        is_returning_user=(context == "returning")
    )
    
    return {
        "success": True,
        "data": welcome
    }

