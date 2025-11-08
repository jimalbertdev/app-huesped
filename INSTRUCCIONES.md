# 🚀 INSTRUCCIONES DE INSTALACIÓN Y USO

## ✅ Qué se ha creado

Se ha desarrollado un **backend completo en PHP** con **API REST** que conecta tu aplicación React con MySQL.

### 📁 Estructura creada:

```
/var/www/html/app_huesped/
├── database/
│   ├── schema.sql          ← Script SQL completo de la base de datos
│   └── install.php         ← Instalador automatizado
├── api/
│   ├── config/
│   │   ├── database.php    ← Configuración de conexión MySQL
│   │   └── cors.php        ← Configuración CORS para React
│   ├── includes/
│   │   ├── Database.php    ← Clase de conexión PDO
│   │   └── Response.php    ← Helper para respuestas JSON
│   ├── models/
│   │   ├── Reservation.php ← Modelo de reservas
│   │   ├── Guest.php       ← Modelo de huéspedes
│   │   ├── Preference.php  ← Modelo de preferencias
│   │   ├── DoorUnlock.php  ← Modelo de aperturas de puerta
│   │   ├── Incident.php    ← Modelo de incidencias
│   │   └── LocalGuide.php  ← Modelo de guía local
│   ├── endpoints/
│   │   ├── reservations.php ← API de reservas
│   │   ├── guests.php       ← API de huéspedes
│   │   ├── preferences.php  ← API de preferencias
│   │   ├── doors.php        ← API de puertas
│   │   └── incidents.php    ← API de incidencias
│   ├── index.php           ← Router principal
│   ├── .htaccess           ← Configuración Apache
│   ├── test.php            ← Script de pruebas
│   └── README.md           ← Documentación de endpoints
└── INSTRUCCIONES.md        ← Este archivo
```

---

## 📦 Paso 1: Instalar la Base de Datos

### Opción A: Usando el instalador automatizado (RECOMENDADO)

```bash
cd /var/www/html/app_huesped/database
php install.php
```

### Opción B: Manual con MySQL

```bash
mysql -u root -p12345678 < /var/www/html/app_huesped/database/schema.sql
```

O desde MySQL:
```sql
mysql -u root -p
USE moon_desarrollo;
SOURCE /var/www/html/app_huesped/database/schema.sql;
```

**Resultado esperado:**
- ✅ Base de datos `moon_desarrollo` creada
- ✅ 12 tablas creadas
- ✅ 2 vistas creadas
- ✅ Datos de ejemplo insertados (1 reserva, 1 alojamiento, guía local, etc.)

---

## 🧪 Paso 2: Probar la API

### Opción A: Usando el script de pruebas

```bash
cd /var/www/html/app_huesped/api
php test.php
```

### Opción B: Manual con curl

```bash
# Health check
curl http://localhost/app_huesped/api/health

# Obtener reserva de ejemplo
curl http://localhost/app_huesped/api/reservations/RES-2024-001

# Dashboard completo
curl http://localhost/app_huesped/api/reservations/1/dashboard
```

### Opción C: En el navegador

Abre en tu navegador:
```
http://localhost/app_huesped/api/health
http://localhost/app_huesped/api/reservations/RES-2024-001
```

**Deberías ver respuestas JSON como:**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {...}
}
```

---

## 🔗 Paso 3: Conectar el Frontend React con la API

### 3.1. Instalar axios en el proyecto React

```bash
cd /var/www/html/app_huesped
npm install axios
```

### 3.2. Crear archivo de configuración de API

Crea el archivo: `src/services/api.js`

```javascript
import axios from 'axios';

// URL base de la API
const API_BASE_URL = 'http://localhost/app_huesped/api';

// Instancia de axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

// Servicios específicos

// Reservas
export const reservationService = {
  getByCode: (code) => api.get(`/reservations/${code}`),
  getDashboard: (id) => api.get(`/reservations/${id}/dashboard`),
};

// Huéspedes
export const guestService = {
  create: (data) => api.post('/guests', data),
  getById: (id) => api.get(`/guests/${id}`),
  getByReservation: (reservationId) => api.get(`/guests/reservation/${reservationId}`),
  update: (id, data) => api.put(`/guests/${id}`, data),
};

// Preferencias
export const preferenceService = {
  get: (reservationId) => api.get(`/preferences/${reservationId}`),
  save: (data) => api.post('/preferences', data),
};

// Puertas
export const doorService = {
  unlock: (data) => api.post('/doors/unlock', data),
  getHistory: (reservationId) => api.get(`/doors/history/${reservationId}`),
};

// Incidencias
export const incidentService = {
  create: (data) => api.post('/incidents', data),
  getByReservation: (reservationId) => api.get(`/incidents/${reservationId}`),
};
```

### 3.3. Ejemplo de uso en componente React

```javascript
import { useState, useEffect } from 'react';
import { reservationService } from '@/services/api';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await reservationService.getDashboard(1);
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>{data.accommodation.name}</h1>
      <p>Check-in: {data.reservation.check_in_date}</p>
      {/* ... resto del componente */}
    </div>
  );
}
```

---

## 📚 Endpoints Disponibles

### 🏠 Reservas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reservations/{code}` | Obtener reserva por código |
| GET | `/api/reservations/{id}/dashboard` | Dashboard completo |

### 👥 Huéspedes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/guests` | Registrar huésped |
| GET | `/api/guests/{id}` | Obtener huésped |
| GET | `/api/guests/reservation/{reservation_id}` | Huéspedes de reserva |
| PUT | `/api/guests/{id}` | Actualizar huésped |

### ⚙️ Preferencias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/preferences/{reservation_id}` | Obtener preferencias |
| POST | `/api/preferences` | Guardar preferencias |

### 🚪 Puertas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/doors/unlock` | Abrir puerta |
| GET | `/api/doors/history/{reservation_id}` | Historial de aperturas |

### 🛠️ Incidencias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/incidents` | Crear incidencia |
| GET | `/api/incidents/{reservation_id}` | Obtener incidencias |

---

## 🗄️ Base de Datos

### Tablas creadas:

1. **hosts** - Anfitriones/propietarios
2. **accommodations** - Alojamientos
3. **reservations** - Reservas
4. **guests** - Huéspedes registrados
5. **preferences** - Preferencias de estancia
6. **door_unlocks** - Historial de aperturas de puertas
7. **incidents** - Incidencias/quejas/sugerencias
8. **welcome_videos** - Videos de bienvenida
9. **local_guide_items** - Guía local (restaurantes, etc.)
10. **reservation_languages** - Idiomas preferidos

### Datos de ejemplo incluidos:

- ✅ 1 Anfitrión: María García
- ✅ 1 Alojamiento: Casa Vista Hermosa
- ✅ 1 Reserva: RES-2024-001 (15-18 Nov 2024)
- ✅ 3 Videos de bienvenida
- ✅ 19 Items de guía local (restaurantes, cafés, etc.)

---

## 🛡️ Seguridad

### Para desarrollo:
- ✅ CORS habilitado para todos los orígenes (`*`)
- ✅ Errores visibles para debugging

### Para producción (cambiar en `api/config/database.php` y `cors.php`):

```php
// CORS específico
header("Access-Control-Allow-Origin: https://tudominio.com");

// Ocultar errores
ini_set('display_errors', 0);
error_reporting(0);
```

---

## 🔧 Solución de Problemas

### Error: "API no encontrada" o 404

1. Verificar que Apache tiene mod_rewrite habilitado:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

2. Verificar que .htaccess está siendo leído:
```apache
# En tu VirtualHost o httpd.conf
<Directory "/var/www/html">
    AllowOverride All
</Directory>
```

### Error: "Conexión a base de datos rechazada"

Verificar credenciales en `api/config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moon_desarrollo');
define('DB_USER', 'root');
define('DB_PASS', '12345678');
```

### Error CORS en el navegador

Abrir `api/config/cors.php` y verificar que está configurado correctamente.

---

## ✨ Características Implementadas

✅ API REST completa con arquitectura MVC
✅ Conexión segura a MySQL con PDO
✅ Validación de datos
✅ Manejo de errores estandarizado
✅ CORS configurado para React
✅ Sistema de apertura de puertas con historial
✅ Registro multi-huésped
✅ Gestión de preferencias de estancia
✅ Sistema de incidencias/quejas/sugerencias
✅ Guía local con categorías
✅ Datos de ejemplo listos para probar
✅ Scripts de instalación y prueba automatizados
✅ Documentación completa de endpoints

---

## 📞 Próximos Pasos

1. ✅ **Instalar la base de datos** (Paso 1)
2. ✅ **Probar la API** (Paso 2)
3. 🔄 **Conectar el frontend React** (Paso 3)
4. 🔄 **Modificar componentes React** para usar la API real
5. 🔄 **Probar flujo completo** de registro a dashboard
6. 🔄 **Ajustar seguridad** para producción

---

## 📖 Documentación Adicional

- **API Endpoints:** Ver `api/README.md`
- **Esquema de BD:** Ver `database/schema.sql`
- **Ejemplos de uso:** Ver `api/test.php`

---

**¡Todo listo para empezar a usar la API!** 🎉
