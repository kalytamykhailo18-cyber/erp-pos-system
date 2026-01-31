@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo SCALE BRIDGE - INSTALADOR AUTOMATICO
echo ================================================================
echo.
echo Este instalador descargara e instalara automaticamente:
echo - Node.js 18 LTS (si no esta instalado)
echo - Scale Bridge con todas las dependencias
echo.
echo NO requiere Python ni Visual Studio Build Tools
echo.
pause

cd /d "%~dp0"

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js ya esta instalado:
    node --version
    goto :install_deps
)

echo.
echo Node.js NO encontrado. Descargando...
echo.

REM Download Node.js installer
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi' -OutFile 'node-installer.msi'}"

if not exist node-installer.msi (
    echo ERROR: No se pudo descargar Node.js
    echo Por favor descargue manualmente desde: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Instalando Node.js...
echo NOTA: Esto puede tardar 1-2 minutos
echo.

REM Install Node.js silently
msiexec /i node-installer.msi /quiet /norestart

REM Wait for installation
timeout /t 15 /nobreak >nul

REM Refresh environment variables
set "PATH=%PATH%;C:\Program Files\nodejs"

REM Check again
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Node.js instalado pero necesita reiniciar CMD
    echo.
    echo Por favor:
    echo 1. Cierre esta ventana
    echo 2. Abra CMD como Administrador nuevamente
    echo 3. Navegue a esta carpeta
    echo 4. Ejecute: npm install --omit=dev
    echo.
    pause
    exit /b 0
)

echo Node.js instalado correctamente
node --version

:install_deps
echo.
echo ================================================================
echo INSTALANDO DEPENDENCIAS DE SCALE BRIDGE
echo ================================================================
echo.
echo NOTA: Esto descargara binarios precompilados
echo No requiere compilacion ni Python
echo Puede tardar 5-10 minutos dependiendo de conexion
echo.

REM Try to install with prebuilt binaries first
call npm install --omit=dev --production --prefer-offline --no-audit --loglevel=error

if %errorlevel% neq 0 (
    echo.
    echo Primer intento fallo. Intentando con cache limpio...
    call npm cache clean --force
    call npm install --omit=dev --production --force
)

if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo ERROR: No se pudieron instalar las dependencias
    echo ================================================================
    echo.
    echo Posibles soluciones:
    echo 1. Verificar conexion a Internet
    echo 2. Ejecutar como Administrador
    echo 3. Desactivar antivirus temporalmente
    echo.
    echo Si el error persiste, contacte soporte con el mensaje de error
    echo.
    pause
    exit /b 1
)

REM Clean up installer
if exist node-installer.msi del /q node-installer.msi

echo.
echo ================================================================
echo INSTALACION COMPLETA
echo ================================================================
echo.
echo Scale Bridge esta listo para usar
echo.
echo SIGUIENTE PASO:
echo 1. Ir a: https://grettas-erp.com
echo 2. Configuracion ^> Balanza
echo 3. Configurar:
echo    - Protocolo: RS-232/Serial (Puerto COM)
echo    - Puerto COM: Verificar en Administrador de Dispositivos
echo      (Administrador Dispositivos ^> Puertos COM y LPT)
echo    - Baud Rate: 9600
echo    - Guardar
echo.
echo 4. Ejecutar: START.bat (en esta carpeta)
echo.
echo 5. En sistema web:
echo    Configuracion ^> Balanza ^> Probar Conexion
echo.
pause
