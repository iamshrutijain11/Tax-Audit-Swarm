#!/usr/bin/env bash
set -e

echo "==> Running database migrations and checks..."
python init_db.py || echo "Warning: init_db.py encountered an error, continuing..."

echo "==> Initializing RAG knowledge base in ChromaDB..."
python init_rag.py || echo "Warning: init_rag.py encountered an error, continuing..."

echo "==> Starting ATAS FastAPI server on port ${PORT:-8000}..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
