"""
Authentication routes - Login, Register
Using Raw SQL queries (NO ORM)
"""
import re
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request

from dependencies import get_db, create_access_token, create_refresh_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, hash_password, verify_password
from schemas import LoginRequest, LoginResponse, UserCreateRequest, UserResponse, UpdatePasswordRequest
from metrics import LOGIN_FAILURES
from limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])
user_router = APIRouter(tags=["users"])


def is_password_strong(password: str) -> bool:
    """Check if password meets complexity requirements."""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    if not re.search(r'[@$!%*?&#]', password):
        return False
    return True


@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(request: Request, payload: UserCreateRequest, db = Depends(get_db)) -> dict:
    """Create a new user """
    cursor = db.cursor()
    
    try:
        cursor.execute("SELECT user_id FROM users WHERE username = %s", (payload.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
        
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (payload.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")
        
        hashed_password = hash_password(payload.password)
        cursor.execute(
            "INSERT INTO users (username, email, password, birth_date, is_admin) VALUES (%s, %s, %s, %s, %s)",
            (payload.username, payload.email, hashed_password, payload.birthdate, False)
        )
        db.commit()
        user_id = cursor.lastrowid
        
        today = datetime.now().date()
        cursor.execute(
            "INSERT INTO user_strikes (user_id, current_streak_start, current_streak_days, longest_streak, last_activity_date) VALUES (%s, %s, %s, %s, %s)",
            (user_id, today, 1, 1, today)
        )
        db.commit()
        
        return {
            "user_id": user_id,
            "username": payload.username,
            "email": payload.email,
            "birth_date": payload.birthdate,
            "is_admin": False
        }
    finally:
        cursor.close()


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db = Depends(get_db)):
    """Login user with raw SQL"""
    cursor = db.cursor()
    
    try:
        cursor.execute("SELECT user_id, username, email, password, birth_date, is_admin FROM users WHERE username = %s", (payload.username,))
        user_row = cursor.fetchone()
        
        if not user_row or not verify_password(payload.password, user_row['password']):
            LOGIN_FAILURES.labels(username=payload.username).inc()
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        if not is_password_strong(payload.password):
            raise HTTPException(
                status_code=403,
                detail="Password is too weak. Please update your password."
            )
            
        user_id = user_row['user_id']
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user_id)},
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={"sub": str(user_id)})
        
        return LoginResponse(
            user_id=user_id,
            username=user_row['username'],
            email=user_row['email'],
            birth_date=user_row['birth_date'],
            is_admin=user_row['is_admin'],
            access_token=access_token,
            refresh_token=refresh_token
        )
    finally:
        cursor.close()


@router.put("/update-password", response_model=LoginResponse)
@limiter.limit("5/minute")
def update_password(request: Request, payload: UpdatePasswordRequest, db = Depends(get_db)):
    """Update user password and log them in."""
    cursor = db.cursor()
    try:
        cursor.execute("SELECT user_id, username, email, password, birth_date, is_admin FROM users WHERE username = %s", (payload.username,))
        user_row = cursor.fetchone()

        if not user_row or not verify_password(payload.old_password, user_row['password']):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not is_password_strong(payload.new_password):
            raise HTTPException(status_code=400, detail="New password does not meet complexity requirements.")

        if payload.old_password == payload.new_password:
            raise HTTPException(status_code=400, detail="New password must be different from the old one.")

        hashed_password = hash_password(payload.new_password)
        cursor.execute(
            "UPDATE users SET password = %s WHERE user_id = %s",
            (hashed_password, user_row['user_id'])
        )
        db.commit()

        user_id = user_row['user_id']
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user_id)},
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={"sub": str(user_id)})
        
        return LoginResponse(
            user_id=user_id,
            username=user_row['username'],
            email=user_row['email'],
            birth_date=user_row['birth_date'],
            is_admin=user_row['is_admin'],
            access_token=access_token,
            refresh_token=refresh_token
        )
    finally:
        cursor.close()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user
