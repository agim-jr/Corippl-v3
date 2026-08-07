# backend/app/api/auth.py

"""
Auth API endpoints for user registration, login, and password management.

Required templates in backend/app/templates/:
- email_verification.html (for email verification emails)
- password_reset.html (for password reset emails)
"""
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.schemas import (
    UserCreate, UserResponse, Token, UserRegisterResponse,
    PasswordResetRequest, PasswordReset, PasswordUpdate, GoogleLoginRequest
)
from ..services import auth_service
from fastapi.security import OAuth2PasswordRequestForm
from ..utils.email import send_email, EmailSchema
from ..config import settings
from ..models.user import User
from fastapi.templating import Jinja2Templates
from ..utils.dependencies import get_current_user
from datetime import timedelta, datetime  # ✅ ADDED datetime
from ..utils.jwt_handler import create_access_token  # ✅ MOVED HERE

# Google OAuth imports
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import secrets
from ..utils.security import hash_password

# Rate limiting and logging
import logging
from slowapi.util import get_remote_address
# from ..utils.rate_limiter import limiter

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# Configure Logger
auth_logger = logging.getLogger("auth")
auth_logger.setLevel(logging.DEBUG)

# Get absolute path to templates directory
template_dir = Path(__file__).parent.parent / "templates"
templates = Jinja2Templates(directory=str(template_dir))

# Debug logging
auth_logger.info(f"📁 Templates directory: {template_dir}")
auth_logger.info(f"📁 Directory exists: {template_dir.exists()}")
if template_dir.exists():
    auth_logger.info(f"📄 Template files: {list(template_dir.glob('*.html'))}")


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
# # @limiter.limit("100/hour")
# # @limiter.limit("500/day")
def register(
    # request: Request,
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    auth_logger.debug(f"Register attempt for username: {user.username}")

    # Check if username already exists
    existing_user = auth_service.get_user_by_username(db, user.username)
    if existing_user:
        auth_logger.warning(f"Registration failed: Username '{user.username}' already taken.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken."
        )

    # Check if email already exists
    existing_email = auth_service.get_user_by_email(db, user.email)
    if existing_email:
        auth_logger.warning(f"Registration failed: Email '{user.email}' already registered.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )

    # Create new user
    new_user = auth_service.create_user(db, user)
    auth_logger.info(f"User '{user.username}' registered successfully.")

    # Generate verification token
    verification_token = auth_service.create_email_verification_token(db, new_user)

    # Send verification email
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"

    # ✅ ADDED error handling for template
    try:
        html_content = templates.get_template('email_verification.html').render(
            username=new_user.username,
            verification_link=verification_link,
            base_url=settings.FRONTEND_URL
        )
    except Exception as e:
        auth_logger.error(f"Failed to render email template: {e}")
        return {
            "message": "Account created successfully! Verification email will be sent shortly.",
            "email": new_user.email,
            "username": new_user.username
        }

    email = EmailSchema(
        email=[new_user.email],
        subject="🎉 Verify Your Email - Welcome to Corippl!",
        body=html_content
    )

    background_tasks.add_task(send_email, email)
    auth_logger.info(f"Verification email queued for: {new_user.email}")

    return {
        "message": "Account created successfully! Please check your email to verify your account.",
        "email": new_user.email,
        "username": new_user.username
    }


@router.post("/login", response_model=UserRegisterResponse)
# @limiter.limit("50/minute")
# @limiter.limit("500/hour")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    auth_logger.debug(f"Login attempt for username: {form_data.username}")

    # ✅ DEFINE access_token_expires FIRST
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # ✅ NOW you can use it in logs
    auth_logger.info(f"🔍 ACCESS_TOKEN_EXPIRE_MINUTES from settings: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
    auth_logger.info(f"🔍 Token will expire in {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")

    # Get user first to check verification status
    user = auth_service.get_user_by_username(db, form_data.username)

    if not user:
        auth_logger.warning(f"Login failed: User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if email is verified
    if not user.email_verified:
        auth_logger.warning(f"Login blocked: Email not verified for {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for the verification link."
        )

    # Now authenticate
    auth_response = auth_service.authenticate_user(db, form_data.username, form_data.password)

    if not auth_response:
        auth_logger.warning(f"Login failed for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Increment login count
    user.login_count = (user.login_count or 0) + 1
    user.last_active = datetime.utcnow()
    db.commit()

    auth_logger.info(f"User '{form_data.username}' logged in successfully.")

    return UserRegisterResponse(
        access_token=auth_response["access_token"],
        token_type=auth_response["token_type"],
        user=UserResponse.from_orm(user)
    )


@router.get("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify email with token from email link"""
    auth_logger.debug("Email verification attempt received")  # ✅ REMOVED token from log

    user = auth_service.verify_email_token(db, token)

    if not user:
        auth_logger.warning("Invalid or expired verification token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link. Please request a new one."
        )

    auth_logger.info(f"Email verified successfully for user: {user.username}")

    # Generate access token for auto-login after verification
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

    return {
        "message": "Email verified successfully!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
# @limiter.limit("2/hour")
async def resend_verification(
    request: Request,
    email_request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Resend verification email"""
    auth_logger.debug(f"Resend verification requested for: {email_request.email}")

    result = auth_service.resend_verification_email(db, email_request.email)

    # ✅ FIXED: Consistent security message
    standard_message = "If an unverified account exists with that email, a verification link has been sent."

    if result == "already_verified":
        auth_logger.info(f"Resend verification attempted for already verified email: {email_request.email}")
        return {"message": standard_message}

    if result:
        user = auth_service.get_user_by_email(db, email_request.email)
        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={result}"

        try:
            html_content = templates.get_template('email_verification.html').render(
                username=user.username,
                verification_link=verification_link,
                base_url=settings.FRONTEND_URL
            )
        except Exception as e:
            auth_logger.error(f"Failed to render email template: {e}")
            return {"message": standard_message}

        email = EmailSchema(
            email=[email_request.email],
            subject="🎉 Verify Your Email - Welcome to Corippl!",
            body=html_content
        )

        background_tasks.add_task(send_email, email)
        auth_logger.info(f"Verification email resent to: {email_request.email}")

    return {"message": standard_message}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
# @limiter.limit("3/hour")
# @limiter.limit("10/day")
async def forgot_password(
    request: Request,
    password_reset: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    client_ip = get_remote_address(request)
    auth_logger.debug(f"Password reset requested for email: {password_reset.email} from IP: {client_ip}")

    token = auth_service.create_reset_password_token(db, password_reset.email)
    if not token:
        auth_logger.debug(f"Password reset requested for non-existent email: {password_reset.email}")
        return {"message": "If an account with that email exists, a password reset link has been sent."}

    user = auth_service.get_user_by_email(db, password_reset.email)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    try:
        html_content = templates.get_template('password_reset.html').render(
            username=user.username if user else "there",
            reset_link=reset_link,
            base_url=settings.FRONTEND_URL
        )
    except Exception as e:
        auth_logger.error(f"Failed to render password reset template: {e}")
        return {"message": "If an account with that email exists, a password reset link has been sent."}

    email = EmailSchema(
        email=[password_reset.email],
        subject="🔐 Password Reset Request - Corippl",
        body=html_content
    )
    background_tasks.add_task(send_email, email)
    auth_logger.info(f"Password reset email queued for: {password_reset.email}")

    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(password_reset: PasswordReset, db: Session = Depends(get_db)):
    auth_logger.debug("Password reset attempt received")  # ✅ REMOVED token from log

    user = auth_service.verify_reset_password_token(db, password_reset.token)
    if not user:
        auth_logger.warning("Invalid or expired password reset token attempted")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )

    auth_service.reset_user_password(db, user, password_reset.new_password)
    auth_logger.info(f"Password reset successfully for user ID: {user.id}")

    return {"message": "Password has been reset successfully."}


@router.post("/update-password", status_code=status.HTTP_200_OK)
def update_password(
    password_update: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    auth_logger.debug(f"Password update attempt for user ID: {current_user.id}")

    success = auth_service.update_user_password(
        db, current_user, password_update.current_password, password_update.new_password
    )

    if not success:
        auth_logger.warning(f"Password update failed due to incorrect current password for user ID: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    auth_logger.info(f"Password updated successfully for user ID: {current_user.id}")
    return {"message": "Password updated successfully."}



@router.post("/google/login", response_model=UserRegisterResponse)
# @limiter.limit("10/minute")
async def google_login(
    request: Request,
    google_auth: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """Google OAuth Login Endpoint"""
    try:
        auth_logger.debug("Google login attempt received")  # ✅ REMOVED token from log

        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            google_auth.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )

        # Verify issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            auth_logger.error(f"Invalid issuer: {idinfo['iss']}")
            raise ValueError('Invalid token issuer')

        # Extract user info
        email = idinfo.get('email')
        google_id = idinfo.get('sub')
        email_verified = idinfo.get('email_verified', False)

        if not email:
            auth_logger.error("No email in Google token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )

        auth_logger.info(f"Google token verified for email: {email}")

        # Check if user exists by Google ID
        user = db.query(User).filter(User.google_id == google_id).first()

        if not user:
            # Check if user exists by email
            user = db.query(User).filter(User.email == email).first()

            if user:
                # Link Google account to existing user
                auth_logger.info(f"Linking Google account to existing user: {email}")
                user.google_id = google_id
                user.oauth_provider = 'google'
                user.oauth_id = google_id
                if email_verified:
                    user.email_verified = True
            else:
                # Create new user
                auth_logger.info(f"Creating new user from Google login: {email}")

                # Generate unique username from email
                base_username = email.split('@')[0]
                username = base_username
                counter = 1

                while db.query(User).filter(User.username == username).first():
                    username = f"{base_username}{counter}"
                    counter += 1

                # Create user with random password
                random_password = secrets.token_urlsafe(32)

                user = User(
                    username=username,
                    email=email,
                    password=hash_password(random_password),
                    google_id=google_id,
                    oauth_provider='google',
                    oauth_id=google_id,
                    email_verified=email_verified
                )
                db.add(user)

            db.commit()
            db.refresh(user)

        # Update last active
        user.last_active = datetime.utcnow()  # ✅ REMOVED redundant import
        db.commit()

        # Generate access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(  # ✅ REMOVED redundant import
            data={
                "sub": user.username,
                "user_id": user.id,
                "is_premium": user.is_premium,
                "is_admin": user.is_admin
            },
            expires_delta=access_token_expires
        )

        auth_logger.info(f"User '{user.username}' logged in via Google OAuth successfully")

        return UserRegisterResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.from_orm(user)
        )

    except ValueError as e:
        auth_logger.error(f"Invalid Google token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        auth_logger.error(f"Google OAuth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    auth_logger.debug(f"Fetching profile for user ID: {current_user.id}")
    return UserResponse.from_orm(current_user)

@router.get("/me/tier-info")
def get_user_tier_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's tier information and limits"""
    from ..utils.tier_limits import get_tier_limits
    from ..models.pool_submission import PoolSubmission
    from ..models.collective import CollectiveMembership

    tier = current_user.subscription_tier
    limits = get_tier_limits(tier)

    # Calculate current usage
    active_submissions = db.query(PoolSubmission).filter(
        PoolSubmission.user_id == current_user.id,
        PoolSubmission.status.in_(['pending', 'approved'])
    ).count()

    groups_joined = db.query(CollectiveMembership).filter(
        CollectiveMembership.user_id == current_user.id
    ).count()

    return {
        "user": UserResponse.from_orm(current_user),
        "tier": {
            "name": tier,
            "display_name": "Pro" if tier == "pro" else "Explorer",
            "is_premium": current_user.is_premium
        },
        "limits": limits,
        "usage": {
            "active_submissions": active_submissions,
            "groups_joined": groups_joined,
            "daily_queue_views": 0  # TODO: Implement queue view tracking
        }
    }
