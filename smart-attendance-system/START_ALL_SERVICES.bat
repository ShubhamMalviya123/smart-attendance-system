@echo off
echo ============================================
echo Starting Smart Attendance System
echo This will open 2 new windows: AI Service and Frontend.
echo Start the Backend separately from IntelliJ.
echo ============================================
start "AI Service" cmd /k "%~dp0start-ai-service.bat"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "%~dp0start-frontend.bat"
echo.
echo Both windows are launching. Once you see:
echo   - AI Service: "Application startup complete"
echo   - Frontend: "Compiled successfully"
echo the app is ready at http://localhost:3000
echo.
echo Remember to also start the Backend in IntelliJ.
pause
