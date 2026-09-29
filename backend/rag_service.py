"""
RAG (Retrieval-Augmented Generation) service for "Ask the Course".

Uses a local Ollama instance for both embeddings (nomic-embed-text) and
generation (llama3.2). The retrieval index is built offline by
scripts/build_rag_index.py and loaded from rag_index.pkl.
"""
import os
import pickle
import time
from pathlib import Path

import numpy as np
import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
GENERATION_MODEL = os.getenv("OLLAMA_GENERATION_MODEL", "llama3.2")

INDEX_PATH = Path(__file__).parent / "rag_index.pkl"

_index_cache = None


def get_embedding(text: str, retries: int = 3) -> list[float]:
    """Get an embedding vector for `text` from Ollama.

    Ollama occasionally returns a transient 500 under sustained local load
    (e.g. while embedding thousands of rows), so retry a few times with
    backoff before giving up.
    """
    last_error = None
    for attempt in range(retries):
        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/embeddings",
                json={"model": EMBEDDING_MODEL, "prompt": text},
                timeout=60,
            )
            response.raise_for_status()
            return response.json()["embedding"]
        except requests.exceptions.RequestException as e:
            last_error = e
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    raise last_error


def cosine_similarity(a, b) -> float:
    """Cosine similarity between two vectors."""
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def _load_index() -> list[dict]:
    """Load the prebuilt index from disk, caching it in memory after the first read."""
    global _index_cache
    if _index_cache is None:
        if not INDEX_PATH.exists():
            raise FileNotFoundError(
                f"RAG index not found at {INDEX_PATH}. "
                "Run backend/scripts/build_rag_index.py first."
            )
        with open(INDEX_PATH, "rb") as f:
            _index_cache = pickle.load(f)
    return _index_cache


def retrieve(query: str, top_k: int = 4) -> list[dict]:
    """Embed `query` and return the top_k most similar chunks from the index."""
    index = _load_index()
    query_embedding = get_embedding(query)

    scored = [
        {**chunk, "score": cosine_similarity(query_embedding, chunk["embedding"])}
        for chunk in index
    ]
    scored.sort(key=lambda c: c["score"], reverse=True)
    return scored[:top_k]


def ask(question: str, top_k: int = 4) -> dict:
    """Answer `question` grounded in the retrieved course context via Ollama."""
    chunks = retrieve(question, top_k=top_k)

    context = "\n\n".join(f"[{c['source']}]\n{c['text']}" for c in chunks)
    prompt = (
        "You are a helpful assistant answering questions about this course's "
        "Questions/Topics content. Below are several excerpts from the course "
        "database that may or may not be relevant to the question.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Write ONE single, direct, well-composed answer to the question above, "
        "as a short paragraph. Use ONLY facts from the context - do not use "
        "outside knowledge. Do not restate or list the context excerpts one by "
        "one, and do not answer them as if they were separate questions; treat "
        "them only as background material for your one answer. If the context "
        "does not contain enough information to answer, say so plainly in one "
        "sentence instead of guessing.\n\n"
        "Answer:"
    )

    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={"model": GENERATION_MODEL, "prompt": prompt, "stream": False},
        timeout=120,
    )
    response.raise_for_status()
    answer = response.json()["response"].strip()

    return {
        "answer": answer,
        "sources": [c["source"] for c in chunks],
    }
