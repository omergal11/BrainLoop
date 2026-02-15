"""
questions routes - CRUD operations with Raw SQL (NO ORM)
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
import re

from dependencies import get_db, get_current_user
from schemas import QuestionSchema, QuestionPublicSchema, TopicPublicSchema

router = APIRouter(prefix="/questions", tags=["questions"])
topics_router = APIRouter(tags=["topics"])


def extract_code_and_imports(question_text: str) -> tuple[str, str]:
    """
    Extract code and imports from question_text.
    Returns (imports, code)
    """
    if not question_text:
        return "", ""
    
    # Pattern to match imports at the beginning of code blocks
    # Handles: import, from, #include, using, etc.
    # Matches lines that start with import-like statements
    import_pattern = r'^((?:import\s+[^\n]*(?:;)?|from\s+[^\n]*import[^\n]*|#include\s+[^\n]*|#define\s+[^\n]*|using\s+[^\n]*;)\n*)+'
    
    match = re.match(import_pattern, question_text, re.MULTILINE)
    
    if match:
        imports = match.group(0).strip()
        code = question_text[len(match.group(0)):].strip()
        return imports, code
    
    return "", question_text


def enrich_question(question: dict) -> dict:
    """
    Enrich question dict with extracted code and imports.
    """
    question_text = question.get('question_text', '')
    question_type = question.get('type', '')
    
    # Only extract code for code questions
    if question_type == 'code':
        imports, code = extract_code_and_imports(question_text)
        question['code_imports'] = imports
        question['code'] = code
    else:
        question['code_imports'] = ""
        question['code'] = ""
    
    return question


@router.get("/", response_model=List[QuestionSchema])
def list_questions(
    limit: int = Query(5, ge=1, le=100),
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[QuestionSchema]:
    cursor = db.cursor()
    try:
        cursor.execute("SELECT * FROM questions LIMIT %s", (limit,))
        questions = cursor.fetchall()
        return [enrich_question(q) for q in questions]
    finally:
        cursor.close()


@router.get("/{question_id}", response_model=QuestionSchema)
def get_question(question_id: int, db = Depends(get_db), current_user: dict = Depends(get_current_user)) -> QuestionSchema:
    cursor = db.cursor()
    try:
        cursor.execute("SELECT * FROM questions WHERE q_id = %s", (question_id,))
        question = cursor.fetchone()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return enrich_question(question)
    finally:
        cursor.close()


@router.get("/random", response_model=QuestionPublicSchema)
def get_random_question(db = Depends(get_db), current_user: dict = Depends(get_current_user)) -> QuestionPublicSchema:
    cursor = db.cursor()
    try:
        cursor.execute("SELECT * FROM questions ORDER BY RAND() LIMIT 1")
        question = cursor.fetchone()
        if not question:
            raise HTTPException(status_code=404, detail="No questions available")
        return enrich_question(question)
    finally:
        cursor.close()


def _random_batch_query(
    type: str,
    topics: str,
    limit: int,
    db,
) -> List[QuestionSchema]:
    topic_ids: list[int] = []
    if topics:
        try:
            topic_ids = [int(t.strip()) for t in topics.split(",") if t.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid topics parameter")

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
        questions = cursor.fetchall()
        if not questions:
            raise HTTPException(status_code=404, detail="No questions available for selection")
        return [enrich_question(q) for q in questions]
    finally:
        cursor.close()


@router.get("/random-batch", response_model=List[QuestionSchema])
def get_random_batch(
    type: str = Query(..., description="Question type, e.g. code or choose"),
    topics: str = Query("", description="Comma-separated topic IDs"),
    limit: int = Query(10, ge=1, le=50),
    db = Depends(get_db),
) -> List[QuestionSchema]:
    return _random_batch_query(type, topics, limit, db)


@router.get("/random-questions-batch", response_model=List[QuestionSchema])
def get_random_questions(
    type: str = Query(..., description="Question type, e.g. code or choose"),
    topics: str = Query("", description="Comma-separated topic IDs"),
    limit: int = Query(10, ge=1, le=50),
    db = Depends(get_db),
) -> List[QuestionSchema]:
    return _random_batch_query(type, topics, limit, db)


@router.get("/topics/code", response_model=List[TopicPublicSchema])
def get_code_topics(db = Depends(get_db), current_user: dict = Depends(get_current_user)) -> List[TopicPublicSchema]:
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT DISTINCT t.topic_id, t.name
            FROM topics t
            JOIN questions q ON q.topic_id = t.topic_id
            WHERE q.type = 'code' AND t.topic_id IS NOT NULL
        """)
        results = cursor.fetchall()
        return [TopicPublicSchema(topic_id=row['topic_id'], name=row['name']) for row in results]
    finally:
        cursor.close()


@router.get("/topics/multiple-choice", response_model=List[TopicPublicSchema])
def get_multiple_choice_topics(db = Depends(get_db), current_user: dict = Depends(get_current_user)) -> List[TopicPublicSchema]:
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT DISTINCT t.topic_id, t.name
            FROM topics t
            JOIN questions q ON q.topic_id = t.topic_id
            WHERE q.type = 'choose' AND t.topic_id IS NOT NULL
        """)
        results = cursor.fetchall()
        return [TopicPublicSchema(topic_id=row['topic_id'], name=row['name']) for row in results]
    finally:
        cursor.close()


@topics_router.get("/topics/code", response_model=List[TopicPublicSchema])
def get_code_topics_root(db = Depends(get_db), current_user: dict = Depends(get_current_user)) -> List[TopicPublicSchema]:
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT DISTINCT t.topic_id, t.name
            FROM topics t
            JOIN questions q ON q.topic_id = t.topic_id
            WHERE q.type = 'code' AND t.topic_id IS NOT NULL
        """)
        results = cursor.fetchall()
        return [TopicPublicSchema(topic_id=row['topic_id'], name=row['name']) for row in results]
    finally:
        cursor.close()


@topics_router.get("/topics/multiple-choice", response_model=List[TopicPublicSchema])
def get_multiple_choice_topics_root(db = Depends(get_db), current_user: dict = Depends(get_current_user)) -> List[TopicPublicSchema]:
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT DISTINCT t.topic_id, t.name
            FROM topics t
            JOIN questions q ON q.topic_id = t.topic_id
            WHERE q.type = 'choose' AND t.topic_id IS NOT NULL
        """)
        results = cursor.fetchall()
        return [TopicPublicSchema(topic_id=row['topic_id'], name=row['name']) for row in results]
    finally:
        cursor.close()



