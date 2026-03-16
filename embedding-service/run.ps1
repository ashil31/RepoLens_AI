# Run embedding service with 3 workers
uvicorn main:app --host 127.0.0.1 --port 8001 --workers 3
