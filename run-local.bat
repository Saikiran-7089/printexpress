@echo off
title PrintExpress - Local Dev Launcher
echo =================================================================
echo             PRINTEXPRESS LOCAL DEV LAUNCHER (SQLITE)
echo =================================================================
echo.

:: 1. Check & Install Server dependencies
echo [1/4] Checking backend dependencies...
if not exist "server\node_modules\" (
    echo [INFO] server/node_modules not found. Installing backend dependencies...
    cd server
    call npm install
    cd ..
) else (
    echo [SUCCESS] Backend dependencies are present!
)
echo.

:: 2. Check & Install Client dependencies
echo [2/4] Checking frontend dependencies...
if not exist "client\node_modules\" (
    echo [INFO] client/node_modules not found. Installing frontend dependencies...
    cd client
    call npm install
    cd ..
) else (
    echo [SUCCESS] Frontend dependencies are present!
)
echo.

:: 3. Generate Prisma client and Push SQLite schemas
echo [3/4] Initializing local SQLite database and Prisma client...
cd server
echo [Prisma] Generating Prisma client...
call npx prisma generate
echo [Prisma] Synchronizing SQLite database schemas...
call npx prisma db push
cd ..
echo [SUCCESS] SQLite database synced perfectly!
echo.

:: 4. Start concurrent processes in new windows
echo [4/4] Starting backend and frontend servers in concurrent windows...
echo.
echo   * Backend REST API: http://localhost:5000/api
echo   * Customer Web Portal: http://localhost:3000
echo   * Admin Console: http://localhost:3000/admin/login
echo.

start "PrintExpress Backend API Server" /d "server" cmd /k npm run start
start "PrintExpress Frontend UI Portal" /d "client" cmd /k npm run dev

echo [SUCCESS] Full-stack PrintExpress website is active and launching!
echo.
timeout /t 3 >nul
explorer "http://localhost:3000"
echo =================================================================
echo Launcher finished! You can close this window now.
echo =================================================================
pause
