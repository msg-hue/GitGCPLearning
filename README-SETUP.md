# Full-Stack Development Setup Guide

This guide will help you set up and run both the frontend (React) and backend (.NET Core 8 MVC) projects.

## Prerequisites

### Required Software

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **.NET SDK 8.0**
   - Download from: https://dotnet.microsoft.com/download
   - Verify installation: `dotnet --version`

3. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

## Project Structure

```
GitGCPLearning/
├── frontend/          # React application
├── backend/           # .NET Core 8 MVC API
│   └── PMS_APIs/
└── README-SETUP.md    # This file
```

## Port Configuration

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Swagger UI**: http://localhost:5000/swagger

## Quick Start

### Windows

#### Option 1: Using PowerShell Script (Recommended)
```powershell
.\start-dev-windows.ps1
```

#### Option 2: Using Batch Script
```cmd
start-dev-windows.bat
```

#### Option 3: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend\PMS_APIs
dotnet run --urls http://localhost:5000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

### Linux / Mac

#### Option 1: Using Bash Script (Recommended)
```bash
chmod +x start-dev.sh
./start-dev.sh
```

#### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend/PMS_APIs
dotnet run --urls http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## Installation Steps (First Time Setup)

### 1. Install Frontend Dependencies

**Windows:**
```powershell
cd frontend
npm install
```

**Linux/Mac:**
```bash
cd frontend
npm install
```

### 2. Restore Backend Dependencies

**Windows:**
```powershell
cd backend\PMS_APIs
dotnet restore
```

**Linux/Mac:**
```bash
cd backend/PMS_APIs
dotnet restore
```

## Dependencies

### Frontend Dependencies
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `react-router-dom`: ^6.30.1
- `react-scripts`: 5.0.1
- `styled-components`: ^6.1.19
- `react-icons`: ^5.5.0
- And more... (see `frontend/package.json`)

### Backend Dependencies
- `Microsoft.AspNetCore.Authentication.JwtBearer`: 8.0.11
- `Microsoft.EntityFrameworkCore`: 8.0.11
- `Microsoft.EntityFrameworkCore.Sqlite`: 8.0.11
- `Npgsql.EntityFrameworkCore.PostgreSQL`: 8.0.11
- `Swashbuckle.AspNetCore`: 6.5.0
- `System.IdentityModel.Tokens.Jwt`: 7.1.2
- And more... (see `backend/PMS_APIs/PMS_APIs.csproj`)

## CORS Configuration

CORS is already configured in the backend to allow requests from:
- `http://localhost:3000` (Frontend)
- `http://127.0.0.1:3000` (Frontend alternative)
- Any localhost origin for development

The CORS policy allows:
- All headers
- All HTTP methods (GET, POST, PUT, DELETE, etc.)
- Credentials
- Preflight caching (1 hour)

## Troubleshooting

### Backend won't start on port 5000

**Windows:**
```powershell
# Check if port is in use
netstat -ano | findstr :5000

# Kill process if needed (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Check if port is in use
lsof -i :5000

# Kill process if needed (replace PID with actual process ID)
kill -9 <PID>
```

### Frontend won't start on port 3000

**Windows:**
```powershell
# Check if port is in use
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Check if port is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### CORS Errors

If you encounter CORS errors:
1. Ensure the backend is running on `http://localhost:5000`
2. Ensure the frontend is running on `http://localhost:3000`
3. Check browser console for specific error messages
4. Verify CORS configuration in `backend/PMS_APIs/Program.cs`

### Database Connection Issues

The backend uses PostgreSQL by default. If you need to switch to SQLite for local development:

1. Edit `backend/PMS_APIs/appsettings.Development.json`
2. Set `"DatabaseProvider": "Sqlite"`
3. Update the connection string to point to a SQLite database

## Development Workflow

1. **Start Backend First**: The backend should be running before the frontend starts making API calls.

2. **Start Frontend**: Once the backend is running, start the frontend.

3. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Swagger UI: http://localhost:5000/swagger

4. **Hot Reload**: Both projects support hot reload:
   - Frontend: Automatically reloads on file changes
   - Backend: Automatically restarts on file changes (with `dotnet watch`)

## Using dotnet watch (Optional)

For automatic backend restarts on file changes:

**Windows:**
```powershell
cd backend\PMS_APIs
dotnet watch run --urls http://localhost:5000
```

**Linux/Mac:**
```bash
cd backend/PMS_APIs
dotnet watch run --urls http://localhost:5000
```

## Environment Variables

### Frontend

You can set the backend URL using an environment variable:

**Windows:**
```powershell
$env:REACT_APP_API_URL="http://localhost:5000"
npm start
```

**Linux/Mac:**
```bash
export REACT_APP_API_URL="http://localhost:5000"
npm start
```

### Backend

Backend configuration is in:
- `backend/PMS_APIs/appsettings.json` (Production)
- `backend/PMS_APIs/appsettings.Development.json` (Development)

## Stopping the Servers

### Windows
- Close the terminal windows where the servers are running
- Or press `Ctrl+C` in each terminal

### Linux/Mac
- Press `Ctrl+C` in the terminal
- If using the script, press `Ctrl+C` once to stop both servers

## Additional Resources

- [React Documentation](https://react.dev/)
- [.NET Core Documentation](https://learn.microsoft.com/en-us/dotnet/core/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)

