@echo off
TITLE It's Time! - Development Mode
echo Checking dependencies...
if not exist node_modules (
    echo node_modules not found. Installing...
    call npm install
)
echo Starting the application...
call npm start
pause
