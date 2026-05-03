#!/bin/bash
cd "$(dirname "$0")"
mkdir -p data
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
