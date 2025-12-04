#!/bin/bash
# Bash script to start both frontend and backend on Linux/Mac
# Backend runs on http://localhost:5000
# Frontend runs on http://localhost:3000

echo "========================================"
echo "Starting Full-Stack Development Server"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if .NET SDK is installed
if ! command -v dotnet &> /dev/null; then
    echo "ERROR: .NET SDK is not installed or not in PATH"
    echo "Please install .NET SDK 8.0 from https://dotnet.microsoft.com/download"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ .NET SDK version: $(dotnet --version)"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start Backend in background
echo "Starting Backend (http://localhost:5000)..."
cd "$SCRIPT_DIR/backend/PMS_APIs"
dotnet run --urls http://localhost:5000 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start Frontend in background
echo "Starting Frontend (http://localhost:3000)..."
cd "$SCRIPT_DIR/frontend"
npm start &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Both servers are starting!"
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Swagger:  http://localhost:5000/swagger"
echo "========================================"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for user interrupt
wait

