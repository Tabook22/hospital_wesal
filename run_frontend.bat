@echo off
title WESAL Frontend - Sultan Qaboos Hospital
cd /d "%~dp0frontend"
echo ========================================================
echo Starting WESAL Smart Access Platform Frontend (Vite)...
echo Sultan Qaboos Hospital Prototype
echo ========================================================
npm run dev -- --host
pause
