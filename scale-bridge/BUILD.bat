@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo SCALE BRIDGE - BUILD .EXE
echo ================================================================
echo.

cd /d "%~dp0"

REM Install caxa if not present
call npm install -g caxa

if %errorlevel% neq 0 (
    echo ERROR: Failed to install caxa
    pause
    exit /b 1
)

REM Install dependencies first
echo Installing dependencies...
call npm install --omit=dev

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

REM Create dist folder
if not exist dist mkdir dist

REM Build with caxa
echo.
echo Building ScaleBridge.exe...
echo This may take 1-2 minutes...
echo.

call npx caxa --input . --output "dist\ScaleBridge.exe" -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/index.js"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ================================================================
echo BUILD COMPLETE
echo ================================================================
echo.
echo File created: dist\ScaleBridge.exe
echo Size: ~50-60 MB
echo.
echo This .exe includes:
echo - Node.js runtime
echo - All dependencies (serialport, socket.io-client, etc.)
echo - Complete Scale Bridge code
echo.
echo Logs will be written to: C:\ScaleBridge\logs\
echo.
echo You can now send dist\ScaleBridge.exe to the client.
echo.
pause
