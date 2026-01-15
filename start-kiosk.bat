@echo off
REM GolfScoreID Photo Booth - Kiosk Startup Script
REM This script starts the web server and launches Chrome in kiosk mode

echo Starting GolfScoreID Photo Booth...

REM Change to the application directory
cd /d "%~dp0"

REM Start the web server in the background
echo Starting web server...
start /B npx serve -s dist -l 5173

REM Wait for server to start
echo Waiting for server to start...
timeout /t 5 /nobreak

REM Launch Chrome in kiosk mode
echo Launching kiosk mode...
start chrome.exe --kiosk --app=http://localhost:5173 --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state

echo Kiosk mode started successfully!
