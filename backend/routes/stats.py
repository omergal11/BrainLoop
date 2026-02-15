"""
Statistics routes - User stats and admin dashboard
Using Raw SQL queries (NO ORM)
"""
from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_db, get_current_user

router = APIRouter(prefix="", tags=["stats"])


@router.get("/stats/user")
def get_user_stats(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get user's personal statistics"""
    user_id = current_user['user_id']
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                COUNT(*) as total_questions,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
            FROM user_answers
            WHERE user_id = %s
        """, (user_id,))
        result = cursor.fetchone()
        total_questions = result['total_questions'] if result else 0
        correct_answers = result['correct_answers'] if result else 0
        success_rate = round(100 * correct_answers / total_questions, 2) if total_questions > 0 else 0
        
        cursor.execute("""
            SELECT t.name, 
                   COUNT(*) as total,
                   SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
                   ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*), 2) as accuracy
            FROM user_answers ua
            JOIN questions q ON ua.q_id = q.q_id
            JOIN topics t ON q.topic_id = t.topic_id
            WHERE ua.user_id = %s
            GROUP BY t.name
            HAVING COUNT(*) > 0
            ORDER BY accuracy DESC, COUNT(*) DESC
            LIMIT 1
        """, (user_id,))
        strongest_result = cursor.fetchone()
        strongest_topic = {
            "name": strongest_result['name'],
            "accuracy": strongest_result['accuracy']
        } if strongest_result else None
        
        cursor.execute("""
            SELECT t.name, 
                   COUNT(*) as total,
                   SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
                   ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*), 2) as accuracy
            FROM user_answers ua
            JOIN questions q ON ua.q_id = q.q_id
            JOIN topics t ON q.topic_id = t.topic_id
            WHERE ua.user_id = %s
            GROUP BY t.name
            HAVING COUNT(*) > 0
            ORDER BY accuracy ASC, COUNT(*) DESC
            LIMIT 1
        """, (user_id,))
        weakest_result = cursor.fetchone()
        weakest_topic = {
            "name": weakest_result['name'],
            "accuracy": weakest_result['accuracy']
        } if weakest_result else None
        
        cursor.execute("""
            SELECT current_streak_days, longest_streak
            FROM user_strikes
            WHERE user_id = %s
        """, (user_id,))
        streak_result = cursor.fetchone()
        current_streak = streak_result['current_streak_days'] if streak_result else 0
        best_streak = streak_result['longest_streak'] if streak_result else 0
        
        cursor.execute("""
            SELECT 
                session_id, 
                start_time, 
                end_time, 
                questions_solved
            FROM learning_sessions
            WHERE user_id = %s AND end_time IS NOT NULL
            ORDER BY session_id DESC
            LIMIT 1
        """, (user_id,))
        last_session_result = cursor.fetchone()
        
        cursor.execute("""
            SELECT 
                session_id, 
                start_time, 
                end_time, 
                questions_solved
            FROM learning_sessions
            WHERE user_id = %s AND end_time IS NOT NULL AND questions_solved > 0
            ORDER BY questions_solved DESC,
                     (UNIX_TIMESTAMP(end_time) - UNIX_TIMESTAMP(start_time)) ASC,
                     session_id DESC
            LIMIT 1
        """, (user_id,))
        best_session_result = cursor.fetchone()
        
        cursor.execute("""
            SELECT 
                t.name as topic,
                COUNT(*) as total,
                SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct
            FROM user_answers ua
            JOIN questions q ON ua.q_id = q.q_id
            JOIN topics t ON q.topic_id = t.topic_id
            WHERE ua.user_id = %s
            GROUP BY t.name
        """, (user_id,))
        topic_stats_results = cursor.fetchall()
        
        return {
            "user_id": user_id,
            "username": current_user['username'],
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "success_rate": success_rate,
            "strongest_topic": strongest_topic,
            "weakest_topic": weakest_topic,
            "best_streak": best_streak,
            "current_streak": current_streak,
            "last_session": {
                "session_id": last_session_result['session_id'],
                "start_time": last_session_result['start_time'],
                "end_time": last_session_result['end_time'],
                "questions_solved": last_session_result['questions_solved']
            } if last_session_result else None,
            "best_session": {
                "session_id": best_session_result['session_id'],
                "start_time": best_session_result['start_time'],
                "end_time": best_session_result['end_time'],
                "questions_solved": best_session_result['questions_solved']
            } if best_session_result else None,
            "topic_stats": {
                row['topic']: {
                    "name": row['topic'],
                    "total": row['total'],
                    "correct": row['correct'] or 0,
                    "accuracy": round(100 * (row['correct'] or 0) / row['total'], 2) if row['total'] > 0 else 0
                }
                for row in topic_stats_results
            }
        }
    finally:
        cursor.close()


@router.get("/admin/stats/overview")
def get_admin_stats(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get admin dashboard with overall statistics"""
    if not current_user['is_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT 
                u.user_id,
                u.username,
                COUNT(ua.answer_id) as total_questions,
                SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
                ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
            FROM users u
            LEFT JOIN user_answers ua ON u.user_id = ua.user_id
            GROUP BY u.user_id, u.username
            HAVING COUNT(ua.answer_id) > 0
            ORDER BY success_rate DESC
            LIMIT 10
        """)
        top_students = cursor.fetchall()
        
        cursor.execute("""
            SELECT COALESCE(t.name, 'Unknown') as topic_name, COUNT(ua.answer_id) as answer_count
            FROM user_answers ua
            JOIN questions q ON ua.q_id = q.q_id
            LEFT JOIN topics t ON q.topic_id = t.topic_id
            GROUP BY t.name
            ORDER BY answer_count DESC
            LIMIT 5
        """)
        most_practiced = cursor.fetchall()
        
        cursor.execute("""
            SELECT 
                COALESCE(t.name, 'Unknown') as topic_name,
                COUNT(ua.answer_id) as total,
                SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
                ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
            FROM user_answers ua
            JOIN questions q ON ua.q_id = q.q_id
            LEFT JOIN topics t ON q.topic_id = t.topic_id
            GROUP BY t.name
            HAVING COUNT(ua.answer_id) >= 3
            ORDER BY success_rate ASC
            LIMIT 5
        """)
        most_challenging = cursor.fetchall()
        
        cursor.execute("""
            SELECT 
                COALESCE(t.name, 'Unknown') as topic_name,
                COUNT(ua.answer_id) as total,
                SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
                ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
            FROM user_answers ua
            JOIN questions q ON ua.q_id = q.q_id
            LEFT JOIN topics t ON q.topic_id = t.topic_id
            GROUP BY t.name
            HAVING COUNT(ua.answer_id) >= 3
            ORDER BY success_rate DESC
            LIMIT 5
        """)
        highest_proficiency = cursor.fetchall()
        
        cursor.execute("""
            SELECT AVG((UNIX_TIMESTAMP(end_time) - UNIX_TIMESTAMP(start_time)) / 60.0) as avg_minutes
            FROM learning_sessions
            WHERE end_time IS NOT NULL
        """)
        avg_duration_result = cursor.fetchone()
        avg_session_duration = round(avg_duration_result['avg_minutes'], 2) if avg_duration_result and avg_duration_result['avg_minutes'] else 0
        
        cursor.execute("""
            SELECT 
                COALESCE(t.name, 'Unknown') as topic_name,
                ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
            FROM user_answers ua
            JOIN questions q ON ua.q_id = q.q_id
            LEFT JOIN topics t ON q.topic_id = t.topic_id
            GROUP BY t.name
            HAVING COUNT(ua.answer_id) > 0
            ORDER BY success_rate DESC
            LIMIT 1
        """)
        strongest_overall = cursor.fetchone()
        
        cursor.execute("""
            SELECT 
                COALESCE(t.name, 'Unknown') as topic_name,
                ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
            FROM user_answers ua
            JOIN questions q ON ua.q_id = q.q_id
            LEFT JOIN topics t ON q.topic_id = t.topic_id
            GROUP BY t.name
            HAVING COUNT(ua.answer_id) > 0
            ORDER BY success_rate ASC
            LIMIT 1
        """)
        weakest_overall = cursor.fetchone()
        
        cursor.execute("""
            SELECT u.user_id, u.username, us.longest_streak
            FROM users u
            JOIN user_strikes us ON u.user_id = us.user_id
            WHERE us.longest_streak > 0
            ORDER BY us.longest_streak DESC
            LIMIT 1
        """)
        longest_streak_user = cursor.fetchone()
        
        cursor.execute("""
            SELECT u.user_id, u.username, us.current_streak_days
            FROM users u
            JOIN user_strikes us ON u.user_id = us.user_id
            WHERE us.current_streak_days > 0
            ORDER BY us.current_streak_days DESC
            LIMIT 1
        """)
        current_longest_streak_user = cursor.fetchone()
        
        cursor.execute("""
            SELECT 
                ls.session_id,
                u.username,
                ls.start_time,
                ls.end_time,
                ls.questions_solved,
                u.user_id,
                ROUND((UNIX_TIMESTAMP(ls.end_time) - UNIX_TIMESTAMP(ls.start_time)) / 60.0, 2) as duration_minutes
            FROM learning_sessions ls
            JOIN users u ON ls.user_id = u.user_id
            WHERE ls.end_time IS NOT NULL AND ls.questions_solved > 0
            ORDER BY ls.questions_solved DESC, (UNIX_TIMESTAMP(ls.end_time) - UNIX_TIMESTAMP(ls.start_time)) ASC
            LIMIT 1
        """)
        best_session = cursor.fetchone()
        
        return {
            "top_students": [
                {
                    "user_id": row['user_id'],
                    "username": row['username'],
                    "total_questions": row['total_questions'],
                    "correct_answers": row['correct_answers'],
                    "success_rate": row['success_rate']
                }
                for row in top_students
            ],
            "most_practiced_topics": [
                {"name": row['topic_name'], "answer_count": row['answer_count']}
                for row in most_practiced
            ],
            "most_challenging_topics": [
                {"name": row['topic_name'], "success_rate": row['success_rate']}
                for row in most_challenging
            ],
            "highest_proficiency_topics": [
                {"name": row['topic_name'], "success_rate": row['success_rate']}
                for row in highest_proficiency
            ],
            "avg_session_duration_minutes": avg_session_duration,
            "strongest_overall_topic": {
                "name": strongest_overall['topic_name'],
                "success_rate": strongest_overall['success_rate']
            } if strongest_overall else None,
            "weakest_overall_topic": {
                "name": weakest_overall['topic_name'],
                "success_rate": weakest_overall['success_rate']
            } if weakest_overall else None,
            "user_longest_streak": {
                "user_id": longest_streak_user['user_id'],
                "username": longest_streak_user['username'],
                "streak_days": longest_streak_user['longest_streak']
            } if longest_streak_user else None,
            "user_current_longest_streak": {
                "user_id": current_longest_streak_user['user_id'],
                "username": current_longest_streak_user['username'],
                "streak_days": current_longest_streak_user['current_streak_days']
            } if current_longest_streak_user else None,
            "best_session": {
                "session_id": best_session['session_id'],
                "username": best_session['username'],
                "questions_solved": best_session['questions_solved'],
                "duration_minutes": best_session['duration_minutes']
            } if best_session else None
        }
    finally:
        cursor.close()



