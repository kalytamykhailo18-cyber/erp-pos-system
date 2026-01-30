@echo off
echo ========================================
echo SCALE BRIDGE - INSTALACION
echo ========================================
echo.
echo Este programa debe ejecutarse en una PC Windows
echo ubicada en la sucursal, en la misma red que la balanza.
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
echo Instalando dependencias...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias.
    pause
    exit /b 1
)

echo.
echo ========================================
echo CONFIGURACION REQUERIDA
echo ========================================
echo.
echo Antes de continuar, necesitamos la siguiente informacion:
echo.
echo 1. Direccion IP de la balanza iTegra
echo    Ejemplo: 192.168.1.50
echo.
echo 2. Protocolo de conexion
echo    ¿La balanza usa FTP, HTTP, o carpeta compartida?
echo.
echo 3. Puerto (si usa FTP o HTTP)
echo    FTP usa puerto 21
echo    HTTP usa puerto 80 o 8080
echo.
echo 4. Credenciales (si las requiere)
echo    Usuario y contraseña
echo.
echo 5. Ruta del archivo
echo    Ejemplo: /PRECIOLU.TXT o /ARTICULO.TXT
echo.
echo Por favor consulte el manual de la balanza iTegra
echo o contacte al soporte tecnico del fabricante.
echo.
pause

echo.
echo ========================================
echo Edite el archivo .env con la informacion correcta
echo ========================================
notepad .env

echo.
echo ¿Desea probar la conexion ahora? (S/N)
set /p test="Presione S para probar: "

if /i "%test%"=="S" (
    echo.
    echo Iniciando Scale Bridge...
    echo Presione Ctrl+C para detener
    echo.
    node index.js
)

pause
