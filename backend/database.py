import os
from pathlib import Path
import mysql.connector
from mysql.connector import pooling
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DB_TYPE = os.getenv('DB_TYPE', 'mysql').lower()

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "db" / "brainloop.db"

MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD'),
    'database': os.getenv('MYSQL_DB', 'brainloop'),
}

if DB_TYPE == 'mysql':
    db_url = f"mysql+pymysql://{MYSQL_CONFIG['user']}:{MYSQL_CONFIG['password']}@{MYSQL_CONFIG['host']}/{MYSQL_CONFIG['database']}"
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
else:
    db_url = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_connection_pool = None


def get_mysql_pool():
    """Get or create MySQL connection pool"""
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = pooling.MySQLConnectionPool(
            pool_name="brainloop_pool",
            pool_size=5,
            pool_reset_session=True,
            **MYSQL_CONFIG
        )
    return _connection_pool

def get_connection():
    """Get a database connection based on DB_TYPE (raw connection, not SQLAlchemy)"""
    if DB_TYPE == 'mysql':
        pool = get_mysql_pool()
        conn = pool.get_connection()
        original_cursor_method = conn.cursor
        def get_dict_cursor():
            return original_cursor_method(dictionary=True)
        conn.cursor = get_dict_cursor
        return conn
    else:
        import sqlite3
        conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn


def create_indexes():
    """Create indexes for optimized query performance on stats endpoints"""
    conn = get_connection()
    cursor = conn.cursor()
    
    indexes_to_create = [
        ('idx_learning_sessions_user_id', 'Learning_Sessions', 'user_id'),
        ('idx_user_answers_user_id', 'User_Answers', 'user_id'),
        ('idx_user_answers_correct', 'User_Answers', 'user_id, is_correct'),
        ('idx_questions_id', 'Questions', 'q_id'),
        ('idx_questions_topic_id', 'Questions', 'topic_id'),
    ]
    
    try:
        for index_name, table_name, columns in indexes_to_create:
            try:
                if DB_TYPE == 'mysql':
                    sql = f"CREATE INDEX {index_name} ON {table_name} ({columns})"
                else:
                    sql = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({columns})"
                cursor.execute(sql)
            except Exception:
                pass
        conn.commit()
    finally:
        cursor.close()
        conn.close()
