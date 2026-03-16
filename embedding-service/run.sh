#!/bin/bash

# Exit if any command fails

set -e

# Move to embedding service directory

cd /root/embedding-service

# Activate Python virtual environment

source venv/bin/activate

# Start FastAPI embedding service (3 workers)

exec uvicorn main:app --host 127.0.0.1 --port 8001 --workers 3