@echo off
title GhostMove - Mobile AI Coding Assistant
color 0A

echo.
echo  ====================================
echo    GhostMove - Starting up...
echo  ====================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  ERROR: Node.js is not installed on this PC.
    echo.
    echo  Please download and install Node.js from:
    echo    https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Move to the folder where this script lives
cd /d "%~dp0"

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo  Installing dependencies ^(first run only^)...
    echo.
    call npm install --silent
    if %errorlevel% neq 0 (
        color 0C
        echo  ERROR: npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
    echo  Done!
    echo.
)

:: Create .env from example if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  Created .env file from template.
        echo  IMPORTANT: Edit .env and add your GROQ_API_KEY!
        echo.
    )
)

echo  Starting server...
echo  Press Ctrl+C to stop.
echo.

node server.js

pause
