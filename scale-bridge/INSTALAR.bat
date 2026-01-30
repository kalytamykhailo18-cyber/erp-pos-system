@echo off
echo ========================================
echo SCALE BRIDGE - INSTALACION KRETZ RS-232
echo ========================================
echo.
echo ADVERTENCIA: Implementacion RS-232 NO PROBADA
echo Este programa ha sido desarrollado pero NO verificado
echo con balanza Kretz fisica. Puede requerir ajustes.
echo.
pause

echo.
echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Por favor descargue e instale Node.js desde:
    echo https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado:
node --version

echo.
echo Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no esta instalado.
    echo.
    echo El modulo serialport REQUIERE Python para compilarse.
    echo Descargue e instale Python desde:
    echo https://www.python.org/downloads/
    echo.
    echo IMPORTANTE: Durante instalacion marcar "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo Python encontrado:
python --version

echo.
echo ========================================
echo INSTALANDO DEPENDENCIAS
echo ========================================
echo.
echo NOTA: Este proceso compilara el modulo serialport.
echo Puede tardar varios minutos y requiere:
echo - Python
echo - Visual Studio Build Tools
echo.
echo Si aparecen errores, instale Visual Studio Build Tools:
echo https://visualstudio.microsoft.com/downloads/
echo Buscar "Build Tools for Visual Studio 2022"
echo.
pause

echo.
echo Instalando...
call npm install --verbose

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudieron instalar las dependencias.
    echo.
    echo POSIBLES CAUSAS:
    echo 1. Python no esta en PATH
    echo 2. Visual Studio Build Tools no instalado
    echo 3. Permisos insuficientes (ejecute como Administrador)
    echo.
    echo Consulte README_CLIENTE.txt para instrucciones detalladas.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo CONFIGURACION - BALANZA KRETZ
echo ========================================
echo.
echo Para conectar via RS-232/Serial, necesita:
echo.
echo 1. Numero de Puerto COM
echo    Verificar en: Administrador de Dispositivos ^> Puertos (COM y LPT)
echo    Ejemplo: COM1, COM2, COM3
echo.
echo 2. Baud Rate (velocidad)
echo    Estandar Kretz: 9600
echo    Verificar en manual de su balanza
echo.
echo 3. Cable RS-232
echo    Conectado entre PC y balanza
echo    Balanza debe estar encendida
echo.
echo IMPORTANTE: Configure estos valores en el sistema web:
echo https://grettas-erp.com ^> Configuracion ^> Balanza
echo.
echo Protocolo: RS-232/Serial (Puerto COM)
echo Puerto COM: Verificar en Administrador de Dispositivos
echo Baud Rate: 9600 (o segun manual Kretz)
echo.
pause

echo.
echo ========================================
echo PROBANDO SCALE BRIDGE
echo ========================================
echo.
echo Se iniciara Scale Bridge en modo prueba.
echo Debe ver: "Connected to backend successfully"
echo.
echo Presione Ctrl+C para detener cuando vea la conexion exitosa.
echo.
pause

echo.
echo Iniciando Scale Bridge...
echo.
node index.js

echo.
echo ========================================
echo Si la conexion fue exitosa:
echo 1. Abrir https://grettas-erp.com
echo 2. Ir a: Configuracion ^> Balanza
echo 3. Configurar Puerto COM y Baud Rate
echo 4. Probar Conexion
echo 5. Si funciona, Sincronizar
echo.
echo NOTA: Esta es version BETA no probada con hardware real.
echo Reporte cualquier problema encontrado.
echo ========================================
pause
