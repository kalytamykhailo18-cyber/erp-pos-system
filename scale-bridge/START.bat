@echo off
title Scale Bridge - Kretz RS-232
echo ================================================================
echo SCALE BRIDGE - KRETZ RS-232
echo ================================================================
echo.
echo Iniciando servicio...
echo.
echo IMPORTANTE: NO cierre esta ventana
echo Presione Ctrl+C para detener el servicio
echo.
echo ================================================================
echo.

cd /d "%~dp0"
node index.js

echo.
echo Servicio detenido.
pause
