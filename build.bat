@echo off
echo ========================================
echo Building It's time! .exe file
echo ========================================
echo.

echo Installing dependencies...
call npm install

echo.
echo Cleaning previous build...
if exist "dist\win-unpacked" (
    echo Closing any running instances...
    taskkill /F /IM "Its-time.exe" 2>nul
    taskkill /F /IM "It's time!.exe" 2>nul
    timeout /t 2 /nobreak >nul
    rmdir /S /Q "dist\win-unpacked" 2>nul
)
if exist "dist\*.exe" del /Q "dist\*.exe" 2>nul

echo.
echo Building portable .exe...
call npm run build:portable

echo.
echo ========================================
echo Build complete!
echo.
echo The .exe file is in the 'dist' folder:
echo   its-time-portable.exe
echo ========================================
pause

