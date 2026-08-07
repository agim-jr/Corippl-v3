# backend/app/utils/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..services import auth_service
from ..utils.jwt_handler import decode_access_token
from ..models.schemas import TokenData
from ..models.user import User
import logging

# Configure logger for this module
logger = logging.getLogger("dependencies")
logger.setLevel(logging.DEBUG)
if not logger.hasHandlers():
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        logger.warning("Token decoding failed.")
        raise credentials_exception
    username: Optional[str] = payload.get("sub")
    if username is None:
        logger.warning("Token does not contain 'sub'.")
        raise credentials_exception
    token_data = TokenData(username=username)

    # Try to get user by email first (for OAuth users), then by username
    user = auth_service.get_user_by_email(db, email=token_data.username)
    if user is None:
        user = auth_service.get_user_by_username(db, username=token_data.username)

    if user is None:
        logger.warning(f"User '{username}' not found in the database.")
        raise credentials_exception

    logger.debug(f"Retrieved user: {user.username}, is_admin: {user.is_admin}, Type: {type(user.is_admin)}")
    return user


def admin_required(current_user: User = Depends(get_current_user)):
    is_admin = current_user.is_admin
    logger.debug(f"AdminCheck - User: {current_user.username}, is_admin: {is_admin}, Type: {type(is_admin)}")

    # Updated condition to be more flexible
    if not is_admin:
        logger.warning(f"User '{current_user.username}' attempted to access admin flags without proper authorization.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource.",
        )

    logger.debug(f"User '{current_user.username}' is authorized to access admin flags.")
    return current_user

# ==================== TIER CHECKING DEPENDENCIES ====================

def require_feature(feature: str):
    """Dependency to check if user has access to a feature"""
    from ..utils.tier_limits import check_feature_access, requires_upgrade

    def feature_checker(current_user: User = Depends(get_current_user)):
        user_tier = current_user.subscription_tier

        if not check_feature_access(user_tier, feature):
            upgrade_info = requires_upgrade(user_tier, feature)
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    'error': 'Feature not available',
                    'feature': feature,
                    'current_tier': user_tier,
                    'upgrade_info': upgrade_info
                }
            )

        return current_user

    return feature_checker


def check_quota(feature: str, current_usage_getter):
    """Dependency to check if user has remaining quota"""
    from ..utils.tier_limits import get_tier_limits

    def quota_checker(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        user_tier = current_user.subscription_tier
        limits = get_tier_limits(user_tier)
        max_limit = limits.get(feature, 0)

        # Unlimited access
        if max_limit == -1:
            return current_user

        # Get current usage
        current_usage = current_usage_getter(db, current_user)

        if current_usage >= max_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    'error': 'Quota exceeded',
                    'feature': feature,
                    'current_usage': current_usage,
                    'max_limit': max_limit,
                    'upgrade_to_unlock': 'pro'
                }
            )

        return current_user

    return quota_checker


def get_user_with_limits(current_user: User = Depends(get_current_user)):
    """Enhanced dependency that includes tier limits in user object"""
    user_dict = {
        'user': current_user,
        'tier': current_user.subscription_tier,
        'limits': current_user.tier_limits,
        'is_premium': current_user.is_premium
    }
    return user_dict
