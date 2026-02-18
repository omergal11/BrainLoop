"""
Quiz routes - Submit answers
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies import get_db, get_current_user
from schemas import SubmitAnswerRequest, SubmitAnswerResponse, CompleteSessionRequest

router = APIRouter(prefix="", tags=["quiz"])


@router.get("/random-questions")
def get_random_questions(type: str = Query(...), topics: str = Query(""), limit: int = Query(10), db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get random questions by type and topics"""
    topic_ids = [int(t.strip()) for t in topics.split(',') if t.strip()] if topics else []
    
    cursor = db.cursor()
    try:
        if topic_ids:
            placeholders = ','.join(['%s'] * len(topic_ids))
            cursor.execute(
                f"SELECT * FROM questions WHERE type = %s AND topic_id IN ({placeholders}) ORDER BY RAND() LIMIT %s",
                [type] + topic_ids + [limit]
            )
        else:
            cursor.execute(
                "SELECT * FROM questions WHERE type = %s ORDER BY RAND() LIMIT %s",
                (type, limit)
            )
        return cursor.fetchall()
    finally:
        cursor.close()


@router.post("/submit", response_model=SubmitAnswerResponse)
def submit_answer(payload: SubmitAnswerRequest, db = Depends(get_db), current_user: dict = Depends(get_current_user)) -> SubmitAnswerResponse:
    cursor = db.cursor()
    try:
        cursor.execute("SELECT * FROM questions WHERE q_id = %s", (payload.question_id,))
        question = cursor.fetchone()
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        submitted = (payload.answer or "").strip().lower()
        correct = (question['correct_answer'] or "").strip().lower()
        is_correct = submitted != "" and submitted == correct
        
        user_id = current_user['user_id']
        
        cursor.execute(
            "INSERT INTO user_answers (user_id, q_id, user_answer, is_correct) VALUES (%s, %s, %s, %s)",
            (user_id, payload.question_id, payload.answer, is_correct)
        )
        db.commit()
        
        return SubmitAnswerResponse(question_id=question['q_id'], is_correct=is_correct)
    finally:
        cursor.close()


@router.post("/complete-session")
def complete_session(payload: CompleteSessionRequest, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Complete a learning session - creates and immediately closes it"""
    user_id = current_user['user_id']
    
    # Parse start_time - it can come as string (ISO format) or datetime
    if payload.start_time:
        if isinstance(payload.start_time, str):
            try:
                start_time = datetime.fromisoformat(payload.start_time.replace('Z', '+00:00'))
            except:
                start_time = datetime.utcnow()
        else:
            start_time = payload.start_time
    else:
        start_time = datetime.utcnow()
    
    # Parse end_time - it can come as string (ISO format) or datetime
    if payload.end_time:
        if isinstance(payload.end_time, str):
            try:
                end_time = datetime.fromisoformat(payload.end_time.replace('Z', '+00:00'))
            except:
                end_time = datetime.utcnow()
        else:
            end_time = payload.end_time
    else:
        end_time = datetime.utcnow()
    
    cursor = db.cursor()
    try:
        # Use the actual times from the frontend
        cursor.execute(
            "INSERT INTO learning_sessions (user_id, start_time, end_time, questions_solved) VALUES (%s, %s, %s, %s)",
            (user_id, start_time, end_time, payload.correct_answers)
        )
        db.commit()
        session_id = cursor.lastrowid
        
        cursor.execute("SELECT * FROM user_strikes WHERE user_id = %s", (user_id,))
        user_strike = cursor.fetchone()
        
        today = datetime.now().date()
        
        if not user_strike:
            cursor.execute(
                "INSERT INTO user_strikes (user_id, current_streak_start, current_streak_days, longest_streak, last_activity_date) VALUES (%s, %s, 1, 1, %s)",
                (user_id, today, today)
            )
        else:
            last_date = user_strike['last_activity_date']
            current_streak = user_strike['current_streak_days']
            longest_streak = user_strike['longest_streak']
            
            if last_date:
                if isinstance(last_date, str):
                    last_date = datetime.strptime(last_date, '%Y-%m-%d').date()
                days_diff = (today - last_date).days
                
                if days_diff == 1:
                    new_streak = current_streak + 1
                    new_longest = max(new_streak, longest_streak)
                    cursor.execute(
                        "UPDATE user_strikes SET current_streak_days = %s, longest_streak = %s, last_activity_date = %s WHERE user_id = %s",
                        (new_streak, new_longest, today, user_id)
                    )
                elif days_diff > 1:
                    cursor.execute(
                        "UPDATE user_strikes SET current_streak_days = 1, last_activity_date = %s WHERE user_id = %s",
                        (today, user_id)
                    )
            else:
                cursor.execute(
                    "UPDATE user_strikes SET current_streak_days = 1, longest_streak = 1, last_activity_date = %s WHERE user_id = %s",
                    (today, user_id)
                )
        
        db.commit()
        
        cursor.execute("SELECT * FROM user_strikes WHERE user_id = %s", (user_id,))
        updated_strike = cursor.fetchone()
        
        return {
            "message": "Session completed successfully",
            "session_id": session_id,
            "questions_solved": payload.correct_answers,
            "current_streak": updated_strike['current_streak_days'],
            "longest_streak": updated_strike['longest_streak']
        }
    finally:
        cursor.close()


