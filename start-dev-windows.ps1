# PowerShell script to start both frontend and backend on Windows
# Backend runs on http://localhost:5000
# Frontend runs on http://localhost:3000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Full-Stack Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if .NET SDK is installed
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: .NET SDK is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install .NET SDK 8.0 from https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Node.js version: $(node --version)" -ForegroundColor Green
Write-Host "✓ .NET SDK version: $(dotnet --version)" -ForegroundColor Green
Write-Host ""

# Start Backend in a new window
Write-Host "Starting Backend (http://localhost:5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\PMS_APIs'; Write-Host 'Backend starting on http://localhost:5000...' -ForegroundColor Cyan; dotnet run --urls http://localhost:5000"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend in a new window
Write-Host "Starting Frontend (http://localhost:3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Frontend starting on http://localhost:3000...' -ForegroundColor Cyan; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Swagger:  http://localhost:5000/swagger" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

