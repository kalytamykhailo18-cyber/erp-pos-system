SCALE BRIDGE - INSTALACIÓN PARA BALANZA KRETZ RS-232
=====================================================

⚠️⚠️⚠️ ADVERTENCIA CRÍTICA ⚠️⚠️⚠️
ESTA IMPLEMENTACIÓN RS-232 NO HA SIDO PROBADA CON HARDWARE REAL
El código ha sido desarrollado pero NO verificado con balanza Kretz física.
PUEDE REQUERIR AJUSTES después de pruebas reales.
NO GARANTIZAMOS que funcione en el primer intento.

VERSIÓN: 1.1.0-BETA (RS-232 IMPLEMENTADO, NO PROBADO)
FECHA: 2026-01-30
ESTADO: REQUIERE PRUEBAS CON HARDWARE REAL

REQUISITOS OBLIGATORIOS:
------------------------
1. PC Windows donde está conectada la balanza Kretz via RS-232
2. Puerto COM disponible (verificar en Administrador de Dispositivos)
3. Cable RS-232 conectado entre PC y balanza
4. Acceso a Internet (para conectar con backend)
5. Node.js 18 o superior
6. ⚠️ CRÍTICO: Python 3.x + Visual Studio Build Tools (VER ABAJO)

⚠️ REQUISITOS PARA COMPILAR SERIALPORT:
----------------------------------------
npm install intentará COMPILAR el módulo nativo "serialport".
Esto FALLARÁ si no tiene:

1. Python 3.x
   Descargar: https://www.python.org/downloads/
   ⚠️ Durante instalación: Marcar "Add Python to PATH"

2. Visual Studio Build Tools
   Descargar: https://visualstudio.microsoft.com/downloads/
   Buscar "Build Tools for Visual Studio 2022"
   Instalar componente: "Herramientas de compilación de C++"

SIN ESTOS, npm install FALLARÁ con errores de compilación.

INSTALACIÓN:
------------

1. Extraer este archivo en C:\scale-bridge\

2. Instalar Node.js (si no está instalado):
   https://nodejs.org/ - Versión LTS

3. ⚠️ Instalar Python 3.x (OBLIGATORIO):
   https://www.python.org/downloads/
   Marcar "Add Python to PATH" durante instalación

4. ⚠️ Instalar Visual Studio Build Tools (OBLIGATORIO):
   https://visualstudio.microsoft.com/downloads/
   Descargar "Build Tools for Visual Studio 2022"
   Seleccionar "Herramientas de compilación de C++"
   Esperar instalación completa (puede tardar 30+ minutos)

5. Reiniciar CMD después de instalar Python y Build Tools

6. Abrir CMD como Administrador

7. Navegar a la carpeta:
   cd C:\scale-bridge

8. Instalar dependencias:
   npm install

   ⚠️ SI APARECEN ERRORES:
   - Verificar Python instalado: python --version
   - Verificar Path incluye Python
   - Reiniciar CMD completamente
   - Intentar de nuevo: npm install --verbose

9. Configurar .env (solo si necesario, backend URL ya configurado)

10. Iniciar sesión en el sistema web:
    https://grettas-erp.com

11. Ir a: Configuración > Balanza

12. Configurar:
    - Protocolo: RS-232/Serial (Puerto COM)
    - Puerto COM: Verificar en Administrador de Dispositivos
    - Baud Rate: 9600 (verificar con manual Kretz)
    - Habilitar sincronización

13. Guardar configuración

14. En CMD, ejecutar Scale Bridge:
    node index.js

    ⚠️ Debe ver: "Connected to backend successfully"

15. Probar conexión desde el sistema web:
    Configuración > Balanza > Probar Conexión

16. Si funciona, sincronizar:
    Configuración > Balanza > Sincronizar Ahora

⚠️⚠️⚠️ LO QUE NO SABEMOS (REQUIERE PRUEBAS) ⚠️⚠️⚠️
- ¿El formato CSV es correcto para su modelo Kretz?
- ¿Los terminadores de línea (\r\n) son correctos?
- ¿El delay de 50ms entre líneas es apropiado?
- ¿La balanza envía confirmaciones?
- ¿Los códigos PLU se procesan correctamente?
- ¿La configuración 9600-8-N-1 es correcta para su balanza?

TODO ESTO DEBE SER VERIFICADO CON SU BALANZA ESPECÍFICA.

VERIFICAR PUERTO COM:
---------------------
1. Windows + X
2. Administrador de Dispositivos
3. Expandir "Puertos (COM y LPT)"
4. Buscar "Puerto de comunicaciones (COMx)"
5. Anotar número (ej: COM1, COM2, COM3)

Si NO aparece:
- Cable RS-232 no está conectado
- Falta driver (si usa adaptador USB-Serial)
- Puerto no habilitado en BIOS

CONFIGURACIÓN TÍPICA (NO VERIFICADA):
-------------------------------------
⚠️ Estos valores son TÍPICOS pero NO verificados:
- Baud Rate: 9600
- Data Bits: 8
- Stop Bits: 1
- Parity: None

CONSULTE EL MANUAL DE SU BALANZA KRETZ para confirmar.
Valores incorrectos = comunicación fallará.

SOLUCIÓN DE PROBLEMAS:
----------------------

Error "npm install" falla con "gyp ERR":
- NO tiene Python instalado
- NO tiene Visual Studio Build Tools instalado
- Cerrar CMD, instalar Python + Build Tools, reiniciar CMD

Error "Serial port open failed":
- Número de puerto COM incorrecto
- Otro programa usa el puerto (cerrar software de balanza)
- Drivers faltantes (adaptador USB-Serial)
- Puerto deshabilitado

Error "Scale Bridge not connected":
- node index.js no está ejecutándose
- Sin internet
- Firewall bloquea Node.js
- Revisar C:\ScaleBridge\logs\combined.log

Error al sincronizar:
- Balanza apagada
- Cable desconectado
- Configuración serial incorrecta (baud rate, etc.)
- ⚠️ Protocolo no compatible con su modelo
- Revisar C:\ScaleBridge\logs\combined.log para ver qué falla

Balanza no responde:
- ⚠️ El formato de datos puede ser incorrecto
- ⚠️ Los terminadores de línea pueden ser incorrectos
- ⚠️ El delay entre líneas puede ser muy rápido/lento
- ⚠️ El protocolo puede requerir comandos iniciales
- REPORTAR LOGS COMPLETOS para diagnóstico

INSTALAR COMO SERVICIO (SOLO SI FUNCIONA):
-------------------------------------------
⚠️ NO INSTALAR como servicio hasta verificar que funciona correctamente.

Después de pruebas exitosas:
1. node install-service.js (CMD como Admin)
2. Verificar en services.msc

Para desinstalar: node uninstall-service.js

LOGS:
-----
Ubicación: C:\ScaleBridge\logs\
- combined.log: Todos los eventos
- error.log: Solo errores

Revisar SIEMPRE los logs si algo falla.

REPORTE DE PROBLEMAS:
---------------------
Si encuentra problemas, DEBE reportar:

1. Modelo EXACTO de su balanza Kretz
2. Configuración serial del manual Kretz
3. Contenido de C:\ScaleBridge\logs\combined.log (últimas 50 líneas)
4. Contenido de C:\ScaleBridge\logs\error.log
5. Qué paso específico falla

SIN ESTA INFORMACIÓN no podemos ayudar.

LIMITACIONES CONOCIDAS:
-----------------------
- NO probado con hardware real
- Formato CSV basado en asunciones
- Protocolo puede requerir ajustes
- Delays pueden no ser óptimos
- npm install requiere compilación (puede fallar)

ESTO ES SOFTWARE BETA. ÚSELO BAJO SU PROPIO RIESGO.
