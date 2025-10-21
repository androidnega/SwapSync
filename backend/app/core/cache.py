"""
Simple in-memory caching for Railway $5 plan optimization
Reduces database queries for frequently accessed data like dashboard stats
"""
from functools import lru_cache, wraps
from datetime import datetime, timedelta
from typing import Callable, Any, Optional
import hashlib
import json

# Simple time-based cache storage
_cache_store = {}


def timed_cache(seconds: int = 300):
    """
    Decorator for caching function results with expiration
    
    Usage:
        @timed_cache(seconds=300)  # Cache for 5 minutes
        def get_dashboard_stats(db):
            # expensive query
            return stats
    
    Args:
        seconds: Cache lifetime in seconds (default 5 minutes)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{_make_cache_key(args, kwargs)}"
            
            # Check if cached result exists and is not expired
            if cache_key in _cache_store:
                cached_result, expiry_time = _cache_store[cache_key]
                if datetime.utcnow() < expiry_time:
                    return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            expiry_time = datetime.utcnow() + timedelta(seconds=seconds)
            _cache_store[cache_key] = (result, expiry_time)
            
            return result
        
        # Add cache clearing method
        wrapper.clear_cache = lambda: _cache_store.clear()
        
        return wrapper
    return decorator


def _make_cache_key(args: tuple, kwargs: dict) -> str:
    """
    Create a cache key from function arguments
    Ignores database sessions and unpicklable objects
    """
    try:
        # Filter out database sessions and other unpicklable objects
        safe_args = []
        for arg in args:
            if not _is_unpicklable(arg):
                safe_args.append(str(arg))
        
        safe_kwargs = {
            k: str(v) for k, v in kwargs.items() 
            if not _is_unpicklable(v)
        }
        
        # Create hash of arguments
        key_data = json.dumps({"args": safe_args, "kwargs": safe_kwargs}, sort_keys=True)
        return hashlib.md5(key_data.encode()).hexdigest()
    except:
        # If serialization fails, use timestamp (no caching)
        return str(datetime.utcnow().timestamp())


def _is_unpicklable(obj: Any) -> bool:
    """Check if object is unpicklable (like database sessions)"""
    return hasattr(obj, '__dict__') and 'session' in str(type(obj)).lower()


def clear_all_caches():
    """Clear all cached data - useful after data updates"""
    _cache_store.clear()


# Pre-configured cache decorators for common use cases
cache_5min = timed_cache(seconds=300)    # 5 minutes
cache_15min = timed_cache(seconds=900)   # 15 minutes
cache_1hour = timed_cache(seconds=3600)  # 1 hour

