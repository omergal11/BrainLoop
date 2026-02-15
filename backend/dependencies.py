"""
Shared dependencies and utility functions
"""
import json
import base64
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Generator, Optional
import os

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext

from database import get_connection, DB_TYPE

# Load from environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE-THIS-IN-PRODUCTION-SUPER-SECRET-KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer()


def get_db():
    """Get a database connection"""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt
    
    Truncates password to 72 bytes as per bcrypt specification.
    """
    # bcrypt has a 72-byte limit, so truncate if necessary
    password = password[:72]
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using bcrypt.
    
    Supports both bcrypt hashed passwords and legacy plain text passwords
    for backward compatibility with existing users in the database.
    Truncates password to 72 bytes as per bcrypt specification.
    """
    # Truncate password to 72 bytes (bcrypt limit)
    plain_password = plain_password[:72]
    
    # Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        # Bcrypt hashed password - verify with bcrypt
        return pwd_context.verify(plain_password, hashed_password)
    else:
        # Legacy plain text password - compare directly for backward compatibility
        # NOTE: New passwords are hashed automatically. This allows old users to login.
        return plain_password == hashed_password


def create_jwt(data: dict) -> str:
    """Simple JWT creation without python-jose"""
    header = {"alg": ALGORITHM, "typ": "JWT"}
    payload = data.copy()

    header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")

    message = f"{header_encoded}.{payload_encoded}"
    signature = base64.urlsafe_b64encode(
        hmac.new(SECRET_KEY.encode(), message.encode(), hashlib.sha256).digest()
    ).decode().rstrip("=")

    return f"{message}.{signature}"


def decode_jwt(token: str) -> dict:
    """Simple JWT decode without python-jose"""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token format")

        header_encoded, payload_encoded, signature = parts

        message = f"{header_encoded}.{payload_encoded}"
        expected_signature = base64.urlsafe_b64encode(
            hmac.new(SECRET_KEY.encode(), message.encode(), hashlib.sha256).digest()
        ).decode().rstrip("=")

        if signature != expected_signature:
            raise ValueError("Invalid signature")

        padding = "=" * (4 - len(payload_encoded) % 4)
        payload_json = base64.urlsafe_b64decode(payload_encoded + padding)
        payload = json.loads(payload_json)

        if "exp" in payload:
            if datetime.utcnow().timestamp() > payload["exp"]:
                raise ValueError("Token expired")

        return payload

    except Exception as e:
        raise ValueError(f"Token validation failed: {str(e)}")


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db = Depends(get_db)):
    """Validate JWT token and return current user"""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        token = credentials.credentials
        payload = decode_jwt(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token - no user ID")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    cursor = db.cursor()
    if DB_TYPE == 'mysql':
        sql = "SELECT * FROM users WHERE user_id = %s"
    else:
        sql = "SELECT * FROM users WHERE user_id = %s"
    
    cursor.execute(sql, (int(user_id),))
    user_row = cursor.fetchone()
    
    if user_row is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_row

