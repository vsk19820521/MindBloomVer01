@echo off
title MindBloom Game Server
echo Starting MindBloom Logic Game Server...
cd /d "%~dp0"
echo Opening MindBloom in your browser...
start "" http://localhost:8000/
python server.py
pause
