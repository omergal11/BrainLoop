"""
AI routes - "Ask the Course" RAG endpoint backed by a local Ollama instance.
"""
from fastapi import APIRouter, HTTPException

import rag_service
from schemas import AskAIRequest, AskAIResponse

router = APIRouter(tags=["AI"])


@router.post("/ask", response_model=AskAIResponse)
def ask_ai(payload: AskAIRequest) -> AskAIResponse:
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty")

    try:
        result = rag_service.ask(payload.question)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return AskAIResponse(**result)
