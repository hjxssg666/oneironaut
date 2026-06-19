@echo off
cd /d "%~dp0"

set npm_config_cache=%LOCALAPPDATA%\npm-cache

:: Kill any process on port 5178
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5178') do taskkill /PID %%a /F 2>nul

echo ================================
echo   Oneironaut - Starting...
echo   Port: 5178
echo ================================

if not exist "node_modules\" (
    echo [1/2] Installing dependencies...
    call npm install
)

echo [2/2] Starting dev server...
call npx vite --port 5178 --strictPort

pause
