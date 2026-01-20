# Arquitectura Unificada de Software

Este documento define el estándar de arquitectura y flujo de trabajo para todos los proyectos de desarrollo, garantizando consistencia, seguridad y escalabilidad desde el inicio.

---

## 🚀 1. Stack Tecnológico

### 1.1 Frontend (Cliente)
*   **Framework:** [React](https://react.dev/) (v18+)
*   **Herramienta de Construcción:** [Vite](https://vitejs.dev/)
*   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Estricto)
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **Gestión de Estado:** [TanStack Query](https://tanstack.com/query) (Servidor) y Context API (Cliente)
*   **Enrutado:** [React Router DOM](https://reactrouter.com/)
*   **Formularios:** React Hook Form + Zod (Validación)

### 1.2 Backend (Servidor)
*   **Lenguaje:** PHP (v8.0+)
*   **Arquitectura:** Custom Native PHP (Sin frameworks pesados para máxima velocidad)
*   **Gestor de Dependencias:** [Composer](https://getcomposer.org/)
*   **Base de Datos:** MySQL / MariaDB (v8.0+)
*   **Librerías Core:**
    *   `vlucas/phpdotenv`: Gestión de variables de entorno.
    *   `mpdf/mpdf`: Generación de documentos PDF.

---

## 📁 2. Estructura del Proyecto (Monorepo)

```text
/
├── api/                 # Backend (Código PHP)
│   ├── config/          # Configuración (DB, CORS, etc.)
│   ├── endpoints/       # Controladores de la API
│   ├── includes/        # Clases Core (Database, Response, Logger)
│   ├── middleware/      # Filtros de peticiones (Auth, RateLimit)
│   ├── models/          # Capa de Acceso a Datos (DAO)
│   ├── services/        # Lógica de negocio compleja
│   ├── vendor/          # Dependencias de Composer
│   └── index.php        # Punto de entrada y Router único
├── src/                 # Frontend (Código React/TS)
│   ├── components/      # Componentes UI reutilizables
│   ├── hooks/           # Lógica hook personalizada
│   ├── pages/           # Vistas de la aplicación
│   ├── services/        # Cliente Axios y servicios API
│   ├── schemas/         # Esquemas de validación Zod
│   └── App.tsx          # Configuración de rutas y providers
├── public/              # Assets estáticos
├── database/            # Scripts y migraciones SQL
├── .env                 # Configuración de entorno única
├── package.json         # Dependencias Frontend
└── vite.config.ts       # Configuración de Vite
```

---

## 🔐 3. Seguridad y Permisos

### 3.1 Protección de la API
1.  **CORS:** Configurado mediante `api/config/cors.php` basado en `ALLOWED_ORIGINS` del `.env`.
2.  **Rate Limiting:** Todas las peticiones deben pasar por `RateLimit::apply()` para prevenir ataques de fuerza bruta.
3.  **SQL Injection:** Uso obligatorio de **PDO con Prepared Statements** mediante la clase `Database`.
4.  **Validación de Negocio:** Middleware específico (ej. `ValidateReservation`) para verificar que el usuario tiene acceso al recurso solicitado.

### 3.2 Validación de Datos
*   **Frontend:** Validación inmediata con **Zod** antes de enviar cualquier petición.
*   **Backend:** Validación estricta con la clase `Validator` para asegurar que los datos recibidos son seguros y correctos.

---

## ⚙️ 4. Configuración (.env)

El archivo `.env` es el corazón de la configuración. Nunca debe subirse al repositorio.

```bash
# Conexión Base de Datos
DB_HOST=localhost
DB_NAME=nombre_proyecto
DB_USER=usuario
DB_PASS=contraseña

# Configuración de Aplicación
APP_ENV=development # development | production
APP_URL=https://mi-proyecto.com
ALLOWED_ORIGINS=http://localhost:5173,https://mi-proyecto.com

# Límites de la API (Peticiones por minuto)
RATE_LIMIT_GENERAL=100
RATE_LIMIT_SENSITIVE=5

# Rutas de Sistema
LOG_FILE=/var/www/html/proyecto/logs/app.log
```

---

## 🛠 5. Flujo de Trabajo (Desarrollo de Funcionalidades)

Para añadir una nueva funcionalidad al ecosistema, seguir este orden:

1.  **Base de Datos:** Crear la migración SQL en `database/migrations/`.
2.  **Modelo (Backend):** Crear la clase en `api/models/` para gestionar el CRUD.
3.  **Endpoint (Backend):**
    *   Crear el script en `api/endpoints/`.
    *   Registrar la ruta en `api/index.php`.
    *   Aplicar middleware de seguridad.
4.  **Servicio (Frontend):** Añadir la llamada API en `src/services/api.ts`.
5.  **Interfaz (Frontend):** Crear la página o componente en `src/pages/` consumiendo el servicio.

---

## 📦 6. Despliegue

*   **Frontend:** Compilar con `npm run build`. Los archivos se generan en `/dist`.
*   **Backend:** Asegurar que la carpeta `/api/vendor` esté actualizada y que Apache/Nginx redirija todas las peticiones `/api/*` a `api/index.php`.
*   **Permisos:** Las carpetas de subida (ej. `/uploads`) deben tener permisos de escritura para el usuario del servidor web (`www-data`).
