"""
Backend API for BrainLoop Quiz Application
Raw SQL Architecture (NO ORM)
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from dotenv import load_dotenv
load_dotenv()

from database import create_indexes, get_connection
from routes import auth, questions, stats, quiz

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

try:
    create_indexes()
except Exception:
    pass

app = FastAPI(title="BrainLoop API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Add Prometheus instrumentator
Instrumentator().instrument(app).expose(app)

# CORS middleware must be added FIRST, before routes and other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://0.0.0.0:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router)
app.include_router(auth.user_router)
app.include_router(questions.router)
app.include_router(questions.topics_router)
app.include_router(quiz.router)
app.include_router(stats.router)


@app.get("/")
def root():
    return {"message": "BrainLoop API is running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    try:
        conn = get_connection()
        conn.close()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
