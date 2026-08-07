# backend/app/utils/jwt_handler.py

from datetime import datetime, timedelta
from typing import Optional
import jwt  # ← Changed from "from jose import jwt"
from jwt.exceptions import InvalidTokenError as JWTError  # ← Changed from "from jose import JWTError"
from ..config import settings  # Correctly import settings

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Generates a JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """
    Decodes a JWT token and returns the payload.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
