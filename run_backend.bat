@echo off
title WESAL Backend - Sultan Qaboos Hospital
cd /d "%~dp0backend"
echo ========================================================
echo Starting WESAL Smart Access Platform Backend (FastAPI)...
echo Sultan Qaboos Hospital Prototype
echo ========================================================
venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 9900 --reload
pause
