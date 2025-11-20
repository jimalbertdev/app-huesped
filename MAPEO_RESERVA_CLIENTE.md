# Mapeo de Tablas: reservations → reserva + clientem

**Fecha:** 2025-11-16
**Versión:** 1.0

---

## 📋 Resumen

Migración de la tabla `reservations` a las nuevas tablas `reserva` y `clientem` del sistema principal.

### Cambios Principales
1. **Tabla `reservations`** → **Tabla `reserva`** (campos mapeados)
2. **Nuevo**: Tabla `clientem` para datos del cliente/responsable
3. **Autocompletado**: Al marcar "Soy el responsable", traer datos de `clientem`

---

## 🗂️ Mapeo de Campos

### reservations → reserva

| Campo `reservations` | Campo `reserva` | Tipo Mapeo | Notas |
|---------------------|----------------|------------|-------|
| `id` | `id` | Directo | PK auto_increment |
| `accommodation_id` | `alojamiento_id` | Directo | FK a alojamientos |
| `reservation_code` | `codigo_huesped` | Directo | Código único de reserva |
| - | `localizador_canal` | Nuevo | Localizador del canal (Booking, Airbnb) |
| `check_in_date` | `fecha_inicio` | Conversión | date → timestamp |
| `check_out_date` | `fecha_fin` | Conversión | date → timestamp |
| `check_in_time` | `hora_entrada` | Conversión | time → varchar(50) |
| - | `hora_salida` | Nuevo | Hora de salida |
| `total_guests` | `huespedes` o `total_huespedes` | Directo | Número total de huéspedes |
| `registered_guests` | - | Calculado | Contar desde tabla `checkin` |
| `responsible_guest_id` | - | Relación | viajeros.responsable = 1 |
| - | `cliente_id` | **NUEVO** | FK a `clientem` (datos del responsable) |
| `status` | `estado_reserva_id` | FK | FK a tabla de estados |
| - | `estado_leido` | Nuevo | varchar(2) |
| - | `estado_personalizado_id` | Nuevo | FK a estados personalizados |
| `all_guests_registered` | - | Calculado | registered_guests >= total_guests |
| `created_at` | `created_at` | Directo | timestamp |
| `updated_at` | `updated_at` | Directo | timestamp |

### Campos Nuevos en `reserva` (no en reservations)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tipo_tarifa_id` | int | FK a tipo de tarifa |
| `comision_canal` | double | Comisión del canal |
| `observacion_reserva` | text | Observaciones |
| `establecimiento_id` | int | FK a establecimiento |
| `tipo_alojamiento_id` | int | FK a tipo de alojamiento |
| `total` | double | Total de la reserva |
| `pendiente` | double | Monto pendiente |
| `total_ninos` | int | Total niños |
| `total_adolescentes` | int | Total adolescentes |
| `fianza` | double | Fianza |
| `idmotor` | int | ID del motor de reservas |
| `estatus_llamada` | varchar(15) | Estado de llamada |
| `url_host` | text | URL para el anfitrión |
| `url_invitado` | text | URL para el invitado |
| `localizador_booking` | varchar(50) | Localizador de Booking |
| `contrato` | varchar(250) | Path del contrato |
| `planificacion_limpieza` | int | Planificación de limpieza |
| `envio_chechin` | int | Envío de check-in |
| `fecha_contrato` | timestamp | Fecha del contrato |
| `es_autonoma` | int | Es reserva autónoma |

---

## 👤 Mapeo clientem → Formulario de Registro

### Cuando el usuario marca "Soy el responsable"

**Flujo:**
1. Usuario marca checkbox "Soy el responsable"
2. Frontend obtiene `reservationData.cliente_id` de la reserva actual
3. Llamada a API: `GET /api/clients/{cliente_id}`
4. Autocompletar campos del formulario

### Mapeo de Campos

| Campo `clientem` | Campo Formulario | Transformación | Ejemplo |
|-----------------|------------------|----------------|---------|
| `identificador_id` | `document_type` | Mapeo de tipos | "DNI", "PASSPORT" |
| `identificador` | `document_number` | Directo | "12345678X" |
| `nombres` | `first_name` | Directo | "JUAN" |
| `apellidos` | `last_name` + `second_last_name` | Split por espacio | "GARCIA" + "LOPEZ" |
| `codpais` | `nationality` | Código país | "ES" |
| `codpais` | `residence_country` | Código país | "ES" |
| `idprovincia` | `residence_municipality_code` | Si ES | Código INE |
| `idciudad` | `residence_municipality_name` | Nombre ciudad | "Madrid" |
| `codigo_postal` | `residence_postal_code` | Directo | "28001" |
| `direccion` | `residence_address` | Directo | "Calle Mayor 1" |
| `prefijo` | `phone_country_code` | Con símbolo + | "+34" |
| `telefono_movil` | `phone` | Directo | "600123456" |
| `email` | `email` | Directo | "juan@email.com" |

### Mapeo de Tipos de Documento

```javascript
const documentTypeMap = {
  'DNI': 'DNI',
  'PASSPORT': 'PAS',
  'NIE': 'NIE',
  'PASAPORTE': 'PAS',
  // Agregar más según sea necesario
};
```

---

## 🔄 Plan de Migración

### Fase 1: Crear Modelo y Endpoint de Cliente
- [ ] Crear `api/models/Cliente.php`
- [ ] Crear endpoint `GET /api/clients/{id}`
- [ ] Agregar servicio `clientService` en frontend

### Fase 2: Actualizar Modelo de Reserva
- [ ] Crear/Actualizar `api/models/Reserva.php`
- [ ] Mapear campos de `reserva` a estructura esperada
- [ ] Actualizar endpoint `GET /api/reservations/{code}` para usar tabla `reserva`
- [ ] Incluir `cliente_id` en respuesta

### Fase 3: Reorganizar Formulario de Registro
- [ ] Mover checkbox "Soy el responsable" al INICIO del formulario
- [ ] Agregar lógica de autocompletado al marcar checkbox
- [ ] Llamar endpoint de cliente si `isResponsible = true`
- [ ] Autocompletar campos del formulario

### Fase 4: Testing
- [ ] Probar con reserva que tenga cliente_id
- [ ] Verificar autocompletado de todos los campos
- [ ] Probar con diferentes tipos de documento
- [ ] Validar que datos se guarden correctamente

---

## 🚀 Implementación Paso a Paso

### 1. Modelo Cliente

```php
// api/models/Cliente.php
class Cliente {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    public function getById($id) {
        $sql = "SELECT * FROM clientem WHERE id = ?";
        $result = $this->db->queryOne($sql, [$id]);

        if (!$result) return null;

        return $this->formatForFrontend($result);
    }

    private function formatForFrontend($cliente) {
        // Split apellidos
        $apellidos = explode(' ', $cliente['apellidos'] ?? '');

        return [
            'id' => $cliente['id'],
            'document_type' => $this->mapDocumentType($cliente['identificador_id']),
            'document_number' => $cliente['identificador'],
            'first_name' => $cliente['nombres'],
            'last_name' => $apellidos[0] ?? '',
            'second_last_name' => $apellidos[1] ?? '',
            'nationality' => $cliente['codpais'],
            'residence_country' => $cliente['codpais'],
            'residence_postal_code' => $cliente['codigo_postal'],
            'residence_address' => $cliente['direccion'],
            'phone_country_code' => $cliente['prefijo'] ? '+' . ltrim($cliente['prefijo'], '+') : '+34',
            'phone' => $cliente['telefono_movil'],
            'email' => $cliente['email'],
        ];
    }

    private function mapDocumentType($tipo) {
        $map = [
            'DNI' => 'DNI',
            'PASSPORT' => 'PAS',
            'PASAPORTE' => 'PAS',
            'NIE' => 'NIE',
        ];
        return $map[strtoupper($tipo)] ?? 'OTRO';
    }
}
```

### 2. Endpoint de Cliente

```php
// api/endpoints/clients.php
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../models/Cliente.php';

$method = $_SERVER['REQUEST_METHOD'];
$segments = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
$clientId = $segments[0] ?? null;

if ($method === 'GET' && $clientId) {
    $clienteModel = new Cliente($database);
    $cliente = $clienteModel->getById($clientId);

    if (!$cliente) {
        Response::error("Cliente no encontrado", 404);
    }

    Response::success($cliente, "Cliente obtenido correctamente");
}
```

### 3. Servicio Frontend

```typescript
// src/services/api.ts
export const clientService = {
  /**
   * Obtener cliente por ID
   */
  getById: (id: number) => api.get(`/clients/${id}`),
};
```

### 4. Reorganizar Formulario (Register.tsx)

**Antes:**
```
📄 Documento → 👤 Datos Personales → 🏠 Residencia → 📞 Contacto
```

**Después:**
```
✅ Checkbox "Soy el responsable" (PRIMERO)
  ↓ (si marcado, autocomplete)
📄 Documento → 👤 Datos Personales → 🏠 Residencia → 📞 Contacto
```

```typescript
// Al inicio del formulario, antes de cualquier otro campo
<div className="space-y-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
  <div className="flex items-center space-x-2">
    <Checkbox
      id="isResponsible"
      checked={isResponsible}
      onCheckedChange={handleResponsibleChange}
    />
    <Label htmlFor="isResponsible" className="text-lg font-semibold">
      Soy el titular de la reserva
    </Label>
  </div>
  <p className="text-sm text-muted-foreground">
    Marcar si eres la persona que realizó la reserva.
    Tus datos se cargarán automáticamente.
  </p>
</div>
```

### 5. Lógica de Autocompletado

```typescript
const handleResponsibleChange = async (checked: boolean) => {
  setIsResponsible(checked === true);

  if (checked === true && reservationData?.cliente_id) {
    try {
      const response = await clientService.getById(reservationData.cliente_id);

      if (response.data.success) {
        const clientData = response.data.data;

        // Autocompletar campos
        if (clientData.document_type) setDocumentType(clientData.document_type);
        if (clientData.document_number) setDocumentNumber(clientData.document_number);
        if (clientData.first_name) setFirstName(clientData.first_name);
        if (clientData.last_name) setLastName(clientData.last_name);
        if (clientData.second_last_name) setSecondLastName(clientData.second_last_name);
        if (clientData.nationality) setNationality(clientData.nationality);
        if (clientData.residence_country) setResidenceCountry(clientData.residence_country);
        if (clientData.residence_postal_code) setResidencePostalCode(clientData.residence_postal_code);
        if (clientData.residence_address) setResidenceAddress(clientData.residence_address);
        if (clientData.phone_country_code) setPhoneCountryCode(clientData.phone_country_code);
        if (clientData.phone) setPhone(clientData.phone);
        if (clientData.email) setEmail(clientData.email);

        toast({
          title: "Datos cargados",
          description: "Tus datos como titular de la reserva se han cargado automáticamente.",
        });
      }
    } catch (error) {
      console.error('Error cargando datos del cliente:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus datos. Por favor, ingrésalos manualmente.",
        variant: "destructive",
      });
    }
  }
};
```

---

## 📊 Consideraciones Importantes

### 1. Tabla reserva.cliente_id
- **DEBE existir** el `cliente_id` en la tabla `reserva`
- Si es `NULL`, no se puede autocompletar
- Mostrar mensaje al usuario si no hay cliente asociado

### 2. Compatibilidad Retroactiva
- Mantener soporte para tabla `reservations` temporalmente
- Crear vista SQL que mapee `reserva` → `reservations` para compatibilidad
- Migrar gradualmente los endpoints

### 3. Estados de Reserva
- `reservations.status` es ENUM
- `reserva.estado_reserva_id` es FK a otra tabla
- Necesitamos mapear estados: "confirmed" → ID en tabla estados

### 4. Fechas y Horas
- `reservations`: `check_in_date` (DATE) + `check_in_time` (TIME)
- `reserva`: `fecha_inicio` (TIMESTAMP), `hora_entrada` (VARCHAR)
- Conversión necesaria al consultar/guardar

---

## ⚠️ Notas Importantes

**Base de datos activa:** `vacanfly_app_huesped_prueba`

**Tablas principales:**
- ✅ `reserva` - Nueva tabla de reservas (reemplaza `reservations`)
- ✅ `clientem` - Tabla de clientes (datos del titular)
- ✅ `viajeros` - Tabla de huéspedes
- ✅ `checkin` - Relación reserva-viajero

**Flujo actualizado:**
```
reserva (cliente_id)
  → clientem (datos del titular)
  → viajeros (todos los huéspedes)
  → checkin (relación N:M)
```

**Pregunta clave para implementación:**
¿La tabla `reserva` ya tiene datos? Si no, ¿migramos desde `reservations` o empezamos desde cero?

---

**Fin del documento**
