@echo off
echo ========================================
echo Building It's time! .exe file
echo ========================================
echo.

echo Installing dependencies...
call npm install

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

