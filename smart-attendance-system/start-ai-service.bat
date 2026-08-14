@echo off
title AI Service - Smart Attendance
cd /d "%~dp0ai-service"
call venv\Scripts\activate
echo ============================================
echo Starting AI Service on port 8000...
echo DO NOT CLOSE THIS WINDOW while using the app.
echo ============================================
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause
