@echo off
REM ======================================================
REM  Galaxy Rescue — RPA Mission Game Launcher
REM  Run this to start BOTH the backend and frontend.
REM ======================================================
echo.
echo  ==============================
echo   GALAXY RESCUE - RPA MISSION
echo  ==============================
echo.

REM Check planet_data.xlsx exists, create if not
if not exist "backend\planet_data.xlsx" (
    echo [SETUP] Creating planet_data.xlsx...
    "C:\Users\andro\AppData\Local\Programs\Python\Python314\python.exe" backend\create_excel.py
    echo.
)

echo [1/2] Starting Python RPA backend on port 5050...
start "Galaxy Rescue - RPA Backend" /MIN cmd /c ""C:\Users\andro\AppData\Local\Programs\Python\Python314\python.exe" backend\app.py"

echo [INFO] Waiting 2 seconds for backend to start...
timeout /t 2 /nobreak > nul

echo [2/2] Starting React frontend on port 5173...
start "Galaxy Rescue - Frontend" cmd /c "cd galaxy-rescue && npm run dev"

echo.
echo  Both servers starting...
echo  Open in browser: http://localhost:5173/
echo.
echo  Backend API:     http://localhost:5050/api/health
echo  Planet data:     backend\planet_data.xlsx (open in Excel to see/edit)
echo.
echo  Press any key to stop both servers.
pause > nul

echo Stopping servers...
taskkill /FI "WINDOWTITLE eq Galaxy Rescue - RPA Backend" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq Galaxy Rescue - Frontend"    /F > nul 2>&1
echo Done.
