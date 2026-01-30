SCALE BRIDGE - INSTALACIÓN PARA BALANZA KRETZ RS-232
=====================================================

VERSIÓN: 1.1.0 con soporte RS-232/Serial
FECHA: 2026-01-30

REQUISITOS:
-----------
1. PC Windows donde está conectada la balanza Kretz via RS-232
2. Puerto COM disponible (verificar en Administrador de Dispositivos)
3. Cable RS-232 conectado entre PC y balanza
4. Acceso a Internet (para conectar con backend)
5. Node.js 18 o superior

INSTALACIÓN:
------------

1. Extraer este archivo en C:\scale-bridge\

2. Instalar Node.js si no está instalado:
   Descargar desde: https://nodejs.org/
   Versión LTS recomendada

3. Abrir CMD como Administrador

4. Navegar a la carpeta:
   cd C:\scale-bridge

5. Instalar dependencias:
   npm install

6. Configurar el archivo .env con sus datos:
   - No tocar BACKEND_URL ni LOG_LEVEL
   - Configurar timeouts si es necesario

7. Iniciar sesión en el sistema web:
   https://grettas-erp.com

8. Ir a Configuración > Balanza

9. Configurar:
   - Protocolo: RS-232/Serial (Puerto COM)
   - Puerto COM: COM1, COM2, etc (verificar en Administrador de Dispositivos)
   - Baud Rate: 9600 (Kretz Standard)
   - Habilitar sincronización

10. Guardar configuración

11. En CMD, ejecutar Scale Bridge:
    node index.js

12. Probar conexión desde el sistema web:
    Configuración > Balanza > Probar Conexión

13. Si funciona, sincronizar:
    Configuración > Balanza > Sincronizar Ahora

VERIFICAR PUERTO COM:
---------------------
1. Abrir "Administrador de Dispositivos" (Windows + X)
2. Expandir "Puertos (COM y LPT)"
3. Buscar "Puerto de comunicaciones (COMx)"
4. Anotar el número del puerto (ej: COM1, COM2, COM3)

Si no aparece:
- Verificar cable RS-232 conectado
- Instalar drivers si usa adaptador USB-Serial
- Reiniciar PC

CONFIGURACIÓN KRETZ REPORT/SINGLE:
-----------------------------------
Configuración estándar para Kretz Report y Single:
- Baud Rate: 9600
- Data Bits: 8
- Stop Bits: 1
- Parity: None

SOLUCIÓN DE PROBLEMAS:
----------------------

Error "Serial port open failed":
- Verificar número de puerto COM correcto
- Cerrar otros programas que usen el puerto COM
- Verificar drivers instalados

Error "Scale Bridge not connected":
- Verificar que el servicio esté ejecutándose (node index.js)
- Verificar conexión a Internet
- Revisar logs en logs/combined.log

Error al sincronizar:
- Verificar que la balanza esté encendida
- Verificar cable RS-232 conectado correctamente
- Revisar logs para ver respuesta de la balanza

INSTALAR COMO SERVICIO DE WINDOWS:
-----------------------------------
Una vez que funciona correctamente:

1. Editar install-service.js
   - Verificar rutas correctas

2. En CMD como Administrador:
   node install-service.js

3. El servicio se iniciará automáticamente con Windows

Para desinstalar:
   node uninstall-service.js

LOGS:
-----
Los logs se guardan en: C:\scale-bridge\logs\
- combined.log: Todos los eventos
- error.log: Solo errores

SOPORTE:
--------
Revisar logs y reportar errores específicos.
