# backend/app/services/auth_service.py

import secrets
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.user import User
from ..models.schemas import UserCreate, Token
from ..utils.security import hash_password, verify_password
from ..utils.jwt_handler import create_access_token
from datetime import timedelta, datetime
from ..config import settings  # Added import


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_create: UserCreate) -> User:
    import logging
    auth_logger = logging.getLogger("auth")

    hashed_pw = hash_password(user_create.password)
    new_user = User(
        username=user_create.username,
        email=user_create.email,
        password=hashed_pw,
        email_verified=False
    )

    auth_logger.debug(f"🆕 Creating user with email_verified=False")

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    auth_logger.debug(f"✅ User created. email_verified={new_user.email_verified}")

    # ✅ ADD SAFETY CHECK
    if new_user.email_verified:
        auth_logger.error(f"🚨 BUG DETECTED! User {new_user.username} has email_verified=True after creation!")
        auth_logger.error(f"🔍 Database returned: {new_user.__dict__}")

    return new_user

# backend/app/services/auth_service.py - Line 26
def authenticate_user(db: Session, username: str, password: str) -> Optional[dict]:
    user = get_user_by_username(db, username)
    if not user:
        return None

    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        minutes_remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked due to too many failed login attempts. Try again in {minutes_remaining} minutes."
        )

    if not verify_password(password, user.password):
        user.failed_login_attempts += 1

        # Lock account after 5 failed attempts for 30 minutes
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=30)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account locked due to too many failed login attempts. Try again in 30 minutes or use password reset."
            )

        db.commit()
        return None

    # Reset failed attempts on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_active = datetime.utcnow()
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "is_premium": user.is_premium,
            "is_admin": user.is_admin
        },
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# backend/app/services/auth_service.py - Line 42
def create_reset_password_token(db: Session, email: str) -> Optional[str]:
    user = get_user_by_email(db, email)
    if not user:
        return None

    # Invalidate any existing tokens
    user.reset_password_token = None
    user.reset_password_expire = None

    # Generate token
    token = secrets.token_urlsafe(32)

    # Hash the token before storing (like passwords)
    hashed_token = hash_password(token)
    user.reset_password_token = hashed_token
    user.reset_password_expire = datetime.utcnow() + timedelta(minutes=30)  # 30 min

    db.commit()
    return token  # Return unhashed token to send in email


# backend/app/services/auth_service.py - Line 52
def verify_reset_password_token(db: Session, token: str) -> Optional[User]:
    # Get all users with non-expired tokens
    users = db.query(User).filter(
        User.reset_password_token != None,
        User.reset_password_expire != None,
        User.reset_password_expire > datetime.utcnow()
    ).all()

    # Check token hash for each user (protects against timing attacks)
    for user in users:
        if user.reset_password_token and verify_password(token, user.reset_password_token):
            return user

    return None

# backend/app/services/auth_service.py - Line 58
def reset_user_password(db: Session, user: User, new_password: str):
    user.password = hash_password(new_password)
    user.reset_password_token = None
    user.reset_password_expire = None

    # Reset failed login attempts and unlock account
    user.failed_login_attempts = 0
    user.locked_until = None

    # Force re-login by updating last password change timestamp
    user.last_password_change = datetime.utcnow()

    db.commit()

# backend/app/services/auth_service.py - Line 63
def update_user_password(db: Session, user: User, current_password: str, new_password: str) -> bool:
    if not verify_password(current_password, user.password):
        return False

    user.password = hash_password(new_password)

    # Reset security-related fields
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_password_change = datetime.utcnow()

    db.commit()
    return True

def create_email_verification_token(db: Session, user: User) -> str:
    """Generate email verification token for new users"""
    import logging
    auth_logger = logging.getLogger("auth")

    token = secrets.token_urlsafe(32)
    hashed_token = hash_password(token)

    auth_logger.debug(f"🔑 Creating verification token for user: {user.username}")
    auth_logger.debug(f"⏰ Token expires at: {datetime.utcnow() + timedelta(hours=24)}")

    user.email_verification_token = hashed_token
    user.email_verification_expire = datetime.utcnow() + timedelta(hours=24)
    user.email_verified = False

    db.commit()

    auth_logger.info(f"✅ Verification token created for: {user.username}")
    return token

def verify_email_token(db: Session, token: str) -> Optional[User]:
    """Verify email verification token"""
    import logging
    auth_logger = logging.getLogger("auth")

    auth_logger.debug(f"🔍 Verifying email token...")
    auth_logger.debug(f"⏰ Current UTC time: {datetime.utcnow()}")

    # Get all users with non-expired tokens
    users = db.query(User).filter(
        User.email_verification_token != None,
        User.email_verification_expire != None,
        User.email_verification_expire > datetime.utcnow(),
        User.email_verified == False
    ).all()

    auth_logger.debug(f"📊 Found {len(users)} users with pending verification tokens")

    if not users:
        auth_logger.warning("❌ No pending verification tokens found in database")
        return None

    # Check token hash for each user
    for user in users:
        auth_logger.debug(f"🔐 Checking token for user: {user.username}")
        auth_logger.debug(f"⏰ Token expires at: {user.email_verification_expire}")

        if user.email_verification_token and verify_password(token, user.email_verification_token):
            auth_logger.info(f"✅ Token verified for user: {user.username}")
            user.email_verified = True
            user.email_verification_token = None
            user.email_verification_expire = None
            db.commit()
            return user
        else:
            auth_logger.debug(f"❌ Token mismatch for user: {user.username}")

    auth_logger.warning("❌ Token not found or invalid")
    return None

# ✅ ADD THIS FUNCTION AFTER verify_email_token

def resend_verification_email(db: Session, email: str) -> Optional[str]:
    """Resend verification email"""
    user = get_user_by_email(db, email)

    if not user:
        return None

    if user.email_verified:
        return "already_verified"

    # Generate new token
    token = create_email_verification_token(db, user)
    return token
