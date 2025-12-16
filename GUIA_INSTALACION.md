# Guía de Instalación y Despliegue en Servidor

Esta guía detalla paso a paso cómo subir la aplicación (Frontend React + Backend PHP) a un servidor de hosting compartido (cPanel/Apache).

## 1. Preparación del Frontend (React)

Antes de subir los archivos, necesitas configurar y construir la aplicación React.

### a. Verificar configuración de Vite
Abre el archivo `vite.config.ts`.
Actualmente tiene configurada la base para producción en `/web/site/`.
```typescript
base: mode === 'production' ? '/web/site/' : '/',
```
- **Si vas a subir tu web a la raíz del dominio (ej. `midominio.com`)**: Cambia esto a `'/'`.
- **Si vas a subir tu web a una subcarpeta**: Asegúrate de que coincida (ej. `/mi-carpeta/`).

### b. Generar el Build
Ejecuta el siguiente comando en tu terminal local para generar los archivos optimizados para producción:
```bash
npm run build
```
Esto creará una carpeta llamada `dist` con los archivos HTML, CSS y JS.

## 2. Estructura en el Servidor

Tu servidor (carpeta `public_html` o la carpeta de tu subdominio) debe quedar con esta estructura final:

```
public_html/
├── api/                  <-- Carpeta con todo el backend PHP
├── assets/               <-- Carpeta generada por el build de React
├── .env                  <-- Archivo de configuración (creado manualmente)
├── .htaccess             <-- Archivo de reglas de Apache (creado manualmente)
├── index.html            <-- Archivo generado por el build de React
└── ... otros archivos del build
```

### Pasos de subida (FileZilla / cPanel):
1.  Sube **todo el contenido** de la carpeta local `dist/` a la raíz de tu servidor (`public_html`).
2.  Sube la carpeta `api/` completa a la raíz de tu servidor.
3.  Asegúrate de que la carpeta `api/` incluya la carpeta `vendor/`. Si no está, deberás ejecutar `composer install` dentro de la carpeta `api` (ya sea localmente antes de subir o en el servidor vía terminal).

## 3. Configuración del Entorno (.env)

Debes crear un archivo llamado `.env` en la **raíz** de tu servidor (al mismo nivel que `index.html` y la carpeta `api/`).

**Nota:** Los archivos que empiezan con punto suelen estar ocultos. Asegúrate de activar "Mostrar archivos ocultos" en tu administrador de archivos.

Copia el siguiente contenido y ajústalo con tus datos reales:

```ini
# ==============================================
# CONFIGURACIÓN DEL ENTORNO
# ==============================================

# BASE DE DATOS
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nombre_de_tu_base_de_datos
DB_USER=usuario_de_tu_base_de_datos
DB_PASS=contraseña_de_tu_usuario
DB_CHARSET=utf8mb4

# APLICACIÓN
# Cambia a 'production' para ocultar errores en pantalla
APP_ENV=production
APP_DEBUG=false
# La URL completa de tu sitio web
APP_URL=https://tudominio.com

# ZONA HORARIA
TIMEZONE=Europe/Madrid

# CORS (Seguridad)
# Lista las URLs permitidas separadas por coma
ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com

# LÍMITES (Rate Limiting)
RATE_LIMIT_GENERAL=100
RATE_LIMIT_DOOR_UNLOCK=10
RATE_LIMIT_INCIDENTS=5
RATE_LIMIT_GUESTS=20

# LOGS
# Asegúrate de que esta ruta sea válida y escribible en tu servidor
# O usa una ruta relativa si es más fácil: ./api/logs/app.log
LOG_FILE=/home/usuario/public_html/api/logs/app.log

# SEGURIDAD
CHECKIN_EARLY_ACCESS_HOURS=4
```

## 4. Configuración del Servidor (.htaccess)

Necesitas dos archivos `.htaccess`:

### A. En la raíz (`public_html/.htaccess`)
Este archivo es crucial para que React maneje las rutas (SPA) y no den error 404 al recargar la página.

Crea o edita el archivo `public_html/.htaccess` con este contenido:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Si la petición es para la API, no aplicar reglas de React
  RewriteRule ^api/ - [L,NC]

  # Si el archivo o directorio existe, servirlo directamente
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Para todo lo demás, servir index.html (React Router)
  RewriteRule ^ index.html [L]
</IfModule>
```

**Nota:** Si tu web está en una subcarpeta (ej. `tudominio.com/appha`), cambia `RewriteBase /` por `RewriteBase /appha/`.

### B. En la carpeta API (`public_html/api/.htaccess`)
Este archivo ya debería existir si subiste la carpeta `api` completa. Asegúrate de que tenga este contenido para enrutar las peticiones al `index.php` de la API:

```apache
# VACANFLY API
RewriteEngine On

# Permitir Authorization Header
RewriteCond %{HTTP:Authorization} .
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# Redirigir todo a index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Proteger archivos sensibles
<FilesMatch "\.(env|ini|log|sh)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

## 5. Base de Datos

1.  Exporta tu base de datos local y súbela a tu servidor vía phpMyAdmin o consola.
2.  Asegúrate de que los datos en el archivo `.env` coincidan con los de tu hosting.

## 6. Permisos de Carpetas

Asegúrate de que las siguientes carpetas tengan permisos de escritura (generalmente 755 o 775):
- `api/logs`: Para que la aplicación pueda escribir los registros de errores.
- `uploads/` (si tu aplicación sube archivos).

## Resumen de Problemas Comunes

1.  **Error 404 en rutas profundas**: Falta el `.htaccess` en la raíz o `RewriteBase` incorrecto.
2.  **Error 500 en API**: Error en `.env` (credenciales DB mal) o permisos de carpetas. Revisa el `error_log` de PHP.
3.  **Pantalla en blanco**: `vite.config.ts` tiene mal el `base` path. Revisa la consola del navegador (F12) para ver errores de carga de archivos JS/CSS.
4.  **CORS Error**: La variable `ALLOWED_ORIGINS` en `.env` no incluye tu dominio exacto (ojo con http vs https y www).
