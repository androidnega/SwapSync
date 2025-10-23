"""
Caching middleware for performance optimization
"""
from functools import wraps
from typing import Optional, Any
import hashlib
import json
from datetime import datetime, timedelta

# Simple in-memory cache
_cache = {}
_cache_timestamps = {}

def cache_response(ttl_seconds: int = 300):
    """
    Decorator to cache function responses
    
    Args:
        ttl_seconds: Time to live in seconds (default: 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}_{hash(str(args))}_{hash(str(kwargs))}"
            
            # Check if cached and not expired
            if cache_key in _cache:
                timestamp = _cache_timestamps.get(cache_key)
                if timestamp and (datetime.now() - timestamp).total_seconds() < ttl_seconds:
                    return _cache[cache_key]
            
            # Call function and cache result
            result = func(*args, **kwargs)
            _cache[cache_key] = result
            _cache_timestamps[cache_key] = datetime.now()
            
            return result
        return wrapper
    return decorator

def invalidate_cache(pattern: Optional[str] = None):
    """
    Invalidate cache entries matching a pattern
    
    Args:
        pattern: If provided, only invalidate keys containing this pattern
                 If None, clear entire cache
    """
    global _cache, _cache_timestamps
    
    if pattern is None:
        _cache.clear()
        _cache_timestamps.clear()
    else:
        keys_to_remove = [k for k in _cache.keys() if pattern in k]
        for key in keys_to_remove:
            _cache.pop(key, None)
            _cache_timestamps.pop(key, None)

def get_cache_stats():
    """Get cache statistics"""
    return {
        "total_entries": len(_cache),
        "cache_size_bytes": sum(len(str(v)) for v in _cache.values()),
        "oldest_entry": min(_cache_timestamps.values()) if _cache_timestamps else None,
        "newest_entry": max(_cache_timestamps.values()) if _cache_timestamps else None
    }

