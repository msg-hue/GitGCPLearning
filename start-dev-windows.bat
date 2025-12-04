@echo off
REM Batch script to start both frontend and backend on Windows
REM Backend runs on http://localhost:5000
REM Frontend runs on http://localhost:3000

echo ========================================
echo Starting Full-Stack Development Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .NET SDK is installed
where dotnet >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: .NET SDK is not installed or not in PATH
    echo Please install .NET SDK 8.0 from https://dotnet.microsoft.com/download
    pause
    exit /b 1
)

echo Starting Backend (http://localhost:5000)...
start "Backend - PMS API" cmd /k "cd /d %~dp0backend\PMS_APIs && echo Backend starting on http://localhost:5000... && dotnet run --urls http://localhost:5000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

echo Starting Frontend (http://localhost:3000)...
start "Frontend - React App" cmd /k "cd /d %~dp0frontend && echo Frontend starting on http://localhost:3000... && npm start"

echo.
echo ========================================
echo Both servers are starting!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo Swagger:  http://localhost:5000/swagger
echo ========================================
echo.
echo Servers are running in separate windows.
echo Close those windows to stop the servers.
pause

