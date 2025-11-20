# Migración a Tablas Viajeros y Checkin

## 📋 Resumen de Cambios

Se ha migrado el sistema de registro de huéspedes desde la tabla `guests` a las nuevas tablas `viajeros` y `checkin`, implementando:

- ✅ Campos ofuscados para mayor seguridad
- ✅ Separación de responsabilidades (datos de viajero vs relación con reserva)
- ✅ Cálculos automáticos (edad, tipo de viajero)
- ✅ Triggers para mantener consistencia de datos
- ✅ Compatibilidad total con frontend existente

---

## 🗄️ Estructura de Tablas

### Tabla: `viajeros`

Almacena información de huéspedes con campos ofuscados.

**Campos principales:**

| Campo Original | Campo Ofuscado | Tipo | Descripción |
|----------------|----------------|------|-------------|
| first_name | n0mbr3s | VARCHAR(100) | Nombres |
| last_name | p3ll1d01 | VARCHAR(100) | Primer apellido |
| second_last_name | p3ll1d02 | VARCHAR(100) | Segundo apellido |
| birth_date | f3ch4_n4c1m13nt0 | DATE | Fecha de nacimiento |
| document_number | nvm3r0_d0cvm3nt0 | VARCHAR(20) | Número de documento |
| email | m41l | VARCHAR(255) | Correo electrónico |
| phone | nvm3r0_t3l3f0n0 | VARCHAR(20) | Teléfono |
| residence_address | d1r3cc10n | TEXT | Dirección |

**Campos calculados automáticamente:**

- `edad` - Calculada desde fecha de nacimiento
- `tipo` - niño (<12), adolescente (12-17), adulto (≥18)
- `estatus` - Por defecto "Registrado"

**Total de campos:** 34 campos + timestamps

---

### Tabla: `checkin`

Relaciona viajeros con reservas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID autoincremental |
| reserva_id | INT | FK a reservations |
| viajero_id | INT | FK a viajeros |
| orden | INT | Orden de registro (1, 2, 3...) |
| created_at | TIMESTAMP | Fecha de checkin |

**Constraints:**
- UNIQUE (reserva_id, viajero_id) - Un viajero no puede estar 2 veces en la misma reserva
- FK ON DELETE CASCADE - Si se elimina reserva/viajero, se elimina el checkin

---

## 🔧 Archivos Implementados

### Backend (PHP)

#### 1. **api/models/Viajero.php**
Modelo principal con:
- `create($data)` - Inserta viajero con mapeo automático
- `getById($id)` - Obtiene viajero formateado para frontend
- `getByReservation($reserva_id)` - Lista viajeros de una reserva
- `update($id, $data)` - Actualiza datos del viajero
- `getResponsibleByReservation($reserva_id)` - Obtiene responsable
- `formatForFrontend($viajero)` - Transforma datos ofuscados → normales

#### 2. **api/models/Checkin.php**
Gestión de relación reserva-viajero:
- `create($reserva_id, $viajero_id)` - Crea checkin con orden automático
- `getByReservation($reserva_id)` - Lista checkins de una reserva
- `exists($reserva_id, $viajero_id)` - Verifica si ya existe checkin
- `countByReservation($reserva_id)` - Cuenta viajeros en una reserva

#### 3. **api/endpoints/guests.php** ✏️ Actualizado
- POST /api/guests - Usa `viajeroModel` y `checkinModel`
- GET /api/guests/{id} - Lee de tabla viajeros
- GET /api/guests/reservation/{id} - Lista viajeros con formato frontend
- PUT /api/guests/{id} - Actualiza viajeros

#### 4. **api/endpoints/reservations.php** ✏️ Actualizado
- GET /api/reservations/{code} - Incluye viajeros
- GET /api/reservations/{id}/dashboard - Dashboard con viajeros

### Frontend (TypeScript/React)

#### 5. **src/lib/catalogs.ts** ✏️ Actualizado
Tipos de documento actualizados:
```typescript
const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI - DNI Español' },
  { value: 'NIE', label: 'NIE - Número de identidad de extranjero Español' },
  { value: 'PAS', label: 'Pasaporte' },
  { value: 'OTRO', label: 'Otro documento' }
]
```

#### 6. **src/pages/Register.tsx** ✏️ Actualizado
Validaciones mejoradas:
- Scroll automático al campo con error
- Focus automático
- Mensajes específicos por campo
- Validación en orden lógico

### Base de Datos

#### 7. **database/migrations/010_create_viajeros_checkin_tables.sql**
Migración SQL completa:
- Crea tabla `viajeros` con 34+ campos
- Crea tabla `checkin` con relaciones FK
- Crea vista `v_guests_formatted` para compatibilidad
- Crea triggers para cálculos automáticos
- Incluye sección opcional para migrar datos antiguos

#### 8. **database/run_migration_010.php**
Script de ejecución de migración con verificaciones

---

## 🚀 Instalación

### Paso 1: Ejecutar Migración

```bash
cd /var/www/html/app_huesped
php database/run_migration_010.php
```

**Salida esperada:**
```
==============================================
   MIGRACIÓN 010: Tablas viajeros y checkin
==============================================

✓ Conexión a base de datos exitosa
✓ Archivo de migración cargado

Ejecutando migración...
  → CREATE TABLE viajeros
  → CREATE TABLE checkin
  → CREATE VIEW v_guests_formatted
  → CREATE TRIGGER before_viajero_insert
  → CREATE TRIGGER before_viajero_update

✓ Migración ejecutada exitosamente

Verificando tablas creadas...
  ✓ Tabla 'viajeros' creada
    └─ Registros: 0
  ✓ Tabla 'checkin' creada
    └─ Registros: 0
  ✓ Vista 'v_guests_formatted' creada
  ✓ Triggers creados: 2
    └─ before_viajero_insert
    └─ before_viajero_update

==============================================
   ✓ MIGRACIÓN COMPLETADA CON ÉXITO
==============================================
```

### Paso 2: Verificar Tablas

```sql
-- Ver estructura de viajeros
DESCRIBE viajeros;

-- Ver estructura de checkin
DESCRIBE checkin;

-- Ver vista de compatibilidad
SELECT * FROM v_guests_formatted LIMIT 1;

-- Ver triggers
SHOW TRIGGERS WHERE `Trigger` LIKE 'before_viajero%';
```

### Paso 3: (Opcional) Migrar Datos Antiguos

Si tienes datos en la tabla `guests` y quieres migrarlos:

1. Edita el archivo `database/migrations/010_create_viajeros_checkin_tables.sql`
2. Descomenta la sección "3. MIGRAR DATOS EXISTENTES"
3. Ejecuta nuevamente: `php database/run_migration_010.php`

---

## 🧪 Pruebas

### Prueba 1: Registro de Huésped Adulto

```bash
curl -X POST http://localhost/app_huesped/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": 1,
    "document_type": "DNI",
    "document_number": "12345678Z",
    "support_number": "ABC123456",
    "nationality": "ES",
    "first_name": "Juan",
    "last_name": "García",
    "second_last_name": "López",
    "birth_date": "1990-05-15",
    "sex": "m",
    "residence_country": "ES",
    "residence_address": "Calle Mayor 1",
    "phone_country_code": "+34",
    "phone": "600123456",
    "email": "juan@example.com",
    "is_responsible": true
  }'
```

**Resultado esperado:**
- Crea registro en `viajeros` con:
  - `edad` = 34 (calculado)
  - `tipo` = "adulto" (calculado)
  - `estatus` = "Registrado" (por defecto)
- Crea registro en `checkin` con:
  - `orden` = 1 (primer huésped)

### Prueba 2: Registro de Menor de Edad

```bash
curl -X POST http://localhost/app_huesped/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": 1,
    "document_type": "PAS",
    "document_number": "AB123456",
    "nationality": "FR",
    "first_name": "Marie",
    "last_name": "Dubois",
    "birth_date": "2015-03-20",
    "sex": "f",
    "relationship": "HJ",
    "residence_country": "FR",
    "residence_municipality_name": "Paris",
    "residence_address": "123 Rue de la Paix",
    "phone_country_code": "+33",
    "phone": "612345678",
    "email": "marie@example.com",
    "is_responsible": false
  }'
```

**Resultado esperado:**
- `edad` = 9 (calculado)
- `tipo` = "niño" (calculado)
- `orden` = 2 (segundo huésped)

### Prueba 3: Obtener Dashboard

```bash
curl http://localhost/app_huesped/api/reservations/1/dashboard
```

**Debería devolver:**
```json
{
  "success": true,
  "data": {
    "reservation": {...},
    "accommodation": {...},
    "guests": [
      {
        "id": 1,
        "first_name": "Juan",
        "last_name": "García",
        "document_number": "12345678Z",
        "age": 34,
        "tipo": "adulto",
        ...
      },
      {
        "id": 2,
        "first_name": "Marie",
        "last_name": "Dubois",
        "age": 9,
        "tipo": "niño",
        ...
      }
    ],
    "preferences": {...},
    "local_guide": {...}
  }
}
```

---

## 🔍 Consultas Útiles

### Ver todos los viajeros de una reserva
```sql
SELECT v.*, c.orden
FROM viajeros v
INNER JOIN checkin c ON c.viajero_id = v.id
WHERE c.reserva_id = 1
ORDER BY c.orden;
```

### Ver viajeros con formato legible
```sql
SELECT
    id,
    n0mbr3s as nombres,
    p3ll1d01 as apellido1,
    nvm3r0_d0cvm3nt0 as documento,
    edad,
    tipo,
    estatus
FROM viajeros
WHERE id = 1;
```

### Ver estadísticas por tipo
```sql
SELECT
    tipo,
    COUNT(*) as total,
    AVG(edad) as edad_promedio
FROM viajeros
GROUP BY tipo;
```

### Ver huéspedes por reserva con orden
```sql
SELECT
    r.reservation_code,
    v.n0mbr3s as nombre,
    v.p3ll1d01 as apellido,
    c.orden,
    v.responsable as es_responsable
FROM checkin c
INNER JOIN viajeros v ON v.id = c.viajero_id
INNER JOIN reservations r ON r.id = c.reserva_id
WHERE r.id = 1
ORDER BY c.orden;
```

---

## 📊 Mapeo Completo de Campos

### guests → viajeros

| Campo guests | Campo viajeros | Transformación |
|--------------|----------------|----------------|
| phone | nvm3r0_t3l3f0n0 | Directo |
| phone_country_code | country_code | Directo |
| email | m41l | Directo, lowercase |
| first_name | n0mbr3s | Directo, ucwords |
| last_name | p3ll1d01 | Directo, ucwords |
| second_last_name | p3ll1d02 | Directo, ucwords |
| birth_date | f3ch4_n4c1m13nt0 | Directo |
| age | edad | Calculado automático |
| - | tipo | Calculado automático |
| sex | sexo | Directo |
| nationality | nacionalidad | Directo |
| document_type | tipo_documento | Directo, uppercase |
| document_number | nvm3r0_d0cvm3nt0 | Directo, uppercase |
| support_number | n_soporte | Directo, uppercase |
| issue_date | f3ch4_3xp3d1c10n | Directo |
| expiry_date | f3ch4_v3nc1m13nt0 | Directo |
| relationship | parentesco | Directo |
| is_responsible | responsable | Directo (0/1) |
| residence_country | d1r_p41s | Directo |
| residence_municipality_code | cod_municipio_esp | Si ES |
| residence_municipality_name | cod_municipio_otro | Si no ES |
| residence_postal_code | c0d_p0st4l | Directo |
| residence_address | d1r3cc10n | Directo |
| - | estatus | "Registrado" |
| - | observacion | NULL |
| signature_path | firma | Directo |
| contract_path | contract_path | Directo |
| reservation_id | - | Va a checkin |

---

## ⚠️ Notas Importantes

### 1. Campos No Almacenados
- **document_image_path** - Por normativa española, NO se almacenan imágenes de documentos. Se usará API externa para validación.

### 2. Campos Temporales
- **contract_path** - Actualmente en `viajeros`, se moverá a tabla `reservations` en futuro.

### 3. Campos de Uso Interno
- **observacion** - Solo para anfitriones, no se usa en esta app
- **estatus** - Se actualiza en proceso de policía (otro departamento)

### 4. Frontend Sin Cambios
El frontend NO requiere modificaciones. El modelo `Viajero.php` traduce automáticamente:
- **Frontend → Backend**: Campos normales → Campos ofuscados
- **Backend → Frontend**: Campos ofuscados → Campos normales

### 5. Compatibilidad
La vista `v_guests_formatted` permite que reportes y consultas antiguas sigan funcionando.

---

## 🐛 Troubleshooting

### Error: "Table viajeros doesn't exist"
```bash
php database/run_migration_010.php
```

### Error: "Duplicate entry"
Un viajero ya está registrado en esa reserva. Verifica:
```sql
SELECT * FROM checkin WHERE reserva_id = X AND viajero_id = Y;
```

### Error: "Campo requerido"
Verifica que el frontend esté enviando todos los campos obligatorios según `Register.tsx:207-314`.

### Los datos no aparecen en el dashboard
Verifica que:
1. El registro se creó en `viajeros`
2. El registro se creó en `checkin`
3. El endpoint usa `viajeroModel->getByReservation()`

```sql
-- Verificar
SELECT COUNT(*) FROM viajeros;
SELECT COUNT(*) FROM checkin;
SELECT * FROM v_guests_formatted WHERE reservation_id = X;
```

---

## 📝 Changelog

### v1.0.0 - 2025-11-15
- ✅ Creación de tablas `viajeros` y `checkin`
- ✅ Migración de modelos PHP
- ✅ Actualización de endpoints API
- ✅ Mejoras en validación frontend
- ✅ Triggers automáticos para edad y tipo
- ✅ Vista de compatibilidad legacy
- ✅ Scripts de migración y verificación

---

## 👥 Próximos Pasos

1. **Probar registro completo** desde frontend
2. **Migrar datos antiguos** (opcional)
3. **Integrar API de validación** de documentos
4. **Mover contract_path** a tabla `reservations`
5. **Crear endpoint de estadísticas** por tipo de viajero
6. **Implementar soft deletes** para auditoría

---

## 📚 Referencias

- Modelo Viajero: `api/models/Viajero.php`
- Modelo Checkin: `api/models/Checkin.php`
- Migración SQL: `database/migrations/010_create_viajeros_checkin_tables.sql`
- Documentación proyecto: `CLAUDE.md`
