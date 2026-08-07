# backend/app/utils/validators.py
from typing import Optional  # Added import

from pydantic import BaseModel, EmailStr, validator
import re
from uuid import UUID

class WaitlistUserCreate(BaseModel):
    email: EmailStr
    referred_by: Optional[str] = None

    @validator('referred_by')
    def validate_referral_code(cls, v):
        if v:
            try:
                UUID(v, version=4)  # Ensure it's a valid UUID4
            except ValueError:
                raise ValueError('Invalid referral code format.')
        return v

class ReferralCreate(BaseModel):
    referral_email: EmailStr

class PromoCodeRedeem(BaseModel):
    code: str

    @validator('code')
    def validate_promo_code(cls, v):
        if not re.match(r'^[A-Z0-9\-]{6,20}$', v):
            raise ValueError('Invalid promo code format.')
        return v
