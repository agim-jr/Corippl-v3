from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.google_auth_service import GoogleAuthService

router = APIRouter(prefix="/auth/google", tags=["Google Auth"])

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/login")
async def google_login(
    request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with Google OAuth token
    """
    try:
        # Verify the Google token
        google_user_info = await GoogleAuthService.verify_google_token(request.token)

        # Authenticate or create user
        result = await GoogleAuthService.authenticate_or_create_user(google_user_info, db)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )
