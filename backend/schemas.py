"""
Pydantic schemas for request/response validation
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class QuestionSchema(BaseModel):
    q_id: int
    question_text: str
    type: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    topic_id: int | None = None
    code: str = ""
    code_imports: str = ""

    class Config:
        from_attributes = True


class QuestionPublicSchema(BaseModel):
    q_id: int
    question_text: str
    type: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    topic_id: int | None = None
    code: str = ""
    code_imports: str = ""

    class Config:
        from_attributes = True


class QuestionCreateRequest(BaseModel):
    question_text: str
    type: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    topic_id: int | None = None


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
    password: str = Field(..., pattern=r"^\d{6}$")
    birthdate: date


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


class StartSessionResponse(BaseModel):
    session_id: int
    user_id: int
    start_time: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    user_id: int
    username: str
    email: str
    birth_date: date
    is_admin: bool
    access_token: str
    token_type: str = "bearer"


class StreakResponse(BaseModel):
    user_id: int
    current_streak_days: int
    longest_streak: int
    last_activity_date: Optional[date] = None

    class Config:
        from_attributes = True
