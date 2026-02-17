"""
Pydantic models for request and response bodies
"""
import re
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, validator


class LoginRequest(BaseModel):
    """Request model for login"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Response model for login"""
    user_id: int
    username: str
    email: str
    birth_date: date
    is_admin: bool
    access_token: str
    refresh_token: str


class RefreshTokenRequest(BaseModel):
    """Request model for refreshing token"""
    refresh_token: str


class UpdatePasswordRequest(BaseModel):
    """Request model for updating password"""
    username: str
    old_password: str
    new_password: str


class QuestionSchema(BaseModel):
    """Base schema for Question model"""
    question_id: int
    topic_id: int
    question_text: str
    type: str  # 'multiple_choice' or 'fill_in'
    option_a: str | None = None
    option_b: str | None = None
    option_c: str | None = None
    option_d: str | None = None

    class Config:
        from_attributes = True


class QuestionPublicSchema(BaseModel):
    """Public schema for Question model, hiding the correct answer"""
    question_id: int
    topic_id: int
    question_text: str
    type: str
    option_a: str | None = None
    option_b: str | None = None
    option_c: str | None = None
    option_d: str | None = None

    class Config:
        from_attributes = True


class QuestionUpdateRequest(BaseModel):
    question_text: str
    type: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    topic_id: int | None = None


class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer: str


class SubmitAnswerResponse(BaseModel):
    question_id: int
    is_correct: bool


class TopicPublicSchema(BaseModel):
    topic_id: int
    name: str

    class Config:
        from_attributes = True


class UserCreateRequest(BaseModel):
    username: str = Field(..., pattern=r"^[A-Za-z0-9]+$")
    email: EmailStr
    password: str
    birthdate: date

    @validator('password')
    def password_complexity(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[@$!%*?&#]', v):
            raise ValueError('Password must contain at least one special character (@$!%*?&#)')
        return v


class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    birth_date: date

    class Config:
        from_attributes = True


class CompleteSessionRequest(BaseModel):
    start_time: datetime | str | None = None
    end_time: datetime | str | None = None
    correct_answers: int


class StartSessionRequest(BaseModel):
    pass
