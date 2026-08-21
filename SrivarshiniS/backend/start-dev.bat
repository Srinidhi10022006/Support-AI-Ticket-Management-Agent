@echo off
echo.
echo ╔══════════════════════════════════╗
echo ║     TicketAI Backend Setup       ║
echo ╚══════════════════════════════════╝
echo.
cd /d "%~dp0"
echo [1/3] Installing dependencies...
call npm install
echo.
echo [2/3] Dependencies installed!
echo.
echo [3/3] Starting development server...
echo       (Run seeder first: npm run seed)
echo.
call npm run dev
pause
