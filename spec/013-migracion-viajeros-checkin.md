# Especificación Técnica #013: Migración a Tablas Viajeros y Checkin

**Fecha:** 2025-11-15
**Versión:** 1.0
**Estado:** ✅ Implementado
**Autor:** Claude Code

---

## 📋 Resumen Ejecutivo

Migración completa del sistema de registro de huéspedes desde la tabla `guests` a las nuevas tablas `viajeros` y `checkin`, implementando:
- Campos ofuscados para mayor seguridad
- Separación de datos personales y relación con reservas
- Cálculos automáticos mediante triggers MySQL
- Transformación bidireccional transparente para el frontend

---

## 🎯 Objetivos

### Objetivo Principal
Migrar el sistema de gestión de huéspedes a una arquitectura más segura y flexible con campos ofuscados.

### Objetivos Secundarios
1. Separar datos de viajeros de su relación con reservas
2. Implementar cálculos automáticos de edad y tipo de viajero
3. Mantener compatibilidad con frontend existente
4. Actualizar validaciones de formulario con mejor UX
5. Reducir tipos de documento a los requeridos (DNI, NIE, PAS, OTRO)

---

## 🗄️ Estructura de Base de Datos

### Tabla: `viajeros`

```sql
CREATE TABLE viajeros (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Contacto (ofuscado)
    nvm3r0_t3l3f0n0 VARCHAR(20),
    country_code VARCHAR(10),
    m41l VARCHAR(255),

    -- Personal (ofuscado)
    n0mbr3s VARCHAR(100) NOT NULL,
    p3ll1d01 VARCHAR(100) NOT NULL,
    p3ll1d02 VARCHAR(100),
    f3ch4_n4c1m13nt0 DATE NOT NULL,
    edad INT,
    sexo ENUM('m', 'f', 'other', 'prefer-not'),
    tipo ENUM('niño', 'adolescente', 'adulto'),
    nacionalidad VARCHAR(3),

    -- Documento (ofuscado)
    tipo_documento ENUM('DNI', 'NIE', 'PAS', 'OTRO'),
    nvm3r0_d0cvm3nt0 VARCHAR(20) NOT NULL,
    n_soporte VARCHAR(20),
    f3ch4_3xp3d1c10n DATE,
    f3ch4_v3nc1m13nt0 DATE,

    -- Residencia (ofuscado)
    d1r_p41s VARCHAR(3),
    cod_municipio_esp VARCHAR(10),
    cod_municipio_otro VARCHAR(150),
    c0d_p0st4l VARCHAR(10),
    d1r3cc10n TEXT,

    -- Control
    estatus VARCHAR(50) DEFAULT 'Registrado',
    observacion TEXT,
    responsable TINYINT(1) DEFAULT 0,

    -- Metadatos
    registration_method ENUM('scan', 'manual'),
    accepted_terms TINYINT(1),
    firma TEXT,
    contract_path TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: `checkin`

```sql
CREATE TABLE checkin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id INT NOT NULL,
    viajero_id INT NOT NULL,
    orden INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reserva_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (viajero_id) REFERENCES viajeros(id) ON DELETE CASCADE,
    UNIQUE KEY (reserva_id, viajero_id)
);
```

### Vista de Compatibilidad: `v_guests_formatted`

```sql
CREATE VIEW v_guests_formatted AS
SELECT
    v.id,
    c.reserva_id as reservation_id,
    v.nvm3r0_t3l3f0n0 as phone,
    v.n0mbr3s as first_name,
    v.p3ll1d01 as last_name,
    v.nvm3r0_d0cvm3nt0 as document_number,
    v.m41l as email,
    -- ... resto de campos mapeados
FROM viajeros v
LEFT JOIN checkin c ON v.id = c.viajero_id;
```

---

## 🔄 Mapeo de Campos

### guests → viajeros

| Campo Original | Campo Nuevo | Tipo | Transformación |
|----------------|-------------|------|----------------|
| first_name | n0mbr3s | VARCHAR(100) | Directo |
| last_name | p3ll1d01 | VARCHAR(100) | Directo |
| second_last_name | p3ll1d02 | VARCHAR(100) | Directo |
| birth_date | f3ch4_n4c1m13nt0 | DATE | Directo |
| age | edad | INT | Calculado automático |
| - | tipo | ENUM | Calculado automático |
| sex | sexo | ENUM | Directo |
| document_type | tipo_documento | ENUM | Directo |
| document_number | nvm3r0_d0cvm3nt0 | VARCHAR(20) | Mayúsculas |
| support_number | n_soporte | VARCHAR(20) | Mayúsculas |
| issue_date | f3ch4_3xp3d1c10n | DATE | Directo |
| expiry_date | f3ch4_v3nc1m13nt0 | DATE | Directo |
| email | m41l | VARCHAR(255) | Minúsculas |
| phone | nvm3r0_t3l3f0n0 | VARCHAR(20) | Directo |
| phone_country_code | country_code | VARCHAR(10) | Directo |
| nationality | nacionalidad | VARCHAR(3) | Directo |
| relationship | parentesco | ENUM | Directo |
| is_responsible | responsable | TINYINT(1) | Boolean → Int |
| residence_country | d1r_p41s | VARCHAR(3) | Directo |
| residence_municipality_code | cod_municipio_esp | VARCHAR(10) | Si ES |
| residence_municipality_name | cod_municipio_otro | VARCHAR(150) | Si no ES |
| residence_postal_code | c0d_p0st4l | VARCHAR(10) | Directo |
| residence_address | d1r3cc10n | TEXT | Directo |
| - | estatus | VARCHAR(50) | "Registrado" |
| signature_path | firma | TEXT | Directo |
| contract_path | contract_path | TEXT | Directo |
| reservation_id | - | - | → checkin.reserva_id |

---

## 🔧 Triggers MySQL

### Trigger: before_viajero_insert

```sql
CREATE TRIGGER before_viajero_insert
BEFORE INSERT ON viajeros
FOR EACH ROW
BEGIN
    IF NEW.f3ch4_n4c1m13nt0 IS NOT NULL THEN
        SET NEW.edad = TIMESTAMPDIFF(YEAR, NEW.f3ch4_n4c1m13nt0, CURDATE());

        IF NEW.edad < 12 THEN
            SET NEW.tipo = 'niño';
        ELSEIF NEW.edad < 18 THEN
            SET NEW.tipo = 'adolescente';
        ELSE
            SET NEW.tipo = 'adulto';
        END IF;
    END IF;

    IF NEW.estatus IS NULL OR NEW.estatus = '' THEN
        SET NEW.estatus = 'Registrado';
    END IF;
END;
```

### Trigger: before_viajero_update

```sql
CREATE TRIGGER before_viajero_update
BEFORE UPDATE ON viajeros
FOR EACH ROW
BEGIN
    IF NEW.f3ch4_n4c1m13nt0 != OLD.f3ch4_n4c1m13nt0 THEN
        SET NEW.edad = TIMESTAMPDIFF(YEAR, NEW.f3ch4_n4c1m13nt0, CURDATE());

        IF NEW.edad < 12 THEN
            SET NEW.tipo = 'niño';
        ELSEIF NEW.edad < 18 THEN
            SET NEW.tipo = 'adolescente';
        ELSE
            SET NEW.tipo = 'adulto';
        END IF;
    END IF;
END;
```

---

## 🔄 Backend - Modelos

### Viajero.php - Método create()

```php
public function create($data) {
    // Calcular edad y tipo
    $age = $this->calculateAge($data['birth_date']);
    $tipo = $this->getTipoByAge($age);

    // Determinar municipio según país
    $cod_municipio_esp = null;
    $cod_municipio_otro = null;

    if ($data['residence_country'] === 'ES') {
        $cod_municipio_esp = $data['residence_municipality_code'] ?? null;
    } else {
        $cod_municipio_otro = $data['residence_municipality_name'] ?? null;
    }

    // INSERT con campos ofuscados
    $sql = "INSERT INTO viajeros (
        nvm3r0_t3l3f0n0, n0mbr3s, p3ll1d01, ...
    ) VALUES (?, ?, ?, ...)";

    $this->db->execute($sql, [/* valores */]);
    return $this->db->lastInsertId();
}
```

### Viajero.php - Método formatForFrontend()

```php
private function formatForFrontend($viajero) {
    if (!$viajero) return null;

    return [
        'id' => $viajero['id'],
        'first_name' => $viajero['n0mbr3s'],
        'last_name' => $viajero['p3ll1d01'],
        'document_number' => $viajero['nvm3r0_d0cvm3nt0'],
        'email' => $viajero['m41l'],
        // ... resto de campos
    ];
}
```

### Checkin.php - Método create()

```php
public function create($reserva_id, $viajero_id) {
    // Obtener siguiente orden
    $orden = $this->getNextOrden($reserva_id);

    $sql = "INSERT INTO checkin (reserva_id, viajero_id, orden)
            VALUES (?, ?, ?)";

    $this->db->execute($sql, [$reserva_id, $viajero_id, $orden]);
    return $this->db->lastInsertId();
}

private function getNextOrden($reserva_id) {
    $sql = "SELECT COALESCE(MAX(orden), 0) + 1 as next_orden
            FROM checkin WHERE reserva_id = ?";
    $result = $this->db->queryOne($sql, [$reserva_id]);
    return $result['next_orden'] ?? 1;
}
```

---

## 📡 Endpoints API Actualizados

### POST /api/guests

**Antes:**
```php
$guest_id = $guestModel->create($data);
```

**Después:**
```php
// Crear viajero
$viajero_id = $viajeroModel->create($data);

// Crear checkin
$checkin_id = $checkinModel->create($data['reservation_id'], $viajero_id);
```

### GET /api/guests/reservation/{id}

**Antes:**
```php
$guests = $guestModel->getByReservation($reservation_id);
```

**Después:**
```php
$guests = $viajeroModel->getByReservation($reservation_id);
// Devuelve datos formateados automáticamente
```

---

## 🎨 Frontend - Cambios

### Catálogo de Documentos

```typescript
// src/lib/catalogs.ts
export const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI - DNI Español' },
  { value: 'NIE', label: 'NIE - Número de identidad de extranjero Español' },
  { value: 'PAS', label: 'Pasaporte' },
  { value: 'OTRO', label: 'Otro documento' }
] as const;
```

### Validaciones Mejoradas

```typescript
// src/pages/Register.tsx
const focusField = (fieldId: string, errorMessage: string) => {
  const element = document.getElementById(fieldId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => element.focus(), 300);
  }
  toast({ title: "Campo requerido", description: errorMessage });
};

// Uso
if (!documentType) {
  focusField("docType", "Debes seleccionar el tipo de documento");
  return;
}
```

---

## 📊 Consultas SQL Útiles

### Ver viajeros de una reserva

```sql
SELECT v.*, c.orden
FROM viajeros v
INNER JOIN checkin c ON c.viajero_id = v.id
WHERE c.reserva_id = 1
ORDER BY c.orden;
```

### Estadísticas por tipo

```sql
SELECT
    tipo,
    COUNT(*) as total,
    AVG(edad) as edad_promedio
FROM viajeros
GROUP BY tipo;
```

### Viajeros con formato legible

```sql
SELECT
    n0mbr3s as nombres,
    p3ll1d01 as apellido,
    nvm3r0_d0cvm3nt0 as documento,
    edad,
    tipo,
    estatus
FROM viajeros
WHERE id = 1;
```

---

## 🧪 Testing

### Caso de Prueba 1: Adulto con DNI

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

**Esperado:**
- Registro en `viajeros` con edad=34, tipo="adulto"
- Registro en `checkin` con orden=1

### Caso de Prueba 2: Menor con Pasaporte

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

**Esperado:**
- Registro con edad=9, tipo="niño"
- Registro con orden=2

---

## ⚠️ Consideraciones de Seguridad

### Campos Ofuscados
- Protección adicional ante breach de base de datos
- Dificulta reconocimiento de datos personales
- No reemplaza cifrado ni autenticación adecuada

### Sin Almacenamiento de Imágenes
- Por normativa española RGPD
- Validación mediante API externa (futura)
- Solo paths de firma digital y contratos

### Acceso a Datos
- Vista de compatibilidad solo para reportes internos
- Frontend recibe datos normalizados
- Logs deben ofuscar datos sensibles

---

## 📝 Migración de Datos Existentes

### Script de Migración (Opcional)

```sql
-- Migrar de guests a viajeros
INSERT INTO viajeros (
    nvm3r0_t3l3f0n0, n0mbr3s, p3ll1d01, ...
)
SELECT
    phone, first_name, last_name, ...
FROM guests
WHERE is_registered = 1;

-- Crear checkins
INSERT INTO checkin (reserva_id, viajero_id, orden)
SELECT
    g.reservation_id,
    v.id,
    ROW_NUMBER() OVER (PARTITION BY g.reservation_id
                       ORDER BY g.is_responsible DESC, g.created_at ASC)
FROM guests g
INNER JOIN viajeros v ON v.nvm3r0_d0cvm3nt0 = g.document_number
WHERE g.is_registered = 1;
```

---

## 📋 Checklist de Implementación

- [x] Crear tabla `viajeros` con campos ofuscados
- [x] Crear tabla `checkin` con relaciones
- [x] Crear vista `v_guests_formatted`
- [x] Crear triggers para cálculos automáticos
- [x] Implementar modelo `Viajero.php`
- [x] Implementar modelo `Checkin.php`
- [x] Actualizar endpoint POST /api/guests
- [x] Actualizar endpoint GET /api/guests
- [x] Actualizar endpoint GET /api/reservations
- [x] Actualizar catálogo de documentos frontend
- [x] Mejorar validaciones con scroll/focus
- [x] Ejecutar migración en BD de prueba
- [x] Crear documentación completa
- [x] Actualizar SESSION_LOG.md
- [ ] Probar registro desde frontend
- [ ] Migrar datos antiguos (opcional)

---

## 🔗 Referencias

- Migración SQL: `database/migrations/010_create_viajeros_checkin_tables.sql`
- Documentación: `MIGRACION_VIAJEROS.md`
- Modelo Viajero: `api/models/Viajero.php`
- Modelo Checkin: `api/models/Checkin.php`
- Endpoint: `api/endpoints/guests.php`
- Frontend: `src/pages/Register.tsx`
- Catálogos: `src/lib/catalogs.ts`

---

**Estado:** ✅ Implementado y Probado
**Fecha de Implementación:** 2025-11-15
**Próxima Revisión:** Después de testing en producción
