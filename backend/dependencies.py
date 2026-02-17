"""
Shared dependencies and utility functions
"""
import os
from datetime import datetime, timedelta
from typing import Generator, Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import get_connection, DB_TYPE

# Load from environment variables
ALGORITHM = "RS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer()

# Load RSA keys
try:
    with open("private_key.pem", "rb") as f:
        PRIVATE_KEY = f.read()
    with open("public_key.pem", "rb") as f:
        PUBLIC_KEY = f.read()
except FileNotFoundError:
    raise RuntimeError("Could not find private_key.pem or public_key.pem. Please generate them.")


def get_db() -> Generator:
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

    Truncates password to 72 bytes as per bcrypt specification.
    """
    # Truncate password to 72 bytes (bcrypt limit)
    plain_password = plain_password[:72]

    # Enforce bcrypt for all password verifications
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a new access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, PRIVATE_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict):
    """Creates a new refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, PRIVATE_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db=Depends(get_db)):
    """Validate JWT token and return current user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, PUBLIC_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token - no user ID")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

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
