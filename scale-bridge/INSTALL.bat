@echo off
echo ================================================
echo  Scale Bridge - Instalador Rapido
echo ================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script debe ejecutarse como Administrador
    echo.
    echo Haga click derecho en INSTALL.bat y seleccione "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instale Node.js 18.x o superior desde https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js instalado

echo.
echo [2/5] Instalando dependencias...
call npm install
if %errorLevel% neq 0 (
    echo ERROR: Fallo la instalacion de dependencias
    pause
    exit /b 1
)
echo OK - Dependencias instaladas

echo.
echo [3/5] Verificando configuracion...
if not exist ".env" (
    echo ADVERTENCIA: Archivo .env no encontrado
    echo.
    echo Por favor:
    echo 1. Copie .env.example a .env
    echo 2. Edite .env y configure el BRANCH_ID
    echo 3. Ejecute este script nuevamente
    echo.
    echo Consulte BRANCH_IDS.txt para ver los IDs de cada sucursal
    pause
    exit /b 1
)
echo OK - Archivo .env encontrado

echo.
echo [4/5] Probando el servicio...
echo Iniciando servicio por 5 segundos para verificar...
timeout /t 2 /nobreak >nul
start /b node index.js
timeout /t 5 /nobreak >nul
taskkill /f /im node.exe >nul 2>&1
echo OK - Prueba completada

echo.
echo [5/5] Instalando como servicio de Windows...
call npm run install-service
if %errorLevel% neq 0 (
    echo ERROR: Fallo la instalacion del servicio
    pause
    exit /b 1
)

echo.
echo ================================================
echo  INSTALACION COMPLETADA!
echo ================================================
echo.
echo El servicio "Scale Bridge" esta instalado y ejecutandose
echo.
echo Para verificar:
echo   1. Abra services.msc
echo   2. Busque "Scale Bridge"
echo   3. Estado debe ser "En ejecucion"
echo.
echo Logs en: %cd%\logs\
echo.
pause
