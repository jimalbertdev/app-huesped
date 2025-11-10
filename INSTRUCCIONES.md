# 🚀 INSTRUCCIONES DE INSTALACIÓN Y DESPLIEGUE

> **VACANFLY Guest Application** - Sistema completo de gestión de huéspedes para alojamientos turísticos

**Última actualización:** 2025-11-10
**Versión:** 0.2.0

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#-requisitos-previos)
2. [Instalación en Desarrollo](#-instalación-en-desarrollo)
3. [Instalación en Producción](#-instalación-en-producción)
4. [Configuración](#-configuración)
5. [Endpoints Disponibles](#-endpoints-disponibles)
6. [Estructura del Proyecto](#-estructura-del-proyecto)
7. [Base de Datos](#-base-de-datos)
8. [Solución de Problemas](#-solución-de-problemas)

---

## 📦 Requisitos Previos

### Servidor
- **PHP** >= 7.4 (recomendado 8.0+)
- **MySQL** >= 5.7 o **MariaDB** >= 10.2
- **Apache** 2.4+ con `mod_rewrite` habilitado
- **Composer** 2.x (para dependencias PHP)

### Desarrollo Local
- **Node.js** >= 16.x
- **npm** >= 8.x
- **Git**

### Extensiones PHP Requeridas
```bash
# Verificar extensiones instaladas
php -m | grep -E 'pdo|pdo_mysql|mbstring|json|openssl'
```

Debe tener:
- `pdo`
- `pdo_mysql`
- `mbstring`
- `json`
- `openssl`

---

## 🛠 Instalación en Desarrollo

### Paso 1: Clonar el Repositorio

```bash
cd /var/www/html/
git clone <repository-url> app_huesped
cd app_huesped
```

### Paso 2: Instalar Dependencias

#### Frontend (React + TypeScript)
```bash
npm install
```

#### Backend (PHP)
```bash
cd api
composer install
cd ..
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
nano .env
```

**Archivo `.env` de ejemplo:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moon_desarrollo
DB_USER=root
DB_PASS=12345678
DB_CHARSET=utf8mb4

# Application Configuration
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost.local/app_huesped
TIMEZONE=Europe/Madrid

# CORS Configuration
ALLOWED_ORIGINS=http://localhost.local:8080,http://localhost:8080,http://localhost:5173

# Rate Limiting
RATE_LIMIT_GENERAL=100
RATE_LIMIT_DOOR_UNLOCK=10
RATE_LIMIT_INCIDENTS=5
RATE_LIMIT_GUESTS=20

# Logging
LOG_LEVEL=debug
LOG_FILE=/var/www/html/app_huesped/logs/app.log

# Security
CHECKIN_EARLY_ACCESS_HOURS=4
```

### Paso 4: Instalar Base de Datos

#### Opción A: Instalador Automatizado (RECOMENDADO)

```bash
cd database
php install.php
```

Este script ejecuta automáticamente:
- ✅ Crea la base de datos si no existe
- ✅ Ejecuta `schema.sql` con todas las tablas base
- ✅ Ejecuta todas las migraciones en orden (`003_*.sql`, `007_*.sql`, `008_*.sql`)
- ✅ Crea las carpetas `uploads/` con permisos correctos
- ✅ Inserta datos de ejemplo para testing
- ✅ Crea vistas SQL necesarias

**Salida esperada:**
```
===========================================
VACANFLY - Instalador de Base de Datos
===========================================

1. Conectando a MySQL...
   ✓ Conexión exitosa

2. Verificando base de datos 'moon_desarrollo'...
   ✓ Base de datos lista

3. Ejecutando schema.sql...
   ✓ Tabla: hosts
   ✓ Tabla: accommodations
   ✓ Tabla: reservations
   ...
   ✓ Total ejecutados: 47 comandos

4. Creando vistas base...
   ✓ v_reservations_full
   ✓ v_guests_with_reservation

5. Ejecutando migraciones...
   → Ejecutando: 003_accommodation_info_tables.sql
   ✓ 003_accommodation_info_tables.sql completada
   → Ejecutando: 007_add_signature_and_contract_to_guests.sql
   ✓ 007_add_signature_and_contract_to_guests.sql completada
   → Ejecutando: 008_create_view_reservations_with_host.sql
   ✓ 008_create_view_reservations_with_host.sql completada

6. Verificando carpetas de uploads...
   ✓ Creada: uploads/signatures/
   ✓ Creada: uploads/contracts/
   ✓ Creada: uploads/documents/

7. Verificando instalación...
   ✓ Tablas/Vistas totales: 19
   ✓ Anfitriones: 1
   ✓ Alojamientos: 1
   ✓ Reservas: 1
   ✓ Info de alojamientos: 1
   ✓ Videos: 3
   ✓ Categorías de guía: 7
   ✓ Items de guía local: 19

===========================================
✓ INSTALACIÓN COMPLETADA EXITOSAMENTE
===========================================
```

#### Opción B: Ejecutar Solo Migraciones

Si ya tienes la base de datos instalada:
```bash
cd database
php install.php --skip-schema
```

#### Opción C: Manual con MySQL

```bash
# Ejecutar schema base
mysql -u root -p12345678 < database/schema.sql

# Ejecutar migraciones en orden
mysql -u root -p12345678 moon_desarrollo < database/migrations/003_accommodation_info_tables.sql
mysql -u root -p12345678 moon_desarrollo < database/migrations/007_add_signature_and_contract_to_guests.sql
mysql -u root -p12345678 moon_desarrollo < database/migrations/008_create_view_reservations_with_host.sql

# Crear carpetas de uploads
mkdir -p uploads/signatures uploads/contracts uploads/documents
chmod 755 uploads -R
```

### Paso 5: Iniciar Servidor de Desarrollo

```bash
# Frontend (puerto 8080)
npm run dev
```

El frontend estará disponible en: `http://localhost:8080`

El backend (API) estará en: `http://localhost.local/app_huesped/api`

### Paso 6: Verificar Instalación

```bash
# Verificar API
curl http://localhost.local/app_huesped/api/health

# Verificar reserva de ejemplo
curl http://localhost.local/app_huesped/api/reservations/RES-2024-001

# Verificar info de alojamiento
curl http://localhost.local/app_huesped/api/accommodation/1
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "data": {
    "status": "ok",
    "version": "1.0.0"
  }
}
```

---

## 🚀 Instalación en Producción

### Paso 1: Preparar Archivos

```bash
# En tu máquina de desarrollo, compilar frontend
npm run build

# Esto genera la carpeta /dist/ con archivos optimizados
```

### Paso 2: Subir Archivos al Servidor

Sube los siguientes archivos/carpetas al servidor:

```
servidor:/var/www/html/app_huesped/
├── dist/                    ← Build compilado del frontend
├── api/                     ← Backend PHP completo
├── database/                ← Schema y migraciones
├── uploads/                 ← Crear si no existe (755)
├── .env                     ← Configurar para producción
└── .htaccess               ← Redirecciones Apache (opcional)
```

**Comando rsync recomendado:**
```bash
rsync -avz --exclude 'node_modules' \
  --exclude 'src' \
  --exclude '.git' \
  --exclude 'logs' \
  /ruta/local/app_huesped/ \
  usuario@servidor:/var/www/html/app_huesped/
```

### Paso 3: Configurar Producción

#### 3.1. Variables de Entorno (.env)

```env
# PRODUCCIÓN
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tudominio.com

# Database (usar credenciales reales)
DB_HOST=localhost
DB_NAME=vacanfly_production
DB_USER=vacanfly_user
DB_PASS=contraseña_segura_aquí

# CORS (dominio específico)
ALLOWED_ORIGINS=https://tudominio.com

# Seguridad
CHECKIN_EARLY_ACCESS_HOURS=4
```

#### 3.2. Permisos de Archivos

```bash
# Conectar al servidor
ssh usuario@servidor

cd /var/www/html/app_huesped

# Permisos de uploads (escribible por Apache)
chown -R www-data:www-data uploads/
chmod 755 uploads/ -R

# Permisos del API (lectura)
chmod 644 api/*.php -R

# Proteger .env
chmod 600 .env
```

#### 3.3. Configurar Apache

**VirtualHost para el frontend (dist/):**
```apache
<VirtualHost *:80>
    ServerName tudominio.com
    DocumentRoot /var/www/html/app_huesped/dist

    <Directory /var/www/html/app_huesped/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # API Alias
    Alias /api /var/www/html/app_huesped/api
    <Directory /var/www/html/app_huesped/api>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>

    # Proteger uploads (solo PHP puede acceder)
    <Directory /var/www/html/app_huesped/uploads>
        Options -Indexes
        Require all denied
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/vacanfly-error.log
    CustomLog ${APACHE_LOG_DIR}/vacanfly-access.log combined
</VirtualHost>

# Redirigir HTTP a HTTPS
<VirtualHost *:80>
    ServerName tudominio.com
    Redirect permanent / https://tudominio.com/
</VirtualHost>

# HTTPS (con certificado SSL)
<VirtualHost *:443>
    ServerName tudominio.com
    DocumentRoot /var/www/html/app_huesped/dist

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/tudominio.crt
    SSLCertificateKeyFile /etc/ssl/private/tudominio.key

    # ... mismo contenido que el VirtualHost *:80 de arriba
</VirtualHost>
```

#### 3.4. Habilitar SSL con Let's Encrypt (Recomendado)

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-apache

# Obtener certificado
sudo certbot --apache -d tudominio.com

# Renovar automáticamente (cron)
sudo certbot renew --dry-run
```

### Paso 4: Instalar Base de Datos en Producción

```bash
ssh usuario@servidor
cd /var/www/html/app_huesped/database

# Asegúrate de que .env tiene las credenciales correctas
php install.php
```

### Paso 5: Verificar Instalación

```bash
# Verificar API
curl https://tudominio.com/api/health

# Verificar frontend
curl https://tudominio.com
```

---

## ⚙️ Configuración

### Frontend

El frontend detecta automáticamente el entorno:

**Desarrollo:**
- URL: `http://localhost:8080`
- API: `http://localhost.local/app_huesped/api`
- Hot reload activo

**Producción:**
- URL: `https://tudominio.com`
- API: `https://tudominio.com/api`
- Archivos optimizados en `/dist/`

### Backend API

Configuración principal en `api/config/database.php`:

```php
// Carga automáticamente variables de .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../..');
$dotenv->load();

define('DB_HOST', $_ENV['DB_HOST']);
define('DB_NAME', $_ENV['DB_NAME']);
define('DB_USER', $_ENV['DB_USER']);
define('DB_PASS', $_ENV['DB_PASS']);
```

### CORS (api/config/cors.php)

**Desarrollo:**
```php
header("Access-Control-Allow-Origin: *");
```

**Producción:**
```php
$allowed_origins = explode(',', $_ENV['ALLOWED_ORIGINS']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
```

---

## 📡 Endpoints Disponibles

### 🏠 Reservas

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| GET | `/api/reservations/{code}` | Obtener reserva por código | No |
| GET | `/api/reservations/{id}/dashboard` | Dashboard completo con todos los datos | No |

**Ejemplo:**
```bash
curl http://localhost/app_huesped/api/reservations/RES-2024-001
```

### 👥 Huéspedes

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| POST | `/api/guests` | Registrar nuevo huésped | No |
| GET | `/api/guests/{id}` | Obtener huésped por ID | No |
| GET | `/api/guests/reservation/{reservation_id}` | Listar huéspedes de una reserva | No |
| PUT | `/api/guests/{id}` | Actualizar datos de huésped | No |

**Ejemplo POST:**
```bash
curl -X POST http://localhost/app_huesped/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+34123456789",
    "document_type": "passport",
    "document_number": "AB123456",
    "is_responsible": false
  }'
```

### ⚙️ Preferencias

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| GET | `/api/preferences/{reservation_id}` | Obtener preferencias de estancia | No |
| POST | `/api/preferences` | Crear/actualizar preferencias | No |

**Ejemplo POST:**
```bash
curl -X POST http://localhost/app_huesped/api/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": 1,
    "needs_crib": false,
    "double_beds": 2,
    "single_beds": 0,
    "sofa_beds": 1,
    "estimated_arrival_time": "14:00",
    "additional_info": "Sin preferencias especiales"
  }'
```

### 🏨 Alojamiento (NUEVO)

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| GET | `/api/accommodation/{id}` | Toda la información (info + videos + guía) | No |
| GET | `/api/accommodation/{id}/info` | Solo información general | No |
| GET | `/api/accommodation/{id}/videos` | Solo videos de bienvenida | No |
| GET | `/api/accommodation/{id}/guide` | Solo guía local | No |

**Ejemplo:**
```bash
curl http://localhost/app_huesped/api/accommodation/1
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "info": {
      "how_to_arrive_airport": "Desde el aeropuerto...",
      "amenities": "WiFi, TV, Cocina...",
      "wifi_network": "MiWiFi",
      "wifi_password": "12345678"
    },
    "videos": [
      {
        "id": 1,
        "title": "Bienvenida al alojamiento",
        "video_url": "https://youtube.com/..."
      }
    ],
    "guide": [
      {
        "id": 1,
        "title": {"es": "Restaurantes", "en": "Restaurants"},
        "items": [...]
      }
    ]
  }
}
```

### 🚪 Puertas

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| POST | `/api/doors/unlock` | Abrir puerta (portal/alojamiento) | No |
| GET | `/api/doors/history/{reservation_id}` | Historial de aperturas | No |

### 🛠️ Incidencias

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| POST | `/api/incidents` | Crear incidencia/queja/sugerencia | No |
| GET | `/api/incidents/{reservation_id}` | Obtener incidencias de una reserva | No |

---

## 📁 Estructura del Proyecto

```
/var/www/html/app_huesped/
│
├── 📂 src/                              # Frontend (React + TypeScript)
│   ├── assets/                          # Imágenes, logos
│   ├── components/ui/                   # Componentes shadcn/ui
│   ├── hooks/                           # Custom hooks
│   │   ├── useLanguage.tsx             # Traducciones (6 idiomas)
│   │   ├── useReservation.tsx          # Estado de reserva
│   │   └── useRegistrationFlow.tsx     # Flujo de registro
│   ├── pages/                           # Páginas/rutas
│   │   ├── Welcome.tsx                 # Landing page
│   │   ├── Register.tsx                # Registro paso 1
│   │   ├── RegisterPreferences.tsx     # Registro paso 2
│   │   ├── RegisterTerms.tsx           # Registro paso 3 (firma)
│   │   ├── RegisterConfirmation.tsx    # Confirmación
│   │   └── Dashboard.tsx               # Dashboard principal
│   ├── services/api.ts                  # Cliente API con axios
│   └── App.tsx                          # Componente raíz
│
├── 📂 api/                              # Backend (PHP REST API)
│   ├── config/                          # Configuración
│   │   ├── database.php                # Conexión MySQL + .env
│   │   └── cors.php                    # CORS headers
│   ├── includes/                        # Clases core
│   │   ├── Database.php                # Singleton PDO
│   │   ├── Response.php                # Helper JSON
│   │   ├── Logger.php                  # Sistema de logs
│   │   └── Validator.php               # Validación
│   ├── models/                          # Modelos de datos
│   │   ├── Reservation.php
│   │   ├── Guest.php
│   │   ├── Preference.php              # ✅ Bug fix aplicado
│   │   ├── DoorUnlock.php
│   │   └── Incident.php
│   ├── services/                        # Servicios de lógica
│   │   └── ContractService.php         # Generación de PDFs
│   ├── endpoints/                       # Endpoints API
│   │   ├── reservations.php
│   │   ├── guests.php
│   │   ├── preferences.php
│   │   ├── accommodation.php           # ✅ NUEVO
│   │   ├── doors.php
│   │   └── incidents.php
│   ├── index.php                        # Router principal
│   ├── .htaccess                        # Rewrite rules
│   └── vendor/                          # Dependencias Composer
│
├── 📂 database/                         # Base de datos
│   ├── schema.sql                       # Esquema completo base
│   ├── install.php                      # ✅ Instalador actualizado
│   └── migrations/                      # Migraciones SQL
│       ├── 003_accommodation_info_tables.sql  # ✅ NUEVO
│       ├── 007_add_signature_and_contract_to_guests.sql
│       └── 008_create_view_reservations_with_host.sql
│
├── 📂 uploads/                          # Archivos subidos
│   ├── signatures/                      # Firmas digitales
│   ├── contracts/                       # Contratos PDF
│   └── documents/                       # Documentos de identidad
│
├── 📂 dist/                             # Build de producción
│   ├── assets/                          # JS/CSS optimizados
│   └── index.html                       # HTML principal
│
├── 📂 spec/                             # Especificaciones técnicas
├── 📂 logs/                             # Logs de la aplicación
│
├── 📄 .env                              # Variables de entorno
├── 📄 .env.example                      # Template de .env
├── 📄 package.json                      # Dependencias Node
├── 📄 composer.json                     # Dependencias PHP
├── 📄 vite.config.ts                    # Config Vite
├── 📄 tsconfig.json                     # Config TypeScript
├── 📄 tailwind.config.ts                # Config Tailwind
├── 📄 INSTRUCCIONES.md                  # Este archivo
├── 📄 CLAUDE.md                         # Contexto para Claude Code
├── 📄 PROJECT_CONTEXT.md                # Contexto del proyecto
└── 📄 SESSION_LOG.md                    # Registro de sesiones
```

---

## 🗄️ Base de Datos

### Tablas Principales (19 total)

#### Core
1. **hosts** - Anfitriones/propietarios
2. **accommodations** - Alojamientos/propiedades
3. **reservations** - Reservas de huéspedes
4. **guests** - Huéspedes registrados (con firma y contrato)

#### Preferencias y Servicios
5. **preferences** - Preferencias de estancia (camas, cuna, hora llegada)
6. **door_unlocks** - Historial de aperturas de puertas
7. **incidents** - Incidencias/quejas/sugerencias
8. **reservation_languages** - Idiomas preferidos por reserva

#### Contenido Multimedia
9. **welcome_videos** - Videos de bienvenida (legacy)

#### Guía Local (legacy, deprecados)
10. **local_guide_items** - Items de guía local

#### ✅ NUEVAS: Sistema de Alojamiento
11. **accommodation_info** - Información detallada del alojamiento
12. **accommodation_videos** - Videos de bienvenida por alojamiento
13. **accommodation_guide_categories** - Categorías de guía (multiidioma)
14. **accommodation_guide_items** - Items de guía por alojamiento

### Vistas SQL

1. **v_reservations_full** - Reservas con datos de alojamiento y anfitrión
2. **v_guests_with_reservation** - Huéspedes con datos de reserva
3. **v_reservations_with_host** - Vista para generación de contratos PDF

### Datos de Ejemplo Incluidos

- ✅ 1 Anfitrión: María García
- ✅ 1 Alojamiento: Casa Vista Hermosa (con info completa)
- ✅ 1 Reserva: RES-2024-001 (15-18 Nov 2024, 2 huéspedes)
- ✅ 3 Videos de bienvenida
- ✅ 7 Categorías de guía local (restaurantes, cafés, supermercados, transporte, turismo, emergencias, entretenimiento)
- ✅ 19 Items de guía local con datos reales

---

## 🔧 Solución de Problemas

### Error: "API no encontrada" o 404

**Causa:** Apache no tiene `mod_rewrite` habilitado o `.htaccess` no se lee.

**Solución:**
```bash
# Habilitar mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# Verificar AllowOverride en Apache config
sudo nano /etc/apache2/sites-available/000-default.conf
```

Agregar:
```apache
<Directory "/var/www/html">
    AllowOverride All
</Directory>
```

### Error: "Conexión a base de datos rechazada"

**Causa:** Credenciales incorrectas en `.env` o MySQL no está corriendo.

**Solución:**
```bash
# Verificar MySQL
sudo systemctl status mysql

# Probar conexión
mysql -u root -p12345678 -e "SHOW DATABASES;"

# Verificar .env
cat .env | grep DB_
```

### Error: "Permission denied" en uploads/

**Causa:** Apache no tiene permisos de escritura.

**Solución:**
```bash
# Dar permisos a Apache
sudo chown -R www-data:www-data uploads/
sudo chmod 755 uploads/ -R

# Verificar permisos
ls -la uploads/
```

### Error CORS en el navegador

**Causa:** Origen no permitido en `api/config/cors.php`.

**Solución:**
```bash
# Desarrollo: permitir todos
nano api/config/cors.php
# Cambiar a: header("Access-Control-Allow-Origin: *");

# Producción: dominio específico
# header("Access-Control-Allow-Origin: https://tudominio.com");
```

### Error: "Incorrect integer value: '' for column 'needs_crib'"

**Estado:** ✅ **RESUELTO en versión 0.2.0**

Este bug fue corregido en:
- `src/pages/Dashboard.tsx` (líneas 232, 583)
- `api/models/Preference.php` (método `convertToInt()`)

Si aún aparece, actualiza a la última versión.

### Build de Frontend Falla

**Causa:** Dependencias faltantes o Node version incompatible.

**Solución:**
```bash
# Limpiar node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# Verificar versión de Node
node --version  # Debe ser >= 16.x

# Build
npm run build
```

---

## ✨ Características Implementadas

### Frontend
✅ React 18 + TypeScript + Vite
✅ shadcn/ui components (Radix UI)
✅ Tailwind CSS con dark mode
✅ React Router v6
✅ Sistema de traducciones (ES, EN, CA, FR, DE, NL)
✅ Flujo de registro multi-paso
✅ Dashboard interactivo
✅ Firma digital en canvas
✅ Responsive design mobile-first

### Backend
✅ API REST completa (PHP vanilla)
✅ Arquitectura MVC simplificada
✅ PDO con prepared statements
✅ Sistema de respuestas JSON estandarizado
✅ Validación de datos centralizada
✅ CORS configurado
✅ Generación de contratos PDF con mPDF
✅ Sistema de logs
✅ Variables de entorno con .env

### Base de Datos
✅ 19 tablas normalizadas
✅ 3 vistas SQL
✅ Sistema de migraciones
✅ Datos de ejemplo completos
✅ Soporte multiidioma

### Seguridad
✅ SQL injection protection (prepared statements)
✅ XSS protection (sanitización)
✅ CORS configurado por entorno
✅ Archivos sensibles protegidos (.env, uploads/)
✅ Rate limiting preparado (variables en .env)

---

## 📦 Comandos Útiles

### Desarrollo

```bash
# Frontend
npm run dev          # Servidor desarrollo (puerto 8080)
npm run build        # Build producción
npm run build:dev    # Build con sourcemaps
npm run preview      # Preview del build
npm run lint         # Linter

# Backend
cd api && php test.php                # Test de endpoints
php database/install.php              # Instalar BD
php database/install.php --skip-schema # Solo migraciones

# Base de datos
mysql -u root -p12345678 moon_desarrollo  # Conectar a BD
mysqldump -u root -p12345678 moon_desarrollo > backup.sql  # Backup
```

### Producción

```bash
# Compilar y desplegar
npm run build
rsync -avz dist/ usuario@servidor:/var/www/html/app_huesped/dist/

# Logs
tail -f /var/log/apache2/vacanfly-error.log
tail -f logs/app.log

# Reiniciar servicios
sudo systemctl restart apache2
sudo systemctl restart mysql
```

---

## 📖 Documentación Adicional

- **Endpoints Completos:** `api/README.md`
- **Esquema de BD:** `database/schema.sql`
- **Contexto del Proyecto:** `PROJECT_CONTEXT.md`
- **Registro de Sesiones:** `SESSION_LOG.md`
- **Guía para Claude Code:** `CLAUDE.md`

---

## 🎉 ¡Listo para Producción!

**Checklist antes de desplegar:**

- [ ] `.env` configurado para producción
- [ ] Base de datos instalada (`php database/install.php`)
- [ ] Frontend compilado (`npm run build`)
- [ ] Permisos de `uploads/` configurados (755)
- [ ] Apache con SSL habilitado
- [ ] CORS configurado para dominio específico
- [ ] Variables de entorno sensibles protegidas
- [ ] Backup de base de datos configurado
- [ ] Logs monitorizados

---

**Versión:** 0.2.0
**Última actualización:** 2025-11-10
**Mantenedor:** Alberto (desarrollo) + Claude Code (documentación)
