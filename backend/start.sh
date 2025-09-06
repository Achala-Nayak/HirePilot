#!/bin/bash
# Render startup script for HirePilot backend

# Install dependencies if needed
pip install -r requirements.txt

# Start the FastAPI application with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --host 0.0.0.0 --port $PORT
