"""
One-time (rerunnable) build script for the "Ask the Course" RAG index.

Pulls every question joined with its topic from MySQL, embeds each one via
the local Ollama instance (see rag_service.get_embedding), and saves the
resulting list of {text, source, embedding} records to rag_index.pkl next
to rag_service.py.

Usage:
    cd backend
    python scripts/build_rag_index.py
"""
import sys
import os
import pickle
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_connection
from rag_service import get_embedding, INDEX_PATH

# Throttle between Ollama embedding calls so we don't hammer it on large tables.
SLEEP_BETWEEN_CALLS_SECONDS = 0.05

# nomic-embed-text's context window is 2048 tokens; some question_text values
# (long code snippets) exceed that and Ollama returns a 500. Truncate to a
# character budget that stays safely under the limit even for dense code.
MAX_QUESTION_CHARS = 3000


def fetch_rows():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT q.q_id, q.question_text, t.name AS topic_name
            FROM questions q
            JOIN topics t ON q.topic_id = t.topic_id
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


def main():
    rows = fetch_rows()
    total = len(rows)
    print(f"Fetched {total} question rows from MySQL. Building embeddings...")

    index = []
    skipped = 0
    for i, row in enumerate(rows, start=1):
        question_text = row['question_text'][:MAX_QUESTION_CHARS]
        text = f"Topic: {row['topic_name']}\nQuestion: {question_text}"
        source = f"Question #{row['q_id']} ({row['topic_name']})"

        try:
            embedding = get_embedding(text)
        except Exception as e:
            skipped += 1
            print(f"  skipped q_id={row['q_id']} ({e})")
            continue

        index.append({"text": text, "source": source, "embedding": embedding})

        if i % 25 == 0 or i == total:
            print(f"  embedded {i}/{total}")

        time.sleep(SLEEP_BETWEEN_CALLS_SECONDS)

    with open(INDEX_PATH, "wb") as f:
        pickle.dump(index, f)

    print(f"Saved {len(index)} entries to {INDEX_PATH} ({skipped} skipped)")


if __name__ == "__main__":
    main()
