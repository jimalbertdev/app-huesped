# 📚 VACANFLY GUEST APPLICATION - PROJECT CONTEXT

> **Última actualización:** 2025-11-17
> **Versión del proyecto:** 0.1.0
> **Estado:** En desarrollo activo

---

## 🎯 DESCRIPCIÓN DEL PROYECTO

**VACANFLY Guest Application** es una plataforma web progresiva diseñada para la gestión integral de huéspedes en alojamientos turísticos. El sistema permite el registro de múltiples huéspedes por reserva, gestión de preferencias de estancia, control de acceso mediante puertas inteligentes, y comunicación con anfitriones.

### Propósito Principal
- Digitalizar el proceso de check-in de huéspedes
- Cumplir con normativas policiales de registro de viajeros
- Proporcionar acceso a información del alojamiento y guía local
- Facilitar comunicación huésped-anfitrión
- Controlar accesos mediante cerraduras inteligentes

### Características Principales
- ✅ Registro multi-huésped con validación de documentos
- ✅ Sistema de firma digital y generación de contratos PDF
- ✅ Gestión de preferencias de estancia (camas, llegada, necesidades especiales)
- ✅ Dashboard interactivo con información del alojamiento
- ✅ Control de puertas inteligentes con historial
- ✅ Sistema de incidencias y sugerencias
- ✅ Guía local con categorías (restaurantes, transporte, emergencias)
- ✅ Soporte multiidioma (ES, EN, CA, FR, DE, NL)
- ✅ Diseño responsive con modo oscuro

---

## 🛠 STACK TECNOLÓGICO COMPLETO

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 18.3.1 | Framework principal |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 5.4.19 | Build tool & dev server |
| **React Router** | 6.30.1 | Routing & navegación |
| **Tailwind CSS** | 3.4.17 | Styling framework |
| **shadcn/ui** | Latest | Componentes UI (Radix UI) |
| **Axios** | 1.13.2 | Cliente HTTP |
| **React Hook Form** | 7.61.1 | Gestión de formularios |
| **Zod** | 3.25.76 | Validación de esquemas |
| **Lucide React** | 0.462.0 | Iconos |
| **date-fns** | 3.6.0 | Utilidades de fechas |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **PHP** | 8.x | Lenguaje servidor |
| **Apache** | 2.4.x | Servidor web |
| **PDO** | - | Abstracción de BD |
| **mPDF** | Latest | Generación de PDFs |
| **Composer** | 2.x | Gestor de dependencias PHP |

### Base de Datos
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **MySQL** | 8.x | Base de datos principal |
| **DB Name** | moon_desarrollo | Base de datos activa |

### Herramientas de Desarrollo
- **Git** - Control de versiones
- **ESLint** - Linter JavaScript/TypeScript
- **PostCSS** - Procesamiento CSS
- **Autoprefixer** - Prefijos CSS automáticos

---

## 📁 ESTRUCTURA DE CARPETAS

```
/var/www/html/app_huesped/
│
├── 📂 src/                          # Código fuente frontend (React + TypeScript)
│   ├── assets/                      # Imágenes, logos, assets estáticos
│   ├── components/                  # Componentes React reutilizables
│   │   └── ui/                      # Componentes shadcn/ui
│   ├── hooks/                       # Custom React hooks
│   │   ├── useLanguage.tsx         # Hook de traducciones (6 idiomas)
│   │   ├── useReservation.tsx      # Hook de datos de reserva
│   │   ├── useRegistrationFlow.tsx # Hook de flujo de registro
│   │   └── useReservationParams.tsx # Hook de URL params
│   ├── lib/                         # Utilidades y helpers
│   ├── pages/                       # Páginas/rutas de la aplicación
│   │   ├── Welcome.tsx             # Página inicial (landing)
│   │   ├── Register.tsx            # Registro de huésped (paso 1)
│   │   ├── RegisterPreferences.tsx # Preferencias (paso 2 - solo responsable)
│   │   ├── RegisterTerms.tsx       # Términos y firma (paso 3)
│   │   ├── RegisterConfirmation.tsx # Confirmación de registro
│   │   ├── Dashboard.tsx           # Dashboard principal
│   │   └── NotFound.tsx            # Página 404
│   ├── services/                    # Servicios y API clients
│   │   └── api.ts                  # Cliente Axios configurado
│   ├── App.tsx                      # Componente raíz
│   ├── main.tsx                     # Punto de entrada
│   └── index.css                    # Estilos globales
│
├── 📂 api/                          # Backend PHP (API REST)
│   ├── config/                      # Configuración
│   │   ├── database.php            # Config de conexión MySQL
│   │   └── cors.php                # Config CORS
│   ├── includes/                    # Clases core
│   │   ├── Database.php            # Singleton de conexión PDO
│   │   ├── Response.php            # Helper respuestas JSON
│   │   └── Validator.php           # Validación de datos
│   ├── models/                      # Modelos de datos (sin implementar ORM)
│   ├── services/                    # Servicios de lógica de negocio
│   │   └── ContractService.php     # Generación de contratos PDF
│   ├── middleware/                  # Middleware (rate limiting, auth, etc.)
│   ├── endpoints/                   # Endpoints legacy (deprecados)
│   ├── bootstrap.php                # Inicialización de la API
│   ├── index.php                    # Router principal
│   ├── guests.php                   # Endpoint de huéspedes
│   ├── preferences.php              # Endpoint de preferencias
│   ├── test.php                     # Script de pruebas
│   ├── .htaccess                    # Rewrite rules Apache
│   └── vendor/                      # Dependencias Composer
│
├── 📂 database/                     # Scripts de base de datos
│   ├── migrations/                  # Migraciones SQL
│   │   ├── 001_*.sql               # Migración inicial
│   │   ├── 007_add_signature_and_contract_to_guests.sql
│   │   └── 008_create_view_reservations_with_host.sql
│   ├── schema.sql                   # Esquema completo
│   └── install.php                  # Instalador automatizado
│
├── 📂 uploads/                      # Archivos subidos por usuarios
│   ├── signatures/                  # Firmas digitales (.png)
│   ├── contracts/                   # Contratos PDF generados
│   └── documents/                   # Documentos de identidad
│
├── 📂 spec/                         # Especificaciones técnicas por sesión
│   ├── 20251108-0757-001.md        # Sesión 1: Inicio
│   ├── ...
│   └── 20251109-1505-009.md        # Sesión 9: UI/UX + Traducciones
│
├── 📂 public/                       # Assets públicos
├── 📂 dist/                         # Build de producción
├── 📂 logs/                         # Logs de la aplicación
│
├── 📄 .env                          # Variables de entorno (NO commitear)
├── 📄 .env.example                  # Template de .env
├── 📄 package.json                  # Dependencias Node.js
├── 📄 tsconfig.json                 # Configuración TypeScript
├── 📄 vite.config.ts                # Configuración Vite
├── 📄 tailwind.config.ts            # Configuración Tailwind
├── 📄 components.json               # Config shadcn/ui
├── 📄 .gitignore                    # Archivos ignorados por Git
├── 📄 README.md                     # Readme original
├── 📄 INSTRUCCIONES.md              # Guía de instalación
├── 📄 CLAUDE.md                     # Contexto para Claude
├── 📄 PROJECT_CONTEXT.md            # Este archivo
├── 📄 SESSION_LOG.md                # Registro de sesiones
└── 📄 START_SESSION_GUIDE.md        # Guía de inicio de sesión
```

---

## 🎓 DECISIONES TÉCNICAS IMPORTANTES

### 1. **Arquitectura Frontend**
- **SPA con React Router**: Navegación client-side sin recargas
- **Context API** para estado global (no Redux para simplicidad)
- **Custom hooks** para lógica reutilizable
- **Composición de componentes** siguiendo principios SOLID
- **Type safety** con TypeScript estricto

### 2. **Sistema de Traducciones**
- **Hook personalizado** `useLanguage.tsx` con diccionarios estáticos
- **6 idiomas**: ES (default), EN, CA, FR, DE, NL
- **Persistencia** en localStorage
- **Estructura**: `{ 'clave.subclave': 'traducción' }`
- **NO** se usa i18next para reducir dependencias

### 3. **Gestión de Estado de Reserva**
- **URL como fuente de verdad**: `?r={reservation_code}`
- **Custom hook** `useReservationParams` para persistencia de params
- **Cache en context** para evitar llamadas repetidas a API
- **No autenticación** inicial (basado en código de reserva)

### 4. **Flujo de Registro Multi-Huésped**
- **3 pasos** para huésped responsable:
  1. Datos personales + documento
  2. Preferencias de estancia
  3. Términos y firma digital
- **1 paso** para huéspedes adicionales:
  - Solo datos personales + términos + firma
- **Firma digital** capturada en Canvas, convertida a PNG, guardada en `/uploads/signatures/`
- **Contrato PDF** generado con mPDF usando plantilla dinámica

### 5. **Backend API REST**
- **Sin framework**: PHP vanilla con arquitectura MVC simplificada
- **Respuestas estandarizadas**:
  ```json
  {
    "success": true|false,
    "message": "Descripción",
    "data": {...}
  }
  ```
- **Validación centralizada** con clase `Validator`
- **CORS habilitado** para desarrollo local
- **PDO con prepared statements** (prevención SQL injection)

### 6. **Base de Datos**
- **Estrategia de migraciones**: Archivos SQL numerados en `database/migrations/`
- **Vistas SQL** para consultas complejas (ej: `v_reservations_with_host`)
- **No ORM**: Queries SQL directas para máximo control
- **Soft deletes**: No implementados (hard delete por ahora)

### 7. **Sistema de Diseño**
- **shadcn/ui**: Componentes copiados al proyecto (no npm package)
- **Tailwind CSS**: Utility-first approach
- **Tema personalizado**: Variables CSS en `index.css`
- **Dark mode**: Soportado mediante `next-themes`
- **Responsive**: Mobile-first design

### 8. **Gestión de Archivos**
- **Firma**: Canvas → Blob → FormData → `/uploads/signatures/signature_{dni}.png`
- **PDF**: Generado server-side con mPDF → `/uploads/contracts/contract_{guest_id}.pdf`
- **No CDN**: Archivos servidos localmente

---

## 📊 PROGRESO DEL PROYECTO

### ✅ COMPLETADO

#### Backend
- [x] Arquitectura PHP con bootstrap
- [x] Configuración de base de datos con PDO
- [x] Sistema de respuestas JSON estandarizadas
- [x] CORS configurado para desarrollo
- [x] Endpoint de huéspedes extendido (POST /guests) con 36 campos
- [x] Endpoint de preferencias (GET/POST /preferences)
- [x] Endpoint de países (GET /api/countries)
- [x] Endpoint de municipios (GET /api/municipalities/search)
- [x] Servicio de generación de contratos PDF
- [x] Manejo de firma digital (upload + validación)
- [x] Vista SQL `v_reservations_with_host`
- [x] 8 validaciones condicionales complejas (DNI/NIE, menor edad, residencia)
- [x] Scripts de prueba y test
- [x] Sistema de estados de reserva con mapeo automático (estado_reserva_id)
- [x] Actualización automática de estado al registrar responsable (8→5)

#### Frontend
- [x] Configuración de Vite + React + TypeScript
- [x] Instalación y configuración de shadcn/ui
- [x] Sistema de routing con React Router
- [x] Hook de traducciones multiidioma (6 idiomas)
- [x] Hook de datos de reserva con cache
- [x] Hook de flujo de registro temporal
- [x] Cliente Axios configurado
- [x] Página Welcome con estado condicional
- [x] Página Register COMPLETAMENTE REDISEÑADA (paso 1):
  - [x] 4 secciones organizadas (Documento, Personal, Residencia, Contacto)
  - [x] 23+ campos con validaciones condicionales
  - [x] Autocompletado de municipios españoles con debounce
  - [x] Cálculo automático de edad en tiempo real
  - [x] Auto-asignación de nacionalidad para DNI/NIE
  - [x] Auto-completado de código postal
  - [x] Campos condicionales (segundo apellido, soporte, parentesco)
  - [x] 246 países y 8,107 municipios disponibles
- [x] Página RegisterPreferences (paso 2 - solo responsable)
- [x] Página RegisterTerms (paso 3 - firma digital)
- [x] Página RegisterConfirmation con lista de huéspedes
- [x] Página Dashboard con:
  - [x] Información de reserva
  - [x] Preferencias de estancia (mostrar y editar)
  - [x] Contacto con anfitrión (modal)
  - [x] Apertura de puertas (simulado)
  - [x] Historial de aperturas
  - [x] Guía local (accordion con iconos MapPin)
  - [x] Videos de bienvenida (renderizado HTML)
  - [x] Descarga de contrato PDF
  - [x] Información del alojamiento por categorías (1-7 dinámicas)
  - [x] Renderizado de contenido HTML con Tailwind Typography
- [x] Catálogos de datos (documentos, parentesco, sexo)
- [x] Schemas Zod con 8 refinements condicionales
- [x] Toast de éxito con color verde
- [x] Persistencia de parámetros de URL
- [x] Diseño responsive completo
- [x] Dark mode funcional

#### Base de Datos
- [x] Esquema completo de 12+ tablas
- [x] Tabla `guests` con 36 campos (12 agregados en migración 009)
- [x] Tabla `paises` con 246 países
- [x] Tabla `municipios_ine_esp` con 8,107 municipios
- [x] Datos de ejemplo (1 reserva, 1 alojamiento, guía local)
- [x] 9 migraciones numeradas aplicadas
- [x] Vistas SQL para consultas complejas
- [x] Índices optimizados para búsquedas

#### Documentación
- [x] README.md inicial
- [x] INSTRUCCIONES.md con guía de instalación
- [x] CLAUDE.md con contexto para IA
- [x] Carpeta spec/ con 12 especificaciones técnicas
- [x] PROJECT_CONTEXT.md (este archivo)
- [x] SESSION_LOG.md actualizado con 12 sesiones

### 🔄 EN PROGRESO
- [ ] Testing manual del formulario extendido (DNI, NIE, Pasaporte, menor edad)
- [ ] Optimización de bundle size (code splitting)
- [ ] Tests unitarios (frontend y backend)
- [ ] Integración completa de sistema de puertas inteligentes con API real
- [ ] Sistema de notificaciones push
- [ ] Validación avanzada de documentos (OCR)

### 📋 PENDIENTE
- [ ] Autenticación de anfitriones (admin panel)
- [ ] Dashboard de administrador
- [ ] Sistema de pagos integrado
- [ ] Reportes y analytics
- [ ] Integración con Raixer (cerraduras inteligentes)
- [ ] PWA completa (service workers, offline mode)
- [ ] Optimización de imágenes y lazy loading
- [ ] Tests E2E con Playwright
- [ ] CI/CD pipeline
- [ ] Despliegue a producción
- [ ] Monitoreo y logging avanzado
- [ ] Backup automatizado de BD
- [ ] Documentación de API con Swagger/OpenAPI
- [ ] Internacionalización de PDFs
- [ ] Sistema de envío de emails
- [ ] Integración con sistemas de reservas (Airbnb, Booking.com)

---

## 🐛 BUGS CONOCIDOS

### Críticos
- Ninguno conocido actualmente

### Menores
- **Frontend**: Fast Refresh warning en algunos hooks custom (no afecta funcionalidad)
- **Dashboard**: Historial de apertura de puertas es simulado (no conectado a BD)

### Mejoras Pendientes
- Implementar rate limiting en API
- Agregar validación de formato de email más robusta
- Mejorar mensajes de error en formularios
- Agregar indicador de carga global
- Implementar retry logic en llamadas API fallidas

---

## 🔐 VARIABLES DE ENTORNO

### Archivo: `.env` (NO COMMITEAR)

```bash
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
ALLOWED_ORIGINS=http://localhost.local:8080,http://localhost.local:5173,http://localhost.local:3000,http://localhost.local,http://localhost:8080,http://localhost:5173,http://localhost:3000,http://localhost

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

### Archivo: `.env.example` (Template, SÍ commitear)
Mantener sincronizado con `.env` pero sin valores sensibles.

---

## ⚡ COMANDOS IMPORTANTES

### Instalación Inicial
```bash
# 1. Clonar repositorio
git clone <repo_url>
cd app_huesped

# 2. Instalar dependencias frontend
npm install

# 3. Instalar dependencias backend
cd api
composer install
cd ..

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 5. Instalar base de datos
cd database
php install.php
# O manualmente:
# mysql -u root -p12345678 < schema.sql
cd ..

# 6. Crear carpetas de uploads
mkdir -p uploads/signatures uploads/contracts uploads/documents
chmod 755 uploads -R
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo frontend (puerto 8080)
npm run dev

# El backend corre en Apache/PHP (puerto 80)
# Verificar que Apache esté corriendo:
sudo systemctl status apache2
```

### Build
```bash
# Build de producción
npm run build

# Build de desarrollo (con sourcemaps)
npm run build:dev

# Preview del build
npm run preview
```

### Testing
```bash
# Linter
npm run lint

# Test de API (backend)
cd api
php test.php
cd ..

# Test de registro completo
php test_registration_with_signature.php
```

### Base de Datos
```bash
# Conectar a MySQL
mysql -u root -p12345678

# Usar BD
USE moon_desarrollo;

# Ver tablas
SHOW TABLES;

# Ver estructura de tabla
DESCRIBE reservations;

# Ejecutar migración
mysql -u root -p12345678 moon_desarrollo < database/migrations/007_*.sql

# Backup de BD
mysqldump -u root -p12345678 moon_desarrollo > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u root -p12345678 moon_desarrollo < backup_20251109.sql
```

### Git
```bash
# Ver estado
git status

# Ver commits recientes
git log --oneline -10

# Ver cambios específicos
git diff src/pages/Dashboard.tsx

# Crear spec de sesión
# (ver SESSION_LOG.md para template)
```

### Utilidades
```bash
# Ver estructura del proyecto (requiere tree)
tree -L 2 -I 'node_modules|.git|vendor'

# Buscar TODOs en código
grep -r "TODO" src/ --exclude-dir=node_modules

# Contar líneas de código
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l

# Ver tamaño de carpetas
du -sh uploads/* dist/* node_modules/

# Limpiar builds y cache
rm -rf dist/ node_modules/.vite/
```

---

## 📞 CONTACTO Y RECURSOS

### Proyecto
- **Repositorio Git**: (Agregar URL cuando esté en GitHub/GitLab)
- **Lovable Project**: https://lovable.dev/projects/19f23aac-3a01-4477-bc1e-1991b26b193f

### Documentación Externa
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [React Router Docs](https://reactrouter.com/)
- [PHP Docs](https://www.php.net/docs.php)
- [MySQL Docs](https://dev.mysql.com/doc/)

### Stack Overflow Tags
- `reactjs` `typescript` `vite` `tailwindcss` `react-router`
- `php` `mysql` `pdo` `rest-api`

---

## 📝 NOTAS ADICIONALES

### Convenciones de Código
- **Frontend**: 2 espacios, semicolons, double quotes
- **Backend**: 4 espacios, no semicolons, single quotes
- **Nombres de archivos**: PascalCase para componentes React, camelCase para utilities
- **Commits**: Mensajes descriptivos en español
- **Branches**: No se usan (desarrollo directo en main por ahora)

### Prioridades Actuales
1. Completar integración de cerraduras inteligentes
2. Implementar autenticación de anfitriones
3. Agregar tests automatizados
4. Mejorar documentación de API

### Desafíos Técnicos Resueltos
- ✅ Persistencia de parámetros de URL en toda la navegación
- ✅ Generación de PDFs con datos dinámicos y firma digital
- ✅ Sistema de traducciones sin librerías externas
- ✅ Flujo de registro multi-paso con estado temporal
- ✅ Upload de archivos binarios (firma en PNG) vía FormData

---

**Última revisión:** 2025-11-17
**Próxima revisión programada:** Después de cada sesión de desarrollo significativa
