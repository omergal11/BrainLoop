import os
from mysql.connector import pooling

DB_TYPE = os.getenv('DB_TYPE', 'mysql').lower()

MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD'),
    'database': os.getenv('MYSQL_DB', 'brainloop'),
}

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
    """Get a database connection based on DB_TYPE (raw connection)"""
    if DB_TYPE == 'mysql':
        pool = get_mysql_pool()
        conn = pool.get_connection()
        original_cursor_method = conn.cursor
        def get_dict_cursor():
            return original_cursor_method(dictionary=True)
        conn.cursor = get_dict_cursor
        return conn
    else:
        # Fallback to SQLite if needed (for testing)
        import sqlite3
        db_path = os.getenv('SQLITE_DB', 'brainloop.db')
        conn = sqlite3.connect(db_path, check_same_thread=False)
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
