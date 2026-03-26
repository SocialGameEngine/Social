@echo off
echo Starting Docker Desktop and Supabase...
echo.
echo 1. Please start Docker Desktop from your Start menu
echo 2. Wait for Docker Desktop to fully load (Docker whale icon in system tray)
echo 3. Press any key when Docker Desktop is running...
pause > nul
echo.
echo Starting Supabase local development environment...
cd /d "%~dp0"
supabase start
echo.
echo Supabase started! Your local environment is ready.
echo.
echo Services:
echo - Studio: http://localhost:54323
echo - API: http://localhost:54321
echo - DB: localhost:54322
echo.
pause
