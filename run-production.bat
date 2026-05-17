@echo off
title PrintExpress - Production Launcher
echo =================================================================
echo             PRINTERPRESS FULL-STACK DOCKER LAUNCHER
echo =================================================================
echo.

:: Check if Docker is running
echo [1/3] Checking Docker environment...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or running. Please open Docker Desktop and try again.
    pause
    exit /b
)
echo [SUCCESS] Docker is active!
echo.

:: Build and launch containers
echo [2/3] Building and starting all Docker services...
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose failed to build and start containers.
    pause
    exit /b
)
echo [SUCCESS] Services launched successfully!
echo.

:: Run database migrations
echo [3/3] Waiting for database to initialize and running migrations...
timeout /t 5 >nul
docker-compose exec -T backend npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo [WARNING] Database migration command failed. If this is the first boot, please wait a moment and run 'docker-compose exec backend npx prisma migrate deploy' manually.
) else (
    echo [SUCCESS] Database schemas migrated and synced perfectly!
)
echo.

echo =================================================================
echo             DEPLOYMENT COMPLETE - ACCESS CHANNELS
echo =================================================================
echo.
echo   * Customer Web Portal  : http://localhost:3000
echo   * Private Admin Terminal: http://localhost:3000/admin/login
echo   * Backend REST Engine  : http://localhost:5000/api
echo.
echo   To stop all services in the future, run: 'docker-compose down'
echo.
echo =================================================================
pause
