from google.oauth2 import id_token
from google.auth.transport import requests
from app.config import settings
from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.jwt_handler import create_access_token
from fastapi import HTTPException, status
from datetime import datetime
import logging
from sqlalchemy.exc import IntegrityError


# Add logger
logger = logging.getLogger(__name__)

class GoogleAuthService:
    @staticmethod
    async def verify_google_token(token: str) -> dict:
        """Verify Google ID token and return user info"""
        try:
            logger.info(f"Verifying Google token...")
            logger.debug(f"Using Google Client ID: {settings.GOOGLE_CLIENT_ID[:10]}...")

            # Verify the token with clock skew tolerance
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10  # ✅ ADD THIS: Allow 10 seconds of clock skew
            )

            logger.info(f"Token verified successfully")
            logger.debug(f"ID Info: {idinfo}")

            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                logger.error(f"Wrong issuer: {idinfo['iss']}")
                raise ValueError('Wrong issuer.')

            # Extract user info
           # Extract user info
            user_info = {
                'email': idinfo.get('email'),
                'name': idinfo.get('name'),
                'google_id': idinfo.get('sub'),
                'email_verified': idinfo.get('email_verified', False)
            }

            # Validate required fields
            if not user_info['email'] or not user_info['google_id']:
                raise ValueError('Missing required user information from Google')

            logger.info(f"Extracted user info for email: {user_info['email']}")
            return user_info

        except ValueError as e:
            logger.error(f"Token verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification error: {str(e)}"
            )

    @staticmethod
    async def authenticate_or_create_user(google_user_info: dict, db: Session) -> dict:
        """Authenticate existing user or create new one from Google login"""
        try:
            email = google_user_info['email']
            google_id = google_user_info['google_id']
            name = google_user_info['name']

            logger.info(f"Authenticating or creating user for email: {email}")

            # Check if user exists with this Google ID
            user = db.query(User).filter(
                User.oauth_provider == 'google',
                User.oauth_id == google_id
            ).first()

            if user:
                logger.info(f"Found existing user with Google ID: {user.id}")
            else:
                logger.info(f"No user found with Google ID, checking email...")

                # Check if user exists with this email
                user = db.query(User).filter(User.email == email).first()

                if user:
                    logger.info(f"Found existing user with email, linking Google account: {user.id}")

                    # Check if already linked to another Google account
                    if user.oauth_provider == 'google' and user.oauth_id and user.oauth_id != google_id:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="This email is already linked to a different Google account"
                        )

                    # User exists with email but not linked to Google
                    # Link the Google account
                    user.oauth_provider = 'google'
                    user.oauth_id = google_id
                    user.email_verified = True
                    db.commit()
                    db.refresh(user)
                else:
                    logger.info(f"Creating new user for email: {email}")

                    # Create new user
                    # Generate unique username from email
                    # Generate unique username from email
                    base_username = email.split('@')[0]
                    username = base_username
                    counter = 1

                    # Add maximum retry limit
                    max_retries = 100
                    while counter < max_retries:
                        existing = db.query(User).filter(User.username == username).first()
                        if not existing:
                            break
                        username = f"{base_username}{counter}"
                        counter += 1

                    if counter >= max_retries:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Unable to generate unique username. Please try again."
                        )

                    logger.info(f"Generated unique username: {username}")

                    try:
                        user = User(
                            email=email,
                            username=username,
                            password=None,  # OAuth users don't have passwords
                            oauth_provider='google',
                            oauth_id=google_id,
                            has_profile_completed=False,
                            last_active=datetime.utcnow(),
                            email_verified=True
                        )
                        db.add(user)
                        db.commit()
                        db.refresh(user)
                        logger.info(f"New user created with ID: {user.id}")

                    except IntegrityError as e:
                        db.rollback()
                        logger.error(f"Database integrity error: {str(e)}")

                        # Handle race condition - user was created between check and insert
                        existing_user = db.query(User).filter(User.email == email).first()
                        if existing_user:
                            logger.info(f"User was created concurrently, using existing user: {existing_user.id}")
                            user = existing_user
                            # Link Google account if not already linked
                            if not user.oauth_id:
                                user.oauth_provider = 'google'
                                user.oauth_id = google_id
                                user.email_verified = True
                                db.commit()
                                db.refresh(user)
                        else:
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Failed to create user account. Please try again."
                            )
            # Update last active
            user.last_active = datetime.utcnow()
            db.commit()

            logger.info(f"Creating access token for user: {user.id}")

            # Create access token
            access_token = create_access_token(data={"sub": user.email})

            logger.info(f"Successfully authenticated user: {user.id}")

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "is_premium": user.is_premium,
                    "has_profile_completed": user.has_profile_completed
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error in authenticate_or_create_user: {str(e)}")
            logger.exception("Full traceback:")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Authentication failed: {str(e)}"
            )
