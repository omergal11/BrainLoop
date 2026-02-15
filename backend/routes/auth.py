"""
Authentication routes - Login, Register
Using Raw SQL queries (NO ORM)
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_db, create_jwt, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, hash_password, verify_password
from schemas import LoginRequest, LoginResponse, UserCreateRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])
user_router = APIRouter(tags=["users"])


@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(payload: UserCreateRequest, db = Depends(get_db)) -> dict:
    """Create a new user """
    cursor = db.cursor()
    
    try:
        cursor.execute("SELECT user_id FROM users WHERE username = %s", (payload.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
        
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (payload.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Hash password before storing
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
def login(payload: LoginRequest, db = Depends(get_db)):
    """Login user with raw SQL"""
    cursor = db.cursor()
    
    try:
        cursor.execute("SELECT user_id, username, email, password, birth_date, is_admin FROM users WHERE username = %s", (payload.username,))
        user_row = cursor.fetchone()
        
        if not user_row or not verify_password(payload.password, user_row['password']):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        user_id = user_row['user_id']
        
        # If password is in plain text (legacy), hash it and update in database
        stored_password = user_row['password']
        if not (stored_password.startswith("$2b$") or stored_password.startswith("$2a$")):
            # Legacy plain text password - hash it and update
            hashed_password = hash_password(payload.password)
            cursor.execute(
                "UPDATE users SET password = %s WHERE user_id = %s",
                (hashed_password, user_id)
            )
            db.commit()
        
        cursor.execute("SELECT * FROM user_strikes WHERE user_id = %s", (user_id,))
        streak_row = cursor.fetchone()
        
        today = datetime.now().date()
        yesterday = today.replace(day=today.day - 1) if today.day > 1 else None
        
        if not streak_row:
            cursor.execute(
                "INSERT INTO user_strikes (user_id, current_streak_start, current_streak_days, longest_streak, last_activity_date) VALUES (%s, %s, %s, %s, %s)",
                (user_id, today, 1, 1, today)
            )
        else:
            last_date = streak_row['last_activity_date']
            current_streak = streak_row['current_streak_days']
            longest_streak = streak_row['longest_streak']
            
            if last_date is None or current_streak == 0:
                cursor.execute(
                    "UPDATE user_strikes SET current_streak_start = %s, current_streak_days = 1, longest_streak = 1, last_activity_date = %s WHERE user_id = %s",
                    (today, today, user_id)
                )
            elif last_date == yesterday:
                new_streak = current_streak + 1
                new_longest = max(new_streak, longest_streak)
                cursor.execute(
                    "UPDATE user_strikes SET current_streak_days = %s, longest_streak = %s, last_activity_date = %s WHERE user_id = %s",
                    (new_streak, new_longest, today, user_id)
                )
            elif today == last_date:
                pass
            else:
                cursor.execute(
                    "UPDATE user_strikes SET current_streak_start = %s, current_streak_days = 1, last_activity_date = %s WHERE user_id = %s",
                    (today, today, user_id)
                )
        
        db.commit()
        
        token_data = {
            "sub": str(user_id),
            "username": user_row['username'],
            "exp": datetime.utcnow().timestamp() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        }
        access_token = create_jwt(token_data)
        
        return LoginResponse(
            user_id=user_id,
            username=user_row['username'],
            email=user_row['email'],
            birth_date=user_row['birth_date'],
            is_admin=user_row['is_admin'],
            access_token=access_token
        )
    finally:
        cursor.close()


@router.get("/me")
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info"""
    return {
        "user_id": current_user['user_id'],
        "username": current_user['username'],
        "email": current_user['email'],
        "birth_date": current_user['birth_date'],
    }


@user_router.get("/user/{user_id}")
def get_user_by_id(user_id: int, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get user by ID"""
    cursor = db.cursor()
    try:
        cursor.execute("SELECT user_id, username, email, birth_date, is_admin FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    finally:
        cursor.close()


@user_router.get("/user/{user_id}/streak")
def get_user_streak(user_id: int, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get user streak information"""
    cursor = db.cursor()
    try:
        cursor.execute("SELECT user_id, current_streak_days, longest_streak, current_streak_start, last_activity_date FROM user_strikes WHERE user_id = %s", (user_id,))
        streak = cursor.fetchone()
        
        if not streak:
            return {
                "user_id": user_id,
                "current_streak_days": 0,
                "longest_streak": 0,
                "current_streak_start": None,
                "last_activity_date": None,
            }
        return streak
    finally:
        cursor.close()



