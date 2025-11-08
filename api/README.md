# VACANFLY API - Documentación

## Configuración

### 1. Crear la base de datos

```bash
mysql -u root -p < database/schema.sql
```

O importar desde MySQL:
```sql
SOURCE /ruta/a/database/schema.sql;
```

### 2. Configurar credenciales

Las credenciales de la base de datos están en `api/config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'moon_desarrollo');
define('DB_USER', 'root');
define('DB_PASS', '12345678');
```

### 3. Verificar que funciona

Abre en tu navegador o con curl:
```bash
curl http://localhost/app_huesped/api/health
```

Deberías ver:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2024-11-07 10:30:00",
  "version": "1.0.0"
}
```

---

## Endpoints Disponibles

### 🏠 Reservas

#### GET /api/reservations/{code}
Obtener información de una reserva por su código.

**Ejemplo:**
```bash
curl http://localhost/app_huesped/api/reservations/RES-2024-001
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "reservation": {...},
    "guests": [...],
    "preferences": {...}
  }
}
```

#### GET /api/reservations/{id}/dashboard
Obtener toda la información necesaria para el dashboard del huésped.

**Ejemplo:**
```bash
curl http://localhost/app_huesped/api/reservations/1/dashboard
```

---

### 👥 Huéspedes

#### POST /api/guests
Registrar un nuevo huésped.

**Body:**
```json
{
  "reservation_id": 1,
  "document_type": "dni",
  "document_number": "12345678A",
  "nationality": "España",
  "first_name": "Juan",
  "last_name": "Pérez",
  "birth_date": "1990-05-15",
  "sex": "m",
  "phone": "+34 600 000 000",
  "email": "juan@example.com",
  "is_responsible": true,
  "registration_method": "manual",
  "accepted_terms": true
}
```

#### GET /api/guests/{id}
Obtener información de un huésped específico.

#### GET /api/guests/reservation/{reservation_id}
Obtener todos los huéspedes de una reserva.

#### PUT /api/guests/{id}
Actualizar información de un huésped.

---

### ⚙️ Preferencias

#### GET /api/preferences/{reservation_id}
Obtener preferencias de una reserva.

#### POST /api/preferences
Crear o actualizar preferencias.

**Body:**
```json
{
  "reservation_id": 1,
  "needs_crib": false,
  "double_beds": 2,
  "single_beds": 1,
  "sofa_beds": 0,
  "estimated_arrival_time": "15:30:00",
  "additional_info": "Sin alergias",
  "allergies": null,
  "special_requests": "Habitación en planta baja"
}
```

---

### 🚪 Puertas / Cerraduras

#### POST /api/doors/unlock
Intentar abrir una puerta.

**Body:**
```json
{
  "reservation_id": 1,
  "guest_id": 1,
  "door_type": "portal"
}
```

**door_type** puede ser: `portal` o `accommodation`

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Puerta abierta exitosamente",
  "data": {
    "success": true,
    "error_message": null,
    "timestamp": "2024-11-07 14:30:00"
  }
}
```

#### GET /api/doors/history/{reservation_id}
Obtener historial de aperturas de puertas.

---

### 🛠️ Incidencias

#### POST /api/incidents
Reportar una incidencia, queja o sugerencia.

**Body:**
```json
{
  "reservation_id": 1,
  "guest_id": 1,
  "incident_type": "complaint",
  "title": "Problema con la calefacción",
  "description": "La calefacción no enciende correctamente"
}
```

**incident_type** puede ser: `complaint`, `suggestion`, `maintenance`, `emergency`

#### GET /api/incidents/{reservation_id}
Obtener incidencias de una reserva.

---

## Códigos de Estado HTTP

- **200** - OK
- **201** - Creado exitosamente
- **400** - Error en la petición (datos inválidos)
- **401** - No autorizado
- **403** - Prohibido
- **404** - No encontrado
- **422** - Error de validación (faltan campos requeridos)
- **500** - Error interno del servidor

---

## Formato de Respuestas

### Respuesta exitosa:
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {...}
}
```

### Respuesta de error:
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": {...}
}
```

---

## Estructura de la Base de Datos

### Tablas principales:
- `hosts` - Anfitriones
- `accommodations` - Alojamientos
- `reservations` - Reservas
- `guests` - Huéspedes
- `preferences` - Preferencias de estancia
- `door_unlocks` - Historial de aperturas
- `incidents` - Incidencias/quejas/sugerencias
- `welcome_videos` - Videos de bienvenida
- `local_guide_items` - Guía local
- `reservation_languages` - Idiomas preferidos

### Vistas:
- `v_reservations_full` - Vista completa de reservas
- `v_guests_with_reservation` - Huéspedes con info de reserva

---

## Desarrollo

### Modo Debug
Para ver errores detallados, edita `api/config/database.php`:

```php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

**IMPORTANTE:** En producción, cambiar a:
```php
ini_set('display_errors', 0);
error_reporting(0);
```

### Logs
Los errores se registran automáticamente en el log de errores de PHP.

---

## Seguridad

### Recomendaciones para producción:

1. **Cambiar credenciales de base de datos**
2. **Configurar CORS** específicamente (no usar `*`):
   ```php
   header("Access-Control-Allow-Origin: https://tudominio.com");
   ```
3. **Usar HTTPS** obligatoriamente
4. **Implementar autenticación** (JWT, OAuth, etc.)
5. **Validar y sanitizar** todas las entradas
6. **Limitar rate limiting** para prevenir abuso
7. **Hacer backups** regulares de la base de datos

---

## Contacto y Soporte

Para más información o soporte, contacta con el equipo de desarrollo.
