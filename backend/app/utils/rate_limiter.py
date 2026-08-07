# backend/app/utils/rate_limiter.py

from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize the Limiter with IP-based key function
# Adjusted limits: 200/hour is more reasonable than 100/minute (6000/hour)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/hour", "50/minute"]
)
