# 📅 SESSION LOG - VACANFLY GUEST APPLICATION

> **Propósito:** Registro cronológico de sesiones de desarrollo para mantener contexto entre sesiones y facilitar la continuidad del trabajo.

---

## 📖 CÓMO USAR ESTE LOG

### Para el Desarrollador (Usuario)
1. **Antes de iniciar sesión con Claude**: Lee la última sesión para recordar dónde quedaste
2. **Durante la sesión**: Toma notas mentales de cambios importantes
3. **Al finalizar sesión**: Pide a Claude que actualice este log con los cambios realizados

### Para Claude
1. **Al iniciar sesión**: Lee la última entrada para entender el contexto
2. **Durante la sesión**: Mantén en mente los objetivos pendientes
3. **Al finalizar**: Actualiza este log con el template proporcionado

---

## 📝 TEMPLATE PARA NUEVAS SESIONES

```markdown
## 🗓️ Sesión #XXX - [YYYY-MM-DD HH:MM]

### 🎯 Objetivos Iniciales
- [ ] Objetivo 1
- [ ] Objetivo 2
- [ ] Objetivo 3

### ✅ Logros Completados
- ✅ Logro 1 - Descripción detallada
- ✅ Logro 2 - Descripción detallada

### 🔄 Trabajo en Progreso
- 🚧 Tarea parcialmente completada - Estado actual y próximos pasos

### 📁 Archivos Modificados
- `src/pages/Dashboard.tsx` - Qué se cambió
- `api/preferences.php` - Qué se cambió
- `database/migrations/009_*.sql` - Qué se cambió

### 🐛 Bugs Encontrados
- **Bug 1**: Descripción - Estado (resuelto/pendiente)
- **Bug 2**: Descripción - Estado (resuelto/pendiente)

### 💡 Aprendizajes y Decisiones
- Decisión 1: Por qué se tomó
- Patrón útil descubierto
- Mejora de arquitectura implementada

### 📋 Próximos Pasos
1. Siguiente tarea prioritaria
2. Segunda tarea
3. Tercera tarea

### ⚠️ Notas Importantes
- Información crítica para próxima sesión
- Comandos específicos necesarios
- Dependencias o bloqueos

---
```

---

## 📚 HISTORIAL DE SESIONES

---

## 🗓️ Sesión #014 - [2025-11-16 14:00]

### 🎯 Objetivos Iniciales
- [x] Corregir problema de autocompletado de país de residencia desde nacionalidad
- [x] Actualizar vista v_reservations_full para usar nueva tabla viajeros
- [x] Implementar escaneo de documentos con Klippa AI
- [x] Integrar extracción automática de datos de documentos

### ✅ Logros Completados

#### 1. Corrección de Campos Independientes
- ✅ **Separación de estados en Register.tsx** (líneas 65-68)
  - Antes: Un solo estado `countrySearch` compartido entre nacionalidad y residencia
  - Ahora: Dos estados separados:
    - `nationalitySearch` para campo de nacionalidad
    - `residenceCountrySearch` para país de residencia
  - Dos listas filtradas independientes:
    - `filteredCountriesNationality`
    - `filteredCountriesResidence`
  - Dos useEffect separados para filtrado (líneas 131-155)
  - Problema resuelto: Seleccionar nacionalidad ya NO autocompleta país de residencia

#### 2. Actualización de Vista de Base de Datos
- ✅ **Migración 011 creada y ejecutada** (`database/migrations/011_update_reservations_view_for_viajeros.sql`)
  - Vista `v_reservations_full` actualizada
  - Cambio de JOIN: De `guests` (antigua) → `viajeros` + `checkin` (nueva)
  - Campos mapeados correctamente:
    - `responsible_first_name` ← `viajeros.n0mbr3s`
    - `responsible_last_name` ← `viajeros.p3ll1d01`
    - `responsible_email` ← `viajeros.m41l`
  - Script `run_migration_011.php` creado para ejecución automatizada
  - Verificación exitosa: 2 reservas visibles en la vista

#### 3. Actualización de Contador de Huéspedes
- ✅ **Método updateRegisteredGuests() actualizado** (`api/models/Reservation.php:54-71`)
  - Antes: Consultaba tabla `guests` antigua
  - Ahora: Consulta `checkin` + `viajeros`
  - Query optimizado:
    ```sql
    SELECT COUNT(*)
    FROM checkin c
    INNER JOIN viajeros v ON c.viajero_id = v.id
    WHERE c.reserva_id = r.id
    ```
  - Campo `registered_guests` se actualiza correctamente
  - Campo `all_guests_registered` calcula correctamente si total alcanzado

#### 4. Campo is_responsible Corregido
- ✅ **Conversión explícita a entero** (`api/models/Viajero.php:169`)
  - Antes: `$viajero['responsable'] ?? false` (podía devolver null)
  - Ahora: `isset($viajero['responsable']) ? (int)$viajero['responsable'] : 0`
  - Garantiza compatibilidad con frontend que espera `0` o `1`
  - Badge "Responsable" ahora se muestra correctamente en página de confirmación

#### 5. Implementación Completa de Escaneo con Klippa

##### 5.1 Backend - Endpoint de Escaneo
- ✅ **Creado `api/endpoints/document-scan.php`** (7.2 KB)
  - Endpoint: POST `/api/document-scan`
  - Recibe imagen vía `$_FILES['file']`
  - Codifica imagen en base64
  - Envía a Klippa API: `https://dochorizon.klippa.com/api/services/document_capturing/v1/identity`
  - Headers: `x-api-key`, `Content-Type: application/json`
  - Timeout: 30 segundos (proceso de IA puede tardar)

- ✅ **Función extractDocumentData()** (líneas 108-196)
  - Extrae y mapea 11 campos:
    1. `first_name` ← `given_names`
    2. `last_name` + `second_last_name` ← `surname` (split por espacio)
    3. `document_number` ← Campo varía según tipo
    4. `support_number` ← Número de soporte (DNI/NIE)
    5. `birth_date` ← `date_of_birth` (convertido a YYYY-MM-DD)
    6. `sex` ← `gender` (lowercase)
    7. `nationality` ← Código de país
    8. `document_type` ← Detectado automáticamente (DNI/NIE/PASSPORT)
    9. `issue_date` ← `date_of_issue`
    10. `expiry_date` ← `date_of_expiry`

  - Lógica especial para DNI/NIE vs Pasaportes:
    - **DNI/NIE**: `document_number` es soporte, `personal_number` es el DNI real
    - **Pasaportes**: `document_number` es el número del pasaporte

  - Autodetección de tipo:
    - `I` → DNI
    - `P` → PASSPORT
    - `place_of_birth = "RESIDENCIA"` → NIE

  - Conversión de fechas: `DD.MM.YYYY` → `YYYY-MM-DD`

- ✅ **Logging detallado agregado**
  - Logs en Apache error log para debugging
  - Captura de errores de cURL
  - Validación de JSON response
  - Tracking de estructura de respuesta

- ✅ **Rutas agregadas** (`api/index.php:71-73`)
  - Case `'document-scan'` en router
  - Endpoint visible en lista de available_endpoints

##### 5.2 Frontend - Servicio de API
- ✅ **documentScanService creado** (`src/services/api.ts:225-243`)
  - Método: `scanDocument(file: File)`
  - Usa `FormData` para upload
  - Headers: `Content-Type: multipart/form-data`
  - Timeout extendido: 30,000ms (30 segundos)
  - Retorna datos estructurados listos para formulario

##### 5.3 Frontend - Integración en Registro
- ✅ **handleImageUpload() mejorada** (`src/pages/Register.tsx:181-243`)
  - Guardar preview de imagen para UI
  - Llamada asíncrona a `documentScanService.scanDocument()`
  - Autocompletado de TODOS los campos disponibles:
    - Tipo de documento
    - Número de documento
    - Número de soporte (si DNI/NIE)
    - Nombres y apellidos
    - Fecha de nacimiento
    - Sexo
    - Nacionalidad (con búsqueda de nombre del país)
    - Fechas de expedición y vencimiento

  - Toast de confirmación: "Documento escaneado - Los datos se han cargado automáticamente"
  - Manejo de errores con toast destructivo
  - Redirección automática a formulario después de escaneo

- ✅ **UI de loading durante escaneo** (`src/pages/Register.tsx:533-576`)
  - Estado `scanningDocument` para mostrar progreso
  - Animación con `animate-pulse` en icono de cámara
  - Mensaje: "Escaneando documento... Extrayendo datos con IA. Por favor espera."
  - Input deshabilitado durante procesamiento
  - Diseño responsive con bordes animados

##### 5.4 Corrección de Permisos
- ✅ **Problema identificado y resuelto**
  - Error: `Permission denied` al acceder a `document-scan.php`
  - Archivo creado con permisos `600` y owner `root`
  - Solución aplicada:
    ```bash
    chmod 644 document-scan.php
    chown www-data:www-data document-scan.php
    ```
  - Apache ahora puede leer el archivo correctamente

### 📁 Archivos Modificados

#### Backend (4 archivos nuevos)
- `api/endpoints/document-scan.php` - **CREADO** (7.2 KB)
- `api/index.php` - **MODIFICADO** (ruta document-scan agregada)
- `database/migrations/011_update_reservations_view_for_viajeros.sql` - **CREADO**
- `database/run_migration_011.php` - **CREADO**
- `api/models/Reservation.php` - **MODIFICADO** (método updateRegisteredGuests)
- `api/models/Viajero.php` - **MODIFICADO** (conversión is_responsible)

#### Frontend (2 archivos modificados)
- `src/pages/Register.tsx` - **MODIFICADO**
  - Estados de búsqueda separados (líneas 65-68)
  - Dos useEffect para filtrado independiente (líneas 131-155)
  - handleImageUpload con integración Klippa (líneas 181-243)
  - UI de loading durante escaneo (líneas 533-576)
  - Campos de nacionalidad y residencia completamente separados
- `src/services/api.ts` - **MODIFICADO** (documentScanService agregado, líneas 225-243)

### 🐛 Bugs Encontrados y Resueltos
- ✅ **Nacionalidad autocompletaba país de residencia**
  - Causa: Estados compartidos entre ambos campos
  - Solución: Separación completa de estados y lógica de filtrado
  - Estado: **RESUELTO**

- ✅ **Dashboard mostraba huéspedes faltantes incorrectamente**
  - Causa: Vista `v_reservations_full` usaba tabla `guests` antigua
  - Solución: Migración 011 actualiza vista a usar `viajeros` + `checkin`
  - Estado: **RESUELTO**

- ✅ **Badge "Responsable" no se mostraba**
  - Causa: Campo `is_responsible` no se convertía explícitamente a entero
  - Solución: Conversión con `(int)` en modelo Viajero
  - Estado: **RESUELTO**

- ✅ **Error Permission denied en document-scan.php**
  - Causa: Archivo creado con permisos 600 y owner root
  - Solución: chmod 644 + chown www-data:www-data
  - Estado: **RESUELTO**

### 💡 Aprendizajes y Decisiones

**Decisión 1: Separar completamente estados de búsqueda**
- Razón: Evitar efectos secundarios entre campos independientes
- Implementación: Estados y useEffect duplicados pero independientes
- Beneficio: UX predecible, sin autocompleta dos no deseados

**Decisión 2: Migrar vista en vez de cambiar endpoint**
- Razón: Mantener compatibilidad con código existente
- Implementación: Vista SQL que mapea nuevas tablas a estructura esperada
- Beneficio: Cambio transparente, sin modificar lógica de endpoints

**Decisión 3: Timeout de 30 segundos para Klippa**
- Razón: Procesamiento de IA puede tardar 10-20 segundos
- Implementación: Timeout personalizado solo para este servicio
- Beneficio: Evita falsos errores por timeout prematuro

**Decisión 4: Logging detallado en endpoint de escaneo**
- Razón: Debugging de respuesta de API externa
- Implementación: error_log() para cada paso del proceso
- Beneficio: Fácil troubleshooting en caso de errores

**Patrón útil: Autocompletado inteligente con búsqueda**
```typescript
if (data.nationality) {
  setNationality(data.nationality);
  // Buscar el nombre del país para mostrarlo
  const country = countries.find(c => c.code === data.nationality);
  if (country) setNationalitySearch(country.name);
}
```
- Autocompleta tanto el valor como el texto visible
- Mejora UX al mostrar nombre legible en vez de código

**Patrón útil: Conversión de fechas Klippa**
```php
function convertDate($dateString) {
    $parts = explode('.', $dateString);
    if (count($parts) === 3) {
        return $parts[2] . '-' . $parts[1] . '-' . $parts[0]; // DD.MM.YYYY → YYYY-MM-DD
    }
    return $dateString;
}
```
- Maneja formato europeo de Klippa
- Convierte a formato ISO estándar para MySQL

### 📋 Próximos Pasos
1. **Probar escaneo con diferentes tipos de documentos**
   - DNI español
   - NIE español
   - Pasaporte extranjero
   - Otros documentos de identidad

2. **Optimizaciones del escaneo**
   - Comprimir imagen antes de enviar (reducir payload)
   - Mostrar preview de imagen antes de procesar
   - Permitir rotar/ajustar imagen si es necesario
   - Opción de cancelar escaneo en progreso

3. **Mejoras de UX**
   - Resaltar campos autocompletados en verde
   - Permitir editar campos después de escaneo
   - Guardar imagen del documento (opcional)
   - Validar campos extraídos antes de continuar

4. **Seguridad**
   - Mover API key de Klippa a variable de entorno
   - Agregar rate limiting al endpoint de escaneo
   - Validar tipos MIME de archivos subidos
   - Limitar tamaño máximo de imagen (10MB)

5. **Testing**
   - Test con documentos borrosos o mal iluminados
   - Test con documentos parcialmente ocultos
   - Test de timeout y manejo de errores
   - Test de carga (múltiples usuarios escaneando)

### ⚠️ Notas Importantes

**API de Klippa:**
- Endpoint: `https://dochorizon.klippa.com/api/services/document_capturing/v1/identity`
- API Key: `SLEWuIbhYA04NbOTVKFn86jIODBQI4vP` (HARDCODEADA - mover a .env)
- Timeout recomendado: 30 segundos
- Formato de imagen: base64 encoded
- Response: JSON con estructura `data.components.text_fields`

**Estructura de respuesta de Klippa:**
```json
{
  "data": {
    "components": {
      "text_fields": {
        "given_names": "JUAN",
        "surname": "GARCIA LOPEZ",
        "date_of_birth": "01.01.1990",
        "document_type": "I",
        "document_number": "ABC123456",
        "personal_number": "DNI12345678X",
        ...
      }
    }
  }
}
```

**Mapeo de tipos de documento:**
- `I` → DNI
- `P` → PASSPORT
- `place_of_birth = "RESIDENCIA"` → NIE

**Campos DNI/NIE vs Pasaporte:**
- **DNI/NIE**:
  - `document_number` = Número de soporte (ABC123456)
  - `personal_number` = DNI real (DNI12345678X)
- **Pasaporte**:
  - `document_number` = Número de pasaporte
  - `personal_number` = ID secundario

**Permisos de archivos:**
- Todos los archivos en `/api/endpoints/` deben tener:
  - Permisos: `644` (rw-r--r--)
  - Owner: `www-data:www-data`
- Verificar con: `ls -la /var/www/html/app_huesped/api/endpoints/`

**Vista v_reservations_full actualizada:**
- Ya NO usa tabla `guests`
- Ahora usa: `viajeros` + `checkin`
- JOIN por: `reserva_id` y `responsable = 1`
- Campos devueltos siguen siendo los mismos (retrocompatibilidad)

**Estados separados en Register.tsx:**
- `nationalitySearch` - Solo para campo de nacionalidad
- `residenceCountrySearch` - Solo para país de residencia
- `filteredCountriesNationality` - Resultados de nacionalidad
- `filteredCountriesResidence` - Resultados de residencia
- Cada uno tiene su propio useEffect independiente

**Logs de debugging:**
- Frontend: Consola del navegador con prefijo 📄
- Backend: Apache error log (`/var/log/apache2/error.log`)
- Buscar: `=== KLIPPA SCAN DEBUG ===`

---

## 🗓️ Sesión #013 - [2025-11-15 20:00]

### 🎯 Objetivos Iniciales
- [x] Actualizar tipos de documento en formulario de registro
- [x] Mejorar validaciones del formulario con scroll y focus automático
- [x] Migrar sistema de registro desde tabla `guests` a nuevas tablas `viajeros` y `checkin`
- [x] Implementar campos ofuscados para seguridad
- [x] Crear documentación completa de migración

### ✅ Logros Completados

#### 1. Frontend - Catálogo de Documentos Actualizado
- ✅ **Actualizado `src/lib/catalogs.ts`**
  - Tipos de documento reducidos a 4:
    1. DNI - DNI Español
    2. NIE - Número de identidad de extranjero Español
    3. PAS - Pasaporte
    4. OTRO - Otro documento
  - Eliminados NIF y CIF (no requeridos)

#### 2. Frontend - Validaciones Mejoradas
- ✅ **Actualizado `src/pages/Register.tsx`** (líneas 177-314)
  - Función helper `focusField()` para scroll y focus automático
  - Validación campo por campo en orden lógico:
    1. Documento de Identidad
    2. Datos Personales
    3. Datos de Residencia
    4. Información de Contacto
  - Mensajes específicos por cada campo faltante
  - Scroll suave al campo con error (`scrollIntoView`)
  - Focus automático después de 300ms
  - Validación mejorada para todos los campos obligatorios y condicionales

#### 3. Backend - Modelo Viajero Creado
- ✅ **Creado `api/models/Viajero.php`** (11.8 KB)
  - Mapeo completo de 34+ campos ofuscados
  - Cálculo automático de edad desde fecha de nacimiento
  - Cálculo automático de tipo: niño (<12), adolescente (12-17), adulto (≥18)
  - Asignación automática de estatus: "Registrado"
  - Método `formatForFrontend()` para transformación automática de datos
  - Soporte para municipios españoles vs internacionales:
    - España: cod_municipio_esp (código INE)
    - Otros países: cod_municipio_otro (nombre texto)
  - Métodos CRUD completos con transformación bidireccional

#### 4. Backend - Modelo Checkin Creado
- ✅ **Creado `api/models/Checkin.php`** (2.9 KB)
  - Gestiona relación N:M entre reservas y viajeros
  - Cálculo automático del campo `orden` (1, 2, 3...)
  - Método `getNextOrden()` para secuenciación
  - Validación de duplicados (un viajero no puede estar 2 veces en misma reserva)
  - Foreign keys con CASCADE para integridad referencial

#### 5. Backend - Endpoints Actualizados
- ✅ **Actualizado `api/endpoints/guests.php`**
  - POST /api/guests ahora usa `viajeroModel->create()` + `checkinModel->create()`
  - GET /api/guests/{id} lee de tabla viajeros con formato frontend
  - GET /api/guests/reservation/{id} lista viajeros ordenados por checkin.orden
  - PUT /api/guests/{id} actualiza viajeros con mapeo automático
  - Todas las validaciones existentes se mantienen intactas

- ✅ **Actualizado `api/endpoints/reservations.php`**
  - GET /api/reservations/{code} incluye viajeros desde nueva tabla
  - GET /api/reservations/{id}/dashboard lee viajeros con formato correcto

#### 6. Base de Datos - Migración Completa
- ✅ **Creada `database/migrations/010_create_viajeros_checkin_tables.sql`** (14.5 KB)
  - **Tabla `viajeros`**:
    - 34+ campos con nombres ofuscados (n0mbr3s, p3ll1d01, nvm3r0_d0cvm3nt0, etc.)
    - Campos calculados: edad, tipo, estatus
    - 10 índices para optimización de búsquedas
    - Soporte completo para DNI/NIE/Pasaporte/Otros

  - **Tabla `checkin`**:
    - Relación entre reserva_id y viajero_id
    - Campo orden para secuenciación
    - Foreign keys con CASCADE DELETE
    - Constraint UNIQUE para evitar duplicados

  - **Vista `v_guests_formatted`**:
    - Vista de compatibilidad con formato legacy
    - Mapeo de campos ofuscados → legibles
    - Útil para reportes y consultas antiguas

  - **2 Triggers creados**:
    - `before_viajero_insert`: Calcula edad y tipo al insertar
    - `before_viajero_update`: Recalcula edad y tipo al actualizar

  - **Sección opcional de migración de datos**:
    - Comentada por defecto
    - Permite migrar datos de `guests` → `viajeros`
    - Incluye lógica para llenar tabla `checkin`

- ✅ **Creado `database/run_migration_010.php`**
  - Script automatizado de ejecución con validaciones
  - Maneja delimitadores y triggers correctamente
  - Muestra progreso detallado
  - Verifica tablas, vista y triggers creados
  - Cuenta registros en cada tabla

#### 7. Documentación Completa
- ✅ **Creado `MIGRACION_VIAJEROS.md`** (18 KB)
  - Resumen ejecutivo de cambios
  - Estructura detallada de tablas
  - Mapeo completo de 34 campos guests → viajeros
  - Instrucciones de instalación paso a paso
  - 3 ejemplos de pruebas con curl
  - 8 consultas SQL útiles
  - Sección de troubleshooting
  - Próximos pasos y referencias

#### 8. Migración Ejecutada Exitosamente
- ✅ **Tablas creadas en `vacanfly_app_huesped_prueba`**
  - Tabla `viajeros`: 6,273 registros (datos pre-existentes)
  - Tabla `checkin`: 6,219 registros
  - Vista `v_guests_formatted`: Creada
  - Triggers: 2 activos (before_insert, before_update)
- ✅ **Verificación exitosa**
  - Tipos calculándose correctamente (Adulto, Adolescente)
  - Estatus "Registrado" asignándose automáticamente
  - Estructura completa y funcional

### 📁 Archivos Modificados

#### Backend (4 archivos nuevos, 3 modificados)
- `api/models/Viajero.php` - **CREADO** (mapeo completo + transformación)
- `api/models/Checkin.php` - **CREADO** (gestión relación N:M)
- `api/endpoints/guests.php` - **MODIFICADO** (usa viajeroModel + checkinModel)
- `api/endpoints/reservations.php` - **MODIFICADO** (lee de viajeros)
- `database/migrations/010_create_viajeros_checkin_tables.sql` - **CREADO**
- `database/run_migration_010.php` - **CREADO**
- `MIGRACION_VIAJEROS.md` - **CREADO**

#### Frontend (2 archivos modificados)
- `src/lib/catalogs.ts` - **MODIFICADO** (tipos de documento actualizados)
- `src/pages/Register.tsx` - **MODIFICADO** (validaciones mejoradas con scroll/focus)

### 🐛 Bugs Encontrados
- Ninguno - Implementación exitosa sin errores
- Triggers tuvieron errores menores de sintaxis que se corrigieron manualmente

### 💡 Aprendizajes y Decisiones

**Decisión 1: Campos ofuscados para seguridad**
- Razón: Protección de datos personales sensibles
- Implementación: Nombres con números y símbolos (n0mbr3s, nvm3r0_d0cvm3nt0)
- Beneficio: Capa adicional de seguridad si hay breach de BD

**Decisión 2: Separar datos de viajero y relación con reserva**
- Razón: Normalización y flexibilidad
- Implementación: Tabla `viajeros` (datos) + `checkin` (relación)
- Beneficio: Un viajero puede estar en múltiples reservas futuras

**Decisión 3: Cálculos automáticos en triggers**
- Razón: Consistencia de datos, no depender del código
- Implementación: Triggers MySQL para edad y tipo
- Beneficio: Datos siempre correctos incluso con SQL directo

**Decisión 4: Transformación bidireccional automática**
- Razón: Frontend no necesita cambios, mantiene simplicidad
- Implementación: Método `formatForFrontend()` en modelo
- Beneficio: Cambio transparente para frontend

**Decisión 5: Vista de compatibilidad legacy**
- Razón: Reportes y consultas antiguas siguen funcionando
- Implementación: Vista `v_guests_formatted`
- Beneficio: Transición gradual sin romper código existente

**Patrón útil: Scroll y focus en validaciones**
```typescript
const focusField = (fieldId: string, errorMessage: string) => {
  const element = document.getElementById(fieldId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => element.focus(), 300);
  }
  toast({ title: "Campo requerido", description: errorMessage });
};
```
- Mejora drásticamente UX en formularios largos
- Usuario sabe exactamente qué falta
- Aplicable a cualquier formulario

**Patrón útil: Mapeo con transformación**
- Frontend → Backend: Campos normales → Ofuscados
- Backend → Frontend: Campos ofuscados → Normales
- Beneficio: Seguridad sin complejidad en frontend

### 📋 Próximos Pasos
1. **Probar registro completo desde frontend** (PENDIENTE)
   - Registrar huésped adulto con DNI
   - Registrar menor de edad con parentesco
   - Verificar que se creen registros en viajeros y checkin
   - Verificar dashboard muestra datos correctamente

2. **Opcional: Migrar datos antiguos**
   - Descomentar sección de migración en SQL
   - Ejecutar script para copiar datos de guests → viajeros
   - Verificar integridad de datos migrados

3. **Integrar API de validación de documentos**
   - Por normativa, no se almacenan imágenes de documentos
   - Usar API externa para validación (próxima feature)

4. **Mover contract_path a tabla reservations**
   - Actualmente temporal en viajeros
   - Mejor ubicación lógica: reservas

5. **Crear endpoint de estadísticas**
   - Viajeros por tipo (niño/adolescente/adulto)
   - Nacionalidades más comunes
   - Dashboard de métricas

### ⚠️ Notas Importantes

**Base de datos correcta:**
- ✅ Usar: `vacanfly_app_huesped_prueba` (según .env)
- ❌ NO usar: `moon_desarrollo` (error inicial corregido)

**Estructura de tabla viajeros:**
- 34+ campos con nombres ofuscados
- Campos calculados automáticamente: edad, tipo, estatus
- Triggers activos para mantener consistencia
- Sin campo `document_image_path` (por normativa española)

**Mapeo de campos críticos:**
```
first_name      → n0mbr3s
document_number → nvm3r0_d0cvm3nt0
email           → m41l
phone           → nvm3r0_t3l3f0n0
residence_address → d1r3cc10n
```

**Tabla checkin:**
- reserva_id (FK a reservations)
- viajero_id (FK a viajeros)
- orden (secuencial automático)
- UNIQUE constraint (reserva_id, viajero_id)

**Frontend sin cambios:**
- El modelo Viajero.php hace toda la transformación
- Frontend sigue enviando campos normales
- Frontend sigue recibiendo campos normales
- Cambio completamente transparente

**Triggers MySQL:**
- `before_viajero_insert`: Calcula edad y tipo
- `before_viajero_update`: Recalcula si cambió birth_date
- Garantizan datos correctos siempre

**Testing:**
- Servidor dev corriendo en puerto 8081
- API endpoint: http://localhost/app_huesped/api
- Próximo: Probar registro completo desde navegador

**Documentación:**
- MIGRACION_VIAJEROS.md: Guía completa de migración
- Incluye ejemplos de uso, troubleshooting, consultas SQL
- Mapeo completo de 34 campos documentado

---

## 🗓️ Sesión #012 - [2025-11-14 20:00]

### 🎯 Objetivos Iniciales
- [x] Extender formulario de registro con campos adicionales para normativa policial
- [x] Agregar validaciones condicionales complejas (DNI/NIE, menor de edad, residencia)
- [x] Implementar autocompletado de municipios españoles
- [x] Crear endpoints API para países y municipios
- [x] Actualizar modelo Guest.php y validaciones backend

### ✅ Logros Completados

#### 1. Base de Datos
- ✅ **Migración 009 ejecutada exitosamente**
  - Agregados 12 nuevos campos a tabla `guests`
  - ENUM `document_type` actualizado: DNI, NIE, NIF, CIF, PAS, OTRO
  - 5 índices nuevos para optimización
  - Total de campos en `guests`: 36
  - Tabla `paises` (246 países) copiada a BD activa
  - Tabla `municipios_ine_esp` (8,107 municipios) ya disponible

#### 2. Backend - Endpoints API
- ✅ **Creado `api/endpoints/countries.php`**
  - GET /api/countries - Listar todos los países
  - GET /api/countries/search?q={query} - Buscar países
  - GET /api/countries/{code} - Obtener país por código
- ✅ **Creado `api/endpoints/municipalities.php`**
  - GET /api/municipalities/search?q={query} - Buscar municipios (debounce)
  - GET /api/municipalities/{code} - Obtener municipio por código INE
- ✅ **Endpoints probados y funcionando** con curl

#### 3. Backend - Modelo y Validaciones
- ✅ **Actualizado `api/models/Guest.php`**
  - Método `create()` extendido con 12 campos nuevos
  - Cálculo automático de edad desde birth_date
  - Normalización de datos (mayúsculas, trim)
  - Método `update()` con recálculo de edad
- ✅ **Actualizado `api/endpoints/guests.php`**
  - 8 validaciones condicionales implementadas:
    1. DNI/NIE requiere segundo apellido
    2. DNI/NIE requiere número de soporte
    3. Menor de 18 requiere parentesco
    4. España requiere municipio
    5. Fecha vencimiento > fecha expedición
    6. Documento no vencido
    7. Auto-asignación nacionalidad ES para DNI
    8. Auto-completado código postal desde municipio
  - Sanitización completa de datos
  - Validación de formato email

#### 4. Frontend - Catálogos y Schemas
- ✅ **Creado `src/lib/catalogs.ts`**
  - DOCUMENT_TYPES (6 tipos con metadatos)
  - RELATIONSHIP_TYPES (15 tipos de parentesco)
  - SEX_OPTIONS (4 opciones)
  - Helper functions: requiresSecondSurname(), requiresSupportNumber(), calculateAge(), isMinor()
- ✅ **Creado `src/schemas/guestSchema.ts`**
  - Schema Zod base con todos los campos
  - 8 refinements para validaciones condicionales
  - Tipos TypeScript derivados
  - Interfaces Country y Municipality
- ✅ **Actualizado `src/services/api.ts`**
  - countryService (getAll, search, getByCode)
  - municipalityService (search, getByCode)

#### 5. Frontend - Formulario Register.tsx COMPLETAMENTE REDISEÑADO
- ✅ **23 nuevos estados agregados**
  - Documento: type, number, support, issue_date, expiry_date
  - Personal: nationality, first/last/second_last_name, birth_date, age, sex, relationship
  - Residencia: country, municipality_code, municipality_name, postal_code, address
  - Contacto: phone_country_code, phone, email

- ✅ **4 useEffects implementados**
  - Cargar países al montar componente
  - Calcular edad automáticamente al cambiar fecha nacimiento
  - Auto-seleccionar nacionalidad ES para DNI/NIE
  - Buscar municipios con debounce (300ms)

- ✅ **Función handleSubmit extendida**
  - 8 validaciones condicionales frontend
  - Validación formato email
  - Normalización de datos antes de enviar
  - Soporte para todos los campos nuevos

- ✅ **UI del formulario rediseñada en 4 secciones**
  - **Sección 1: 📄 Documento** (6 campos, 2 condicionales)
  - **Sección 2: 👤 Datos Personales** (8 campos, 3 condicionales)
  - **Sección 3: 🏠 Residencia** (5 campos con autocompletado)
  - **Sección 4: 📞 Contacto** (3 campos)

- ✅ **Features UX implementadas**
  - Campos condicionales (aparecen/desaparecen según contexto)
  - Autocompletado de municipios con búsqueda en tiempo real
  - Cálculo y visualización de edad en tiempo real
  - Auto-asignación de nacionalidad (disabled para DNI/NIE)
  - Auto-completado de código postal (disabled)
  - Normalización automática a mayúsculas en documentos
  - Mensajes de ayuda contextuales
  - Indicadores visuales (edad, CP auto, ayudas)

### 📁 Archivos Modificados

#### Backend (6 archivos)
- `database/migrations/009_add_extended_guest_fields.sql` - **CREADO**
- `api/endpoints/countries.php` - **CREADO**
- `api/endpoints/municipalities.php` - **CREADO**
- `api/index.php` - **MODIFICADO** (rutas agregadas)
- `api/models/Guest.php` - **MODIFICADO** (create y update)
- `api/endpoints/guests.php` - **MODIFICADO** (validaciones)

#### Frontend (4 archivos)
- `src/lib/catalogs.ts` - **CREADO**
- `src/schemas/guestSchema.ts` - **CREADO**
- `src/services/api.ts` - **MODIFICADO** (2 servicios nuevos)
- `src/pages/Register.tsx` - **COMPLETAMENTE REDISEÑADO** (~400 líneas cambiadas)

### 🐛 Bugs Encontrados
- Ninguno - Implementación exitosa sin errores

### 💡 Aprendizajes y Decisiones

**Decisión 1: Usar tablas existentes de países y municipios**
- Razón: Ya estaban pobladas con datos oficiales (INE)
- Beneficio: Ahorro de tiempo, datos confiables

**Decisión 2: Debounce de 300ms en búsqueda de municipios**
- Razón: 8,107 municipios requieren optimización
- Implementación: useEffect con setTimeout y cleanup

**Decisión 3: Separar código de país del número de teléfono**
- Razón: Normalización internacional
- Beneficio: Validación más precisa por país

**Decisión 4: Campos condicionales en vez de siempre visibles**
- Razón: Mejor UX, menos confusión
- Implementación: Renderizado condicional con helpers

**Patrón útil: Validación doble (frontend + backend)**
- Frontend: Zod refinements para UX inmediata
- Backend: PHP para seguridad
- Beneficio: Mejor experiencia + seguridad robusta

**Patrón útil: Helper functions en catálogos**
- requiresSecondSurname(), calculateAge(), etc.
- Reutilizables en validaciones y UI
- Código más limpio y mantenible

### 📋 Próximos Pasos
1. **Testing manual completo** (PRIORITARIO)
   - Test: DNI español completo
   - Test: NIE español
   - Test: Pasaporte extranjero
   - Test: Menor de edad (parentesco)
   - Test: Autocompletado municipios
   - Test: Validaciones de fechas

2. **Optimizaciones futuras**
   - Code splitting (bundle > 500 kB)
   - Cache de países y municipios
   - Tests unitarios con Vitest
   - Validación de formato de documento con regex

3. **Mejoras opcionales**
   - OCR para extracción de datos de documento
   - Geocodificación de dirección
   - Validación de teléfono según país
   - Internacionalización de labels

### ⚠️ Notas Importantes

**Base de datos:**
- Usar `vacanfly_app_huesped_prueba` (BD activa)
- NO usar `moon_desarrollo` (solo fue fuente de datos)
- Tabla `paises` ya copiada con 246 registros
- Tabla `municipios_ine_esp` con 8,107 registros

**Estructura de campos:**
- `document_type` ahora es ENUM con 6 valores (mayúsculas)
- `age` se calcula automáticamente, no enviar desde frontend
- `residence_municipality_code` es el código INE (clave)
- `residence_municipality_name` es el nombre (texto)
- `phone_country_code` y `phone` están separados

**Validaciones críticas:**
- DNI/NIE → segundo_apellido + support_number obligatorios
- Edad < 18 → relationship obligatorio
- País ES → municipality obligatorio
- Fechas documento → expiry_date > issue_date

**URL de desarrollo:**
- Usar `localhost.local` (NO solo `localhost`)
- API: `http://localhost.local/app_huesped/api`
- Frontend dev: `http://localhost.local:8080`

**Build de producción:**
- Comando: `npm run build`
- Tiempo: ~40 segundos
- Bundle: 532 kB (162 kB gzip)
- Advertencia: Considerar code splitting

---

## 🗓️ Sesión #011 - [2025-11-10 04:39]

### 🎯 Objetivos Iniciales
- [x] Corregir error al desmarcar checkbox 'necesita cuna' (error 500 con valor false) - **PENDIENTE de sesión #010**
- [x] Actualizar base de datos y compilar aplicación para despliegue
- [x] Actualizar SESSION_LOG.md

### ✅ Logros Completados
- ✅ **Bug checkbox "necesita cuna" RESUELTO COMPLETAMENTE**
  - **Problema identificado**: Componente Checkbox de Radix UI devuelve valores `boolean | 'indeterminate'`, y al convertir incorrectamente llegaba al backend como string vacío `''` en vez de `false`
  - **Error MySQL**: `SQLSTATE[HY000]: General error: 1366 Incorrect integer value: '' for column 'needs_crib' at row 1`
  - **Causa raíz descubierta**: Había DOS archivos `preferences.php`:
    - `/api/preferences.php` (no usado, legacy)
    - `/api/endpoints/preferences.php` (activo, ejecutado por el router)
    - El fix inicial se aplicó al archivo incorrecto

- ✅ **Fix implementado en Frontend** (`src/pages/Dashboard.tsx`)
  - Línea 583: Mejorado handler del Checkbox para garantizar boolean puro:
    ```typescript
    onCheckedChange={(checked) => setNeedsCrib(checked === true)}
    ```
  - Línea 232: Conversión explícita a Boolean antes de enviar a API:
    ```typescript
    needs_crib: Boolean(needsCrib)
    ```

- ✅ **Fix implementado en Backend** (`api/models/Preference.php`)
  - Creado método helper `convertToInt()` que maneja TODOS los casos posibles:
    - Boolean: `true` → 1, `false` → 0
    - String: `'true'`, `'1'` → 1, `'false'`, `'0'`, `''` → 0
    - Integer: `1` → 1, `0` → 0
    - Null: → 0
  - Aplicado en métodos `create()` (línea 37) y `update()` (línea 69)
  - Utiliza `filter_var($value, FILTER_VALIDATE_BOOLEAN)` para conversión robusta

- ✅ **Testing exhaustivo realizado**
  - Script de prueba PHP creado (`test_checkbox_fix.php`) con 10 casos de prueba
  - Todos los casos pasaron exitosamente (boolean, string, int, null, empty string)
  - Pruebas con curl confirmadas:
    - `needs_crib: false` → guarda `0` ✅
    - `needs_crib: true` → guarda `1` ✅
  - Error 500 eliminado completamente

- ✅ **Código limpio y refactorizado**
  - Removidos todos los `error_log()` de debug
  - Eliminado archivo de prueba temporal
  - Código documentado con comentarios explicativos

- ✅ **Aplicación compilada para producción**
  - `npm run build` ejecutado exitosamente
  - Bundle generado: 523.40 kB (159.91 kB gzip)
  - CSS: 65.59 kB (11.56 kB gzip)
  - Assets generados en `/dist/`
  - Build time: 44.42 segundos

### 🔄 Trabajo en Progreso
- Ninguno - Todos los objetivos completados

### 📁 Archivos Modificados
- `src/pages/Dashboard.tsx` - **MODIFICADO**
  - Línea 583: Handler del Checkbox mejorado (`checked === true`)
  - Línea 232: Conversión explícita `Boolean(needsCrib)`
- `api/models/Preference.php` - **MODIFICADO**
  - Método `create()`: Agregado `convertToInt()` para `needs_crib`
  - Método `update()`: Agregado `convertToInt()` para `needs_crib`
  - Método `convertToInt()`: Nuevo método helper (líneas 96-111)
- `api/preferences.php` - **MODIFICADO** (legacy, no usado pero actualizado para consistencia)
  - Lógica de conversión mejorada (líneas 118-128)
  - Código de debug removido
- `test_checkbox_fix.php` - **CREADO y ELIMINADO** (temporal para testing)
- `dist/*` - **REGENERADO** (build de producción actualizado)

### 🐛 Bugs Encontrados y Resueltos
- ✅ **Bug checkbox "necesita cuna" RESUELTO COMPLETAMENTE**
  - Descripción: Error 500 al desmarcar checkbox y guardar
  - Causa: Conversión incorrecta de boolean false → string vacío ''
  - Solución: Conversión robusta en frontend y backend
  - Estado: **RESUELTO** ✅
  - Tiempo de resolución: ~1 hora (investigación + implementación + testing)

### 💡 Aprendizajes y Decisiones

**Decisión arquitectónica: Validación en múltiples capas**
- Frontend: Garantizar tipos correctos antes de enviar
- Backend: Validar y convertir defensivamente (nunca confiar en el frontend)
- Patrón aplicable a otros campos similares

**Descubrimiento importante: Arquitectura del API**
- El proyecto tiene dos capas de endpoints:
  - `/api/*.php` - Archivos legacy directos (no usados)
  - `/api/endpoints/*.php` - Archivos actuales enrutados por `index.php`
- **Lección**: Siempre verificar qué archivo se está ejecutando realmente

**Patrón de conversión robusta:**
```php
private function convertToInt($value) {
    if (is_int($value)) return $value ? 1 : 0;
    if (is_bool($value)) return $value ? 1 : 0;
    return (filter_var($value, FILTER_VALIDATE_BOOLEAN) || $value === 1 || $value === '1') ? 1 : 0;
}
```
- Aplicable a cualquier campo boolean → tinyint(1)
- Evita errores de tipo en MySQL

**Testing metodológico:**
- Script de prueba independiente antes de probar en frontend
- Pruebas de API con curl para verificar comportamiento
- Verificación de logs de Apache para confirmar ausencia de errores

### 📋 Próximos Pasos
1. Implementar panel de administración para gestionar información de alojamientos
2. Permitir upload de videos a servidor (actualmente solo URLs externas)
3. Agregar más campos a guía local (horarios, precios, coordenadas GPS)
4. Implementar cache en frontend para datos de alojamiento
5. Integrar Google Maps API para ubicaciones en guía local
6. Integración con cerraduras inteligentes (Raixer API)
7. Sistema de notificaciones push

### ⚠️ Notas Importantes
- **IMPORTANTE**: El proyecto tiene dos estructuras de endpoints:
  - `/api/*.php` (legacy, no usado)
  - `/api/endpoints/*.php` (activo, ejecutado por router en `/api/index.php`)
  - Siempre modificar los archivos en `/api/endpoints/` y `/api/models/`

- **Patrón aplicable a otros campos boolean:**
  - El método `convertToInt()` puede reutilizarse para otros campos similares
  - Considerar moverlo a una clase helper compartida

- **Build de producción:**
  - Comando: `npm run build`
  - Output: `/dist/`
  - Warning sobre chunk size (>500KB) - considerar code splitting para optimización futura

- **Base de datos:**
  - Todas las migraciones están aplicadas correctamente
  - Tablas de accommodation funcionando correctamente
  - Campo `needs_crib` ahora acepta correctamente 0 y 1

- **Apache logs limpios:**
  - No más errores SQLSTATE[HY000]: 1366
  - Sistema funcionando sin errores 500

- **Performance:**
  - Build time: ~44 segundos
  - Bundle size aceptable para MVP
  - Considerar lazy loading para optimización futura

---

## 🗓️ Sesión #010 - [2025-11-09 19:47]

### 🎯 Objetivos Iniciales
- [ ] Corregir error al desmarcar checkbox 'necesita cuna' (error 500 con valor false)
- [x] Agregar visualización de campo "información adicional" en tarjeta de preferencias
- [x] Migrar información del alojamiento a base de datos (actualmente hardcodeada)
- [x] Crear tablas para información del alojamiento, videos y guía local
- [x] Crear API endpoint para información del alojamiento
- [x] Modificar Dashboard para consumir API de alojamiento

### ✅ Logros Completados
- ✅ **Campo "información adicional" visible en tarjeta**
  - Agregado renderizado condicional en Dashboard.tsx:566-571
  - Icono FileText importado y usado
  - Condicional actualizado para incluir additionalInfo en check de "No hay preferencias configuradas"
- ✅ **Tablas de base de datos creadas** (Migration 003)
  - `accommodation_info` - Información general del alojamiento (cómo llegar, amenidades, WiFi, normas, horarios)
  - `accommodation_videos` - Videos de bienvenida con URL, título, descripción, orden
  - `accommodation_guide_categories` - Categorías de guía local (restaurantes, cafés, etc.) con soporte multiidioma (es/en/fr)
  - `accommodation_guide_items` - Items de guía por alojamiento y categoría
  - 7 categorías predeterminadas insertadas (restaurants, cafes, supermarkets, transport, tourist, emergency, entertainment)
  - Datos de ejemplo completos para alojamiento ID 1
- ✅ **Endpoint API de alojamiento creado** (`/api/accommodation/{id}`)
  - GET `/api/accommodation/{accommodation_id}` - Toda la información (info + videos + guide)
  - GET `/api/accommodation/{accommodation_id}/info` - Solo información general
  - GET `/api/accommodation/{accommodation_id}/videos` - Solo videos
  - GET `/api/accommodation/{accommodation_id}/guide` - Solo guía local
  - Respuesta JSON estructurada con títulos multiidioma
  - Validación de accommodation_id y existencia
- ✅ **Servicio frontend para API de alojamiento**
  - `accommodationService` agregado en `src/services/api.ts`
  - Métodos: getAll(), getInfo(), getVideos(), getGuide()
- ✅ **Dashboard migrado a datos dinámicos**
  - Estados agregados: accommodationInfo, accommodationVideos, accommodationGuide, accommodationLoaded
  - useEffect que carga información al montar componente
  - Card "Información del Alojamiento" completamente dinámica
  - Card "Videos de Bienvenida" renderizada desde API
  - Card "Guía Local" con soporte multiidioma desde API
  - Mensajes "Cargando..." mientras se obtienen datos
  - Eliminada constante hardcodeada `localGuideCategories`

### 🔄 Trabajo en Progreso
- 🚧 **Bug checkbox "necesita cuna"** - NO RESUELTO
  - Error identificado: PHP recibe empty string `''` en vez de boolean false
  - Causa: MySQL tinyint(1) rechaza empty string (error 1366)
  - Intentos realizados:
    - Modificar conversión boolean a int en preferences.php línea 115
    - Agregar logging detallado (líneas 133-136, 92-93)
    - Reiniciar Apache para limpiar cache
  - Error persiste después de múltiples intentos
  - **Decisión del usuario**: Dejar para sesión futura, continuar con otras tareas

### 📁 Archivos Modificados
- `database/migrations/003_accommodation_info_tables.sql` - **CREADO** (11.8 KB)
  - Creación de 4 tablas relacionadas con alojamiento
  - 7 categorías predeterminadas con traducciones
  - Datos de ejemplo completos para alojamiento 1
- `api/endpoints/accommodation.php` - **CREADO** (6.2 KB)
  - Endpoint GET completo con 4 rutas
  - Manejo de path params dinámicos
  - Parsing de JSON (rules field)
  - Respuestas estructuradas con títulos multiidioma
- `api/index.php` - **MODIFICADO**
  - Case 'accommodation' agregado (línea 59-61)
  - Lista de available_endpoints actualizada (líneas 92-95)
- `src/services/api.ts` - **MODIFICADO**
  - accommodationService agregado (líneas 167-192)
  - 4 métodos: getAll, getInfo, getVideos, getGuide
- `src/pages/Dashboard.tsx` - **MODIFICADO** (cambios mayores)
  - Import de accommodationService agregado
  - Estados de alojamiento agregados (líneas 105-108)
  - useEffect para cargar info de alojamiento (líneas 138-161)
  - Card "Información del Alojamiento" 100% dinámica (líneas 749-808)
  - Card "Videos de Bienvenida" desde API (líneas 810-847)
  - Card "Guía Local" con multiidioma (líneas 819-860)
  - Eliminada constante localGuideCategories hardcodeada
  - Visualización de additionalInfo agregada (líneas 566-571)
- `api/preferences.php` - **MODIFICADO** (intentos de fix del bug)
  - Logging DEBUG agregado en POST (líneas 92-93)
  - Logging DEBUG agregado en UPDATE (líneas 133-136)
  - Conversión mejorada de boolean a int (línea 115) - SIN ÉXITO

### 🐛 Bugs Encontrados
- ❌ **Bug checkbox "necesita cuna" NO RESUELTO**
  - Descripción: Al desmarcar checkbox y guardar, error 500
  - Error: `SQLSTATE[HY000]: General error: 1366 Incorrect integer value: '' for column 'needs_crib' at row 1`
  - Detectado en: Apache error.log
  - Estado: PENDIENTE (prioridad baja según usuario)
  - Próximo enfoque sugerido: Revisar cómo el frontend envía el valor false

### 💡 Aprendizajes y Decisiones
- **Decisión arquitectónica**: Separar información de alojamiento en 4 tablas normalizadas
  - `accommodation_info` (1:1 con accommodations)
  - `accommodation_videos` (1:N)
  - `accommodation_guide_categories` (tabla maestra)
  - `accommodation_guide_items` (N:N con categories)
- **Patrón**: Títulos multiidioma en BD (title_es, title_en, title_fr)
  - Permite selección según idioma del usuario
  - Fallback a español si idioma no disponible
- **Mejora UX**: Mensajes "Cargando..." mientras se obtienen datos de API
  - Evita flash de contenido vacío
  - Mejor experiencia en conexiones lentas
- **Organización**: Datos de ejemplo insertados directamente en migration
  - Facilita testing inmediato
  - Documenta estructura esperada
- **Patrón de endpoint**: Rutas específicas opcionales (info/videos/guide)
  - Permite optimizar carga de datos
  - Reduce payload cuando solo se necesita una sección

### 📋 Próximos Pasos
1. **PRIORITARIO**: Resolver bug de checkbox "necesita cuna"
   - Revisar cómo React envía el valor false en FormData
   - Considerar usar '0' string en vez de boolean
   - Test con diferentes métodos de envío
2. Agregar panel de administración para gestionar información de alojamientos
3. Permitir upload de videos a servidor (actualmente solo URLs externas)
4. Agregar más campos a guía local (horarios, precios, coordenadas GPS)
5. Implementar cache en frontend para datos de alojamiento (no cambian frecuentemente)
6. Integrar Google Maps API para mostrar ubicaciones en guía local

### ⚠️ Notas Importantes
- **Base de datos**: Las tablas de alojamiento usan `accommodation_id` como FK a `accommodations(id)` con CASCADE DELETE
- **Migration 003**: Incluye INSERT ON DUPLICATE KEY UPDATE para re-ejecutabilidad segura
- **API response**: Campo `rules` en accommodation_info se parsea de JSON array a array de strings
- **Frontend**: Dashboard ahora depende de `reservationData.accommodation_id` para cargar info
- **Multiidioma**: Guía local usa `category.title[language]` con fallback a español
- **Performance**: useEffect tiene flag `accommodationLoaded` para evitar llamadas duplicadas
- **Backward compatibility**: Si API falla, Dashboard muestra "Cargando..." (no rompe la UI)
- **Videos**: URLs esperadas son de YouTube/Vimeo (campo `video_type` para futura expansión)

---

## 🗓️ Sesión #009 - [2025-11-09 15:05]

### 🎯 Objetivos Iniciales
- [x] Arreglar header del dashboard (agregar botón de contacto con anfitrión)
- [x] Asegurar que preferencias del responsable se guarden correctamente
- [x] Mostrar preferencias guardadas en el dashboard
- [x] Permitir actualizar preferencias desde el dashboard

### ✅ Logros Completados
- ✅ **Endpoint API de preferencias creado** (`/api/preferences.php`)
  - GET `/api/preferences/{reservation_id}` - Obtener preferencias
  - POST `/api/preferences` - Crear o actualizar preferencias
  - Validación de datos y manejo de errores
  - Soporta INSERT y UPDATE automático
- ✅ **Header del Dashboard mejorado**
  - Agregado botón "Contactar" igual al de Welcome
  - Dialog modal con info del anfitrión (nombre, teléfono, email)
  - Links directos `tel:` y `mailto:`
- ✅ **Preferencias en Dashboard - Visualización**
  - useEffect que carga preferencias al cargar reserva
  - Display dinámico de hora de llegada, camas, cuna
  - Mensaje "No hay preferencias configuradas" cuando vacío
- ✅ **Preferencias en Dashboard - Edición**
  - Dialog modal para actualizar preferencias
  - Input type="time" para hora (mejor UX móvil)
  - Contadores para camas (dobles, individuales, sofá)
  - Checkbox para cuna
  - Textarea para info adicional
  - Toast de confirmación al guardar exitosamente
  - Manejo de errores con toast destructivo
- ✅ **Testing del endpoint**
  - Probado GET y POST con curl
  - Verificado UPDATE de preferencias existentes
  - Verificado validación de reserva inexistente

### 🔄 Trabajo en Progreso
- Ninguno - Todos los objetivos completados

### 📁 Archivos Modificados
- `api/preferences.php` - **CREADO** (7.6 KB)
  - Endpoint completo GET/POST para preferencias
  - Validación con clase Validator
  - Respuestas JSON estandarizadas
- `src/pages/Dashboard.tsx` - **MODIFICADO**
  - Imports: preferenceService, useToast, Input component
  - Estado: showContactDialog, estimatedArrivalTime, preferencesLoaded
  - useEffect para cargar preferencias desde API
  - Header con botón de contacto y dialog modal
  - UI dinámica para mostrar preferencias
  - Dialog de edición de preferencias con Input type="time"
  - handleUpdatePreferences async con llamada a API
  - Manejo de errores con toasts

### 🐛 Bugs Encontrados
- Ninguno

### 💡 Aprendizajes y Decisiones
- **Decisión**: Usar Input type="time" en vez de Select dropdown
  - Razón: Mejor UX en móviles, permite minutos intermedios, más rápido
- **Patrón**: Cargar datos con useEffect + flag de "cargado" para evitar loops
- **Mejora**: Dialog modal reutilizable para contacto (mismo en Welcome, RegisterConfirmation, Dashboard)

### 📋 Próximos Pasos
1. Integrar sistema de cerraduras inteligentes con API real (actualmente simulado)
2. Implementar autenticación de anfitriones (admin panel)
3. Agregar tests unitarios para componentes críticos
4. Implementar sistema de notificaciones push

### ⚠️ Notas Importantes
- La tabla `preferences` ya existía en BD con campos correctos
- El endpoint usa el mismo patrón de Response que el resto de la API
- Las preferencias se cargan automáticamente al abrir Dashboard si existe reservation_id
- El campo `estimated_arrival_time` es de tipo TIME en MySQL, se formatea automáticamente

---

## 🗓️ Sesión #008 - [2025-11-08 21:15]

### 🎯 Objetivos Iniciales
- [x] Completar sistema de traducciones para todos los idiomas
- [x] Mejorar contraste y espaciado en página de confirmación
- [x] Implementar navegación condicional en Welcome

### ✅ Logros Completados
- ✅ **Sistema de traducciones completo** (6 idiomas: ES, EN, CA, FR, DE, NL)
  - 38 nuevas claves de traducción agregadas
  - Traducciones para confirmation.* (26 claves)
  - Traducciones para dashboard.* (12 claves adicionales)
- ✅ **Mejoras visuales en RegisterConfirmation**
  - Card de celebración amarillo transparente: `bg-yellow-50/80 dark:bg-yellow-950/30 border-2 border-yellow-500/50`
  - Botón verde de éxito: `bg-success hover:bg-success/90 text-white shadow-lg`
  - Espaciado jerárquico: pt-2, pt-4, pt-6, space-y-6, space-y-8
  - Emoji tamaño grande: text-5xl
- ✅ **Navegación condicional en Welcome**
  - Variable `allGuestsRegistered` para detectar estado
  - Cuando todos registrados: Card amarillo + botón verde a dashboard
  - Cuando faltan: Flujo original con botón de registro
  - Botones secundarios ocultos cuando todos registrados

### 📁 Archivos Modificados
- `src/hooks/useLanguage.tsx` - Agregadas traducciones CA, FR, DE, NL
- `src/pages/Welcome.tsx` - Lógica condicional + mejoras visuales
- `src/pages/RegisterConfirmation.tsx` - Mejoras de color y espaciado
- `spec/20251108-2115-008.md` - Especificación técnica creada

### 💡 Aprendizajes y Decisiones
- **Patrón de colores**: Amarillo transparente para celebración + verde para acción positiva
- **Espaciado**: Usar pt-* para separación vertical jerárquica entre secciones

### 📋 Próximos Pasos
(Completados en sesión #009)

---

## 🗓️ Sesión #007 - [2025-11-08 20:50]

### 🎯 Objetivos Iniciales
- [x] Optimizar campo de hora de llegada (Select → Input type="time")
- [x] Cargar huéspedes reales en RegisterConfirmation
- [x] Implementar código de colores para huéspedes
- [x] Agregar header con menú en RegisterConfirmation

### ✅ Logros Completados
- ✅ **RegisterPreferences optimizado**
  - Input type="time" para hora de llegada (mejor UX móvil)
- ✅ **RegisterConfirmation rediseñado**
  - Carga de huéspedes reales desde useReservation
  - Placeholders para huéspedes faltantes ("Huésped 1", "Huésped 2")
  - Código de colores:
    - Azul: Huésped responsable
    - Verde: Huésped registrado
    - Gris: Huésped pendiente
  - Header completo con selector de idioma y botón de contacto
  - Dialog modal de contacto con anfitrión
  - Botón para registrar siguiente huésped con badge de count

### 📁 Archivos Modificados
- `src/pages/RegisterPreferences.tsx` - Input type="time"
- `src/pages/RegisterConfirmation.tsx` - Rediseño completo

---

## 🗓️ Sesión #006 - [2025-11-08 13:15]

### 🎯 Objetivos Iniciales
- [x] Implementar descarga de contrato en Dashboard
- [x] Cambiar color de toast de éxito a verde
- [x] Probar flujo completo de registro con firma

### ✅ Logros Completados
- ✅ **Vista SQL creada** `v_reservations_with_host`
  - Mapea campos para generación de PDF
- ✅ **Toast de éxito verde**
  - Variant "success" agregado a toast.tsx
  - Color: `border-green-500 bg-green-500 text-white`
- ✅ **Botón de descarga de contrato en Dashboard**
  - Solo visible cuando existe contract_path
  - Link directo al PDF generado
- ✅ **Test de registro completo**
  - Script `test_registration_with_signature.php` creado
  - PDF generado exitosamente (31.5 KB, PDF 1.4 válido)

### 📁 Archivos Modificados
- `database/migrations/008_create_view_reservations_with_host.sql` - CREADO
- `src/components/ui/toast.tsx` - Variant success agregado
- `src/pages/RegisterTerms.tsx` - Toast variant="success"
- `src/pages/Dashboard.tsx` - Botón de descarga
- `test_registration_with_signature.php` - CREADO

### 🐛 Bugs Encontrados
- ✅ **Resuelto**: Constantes DB no definidas en test - Agregado loading de .env

---

## 🗓️ Sesión #005 - [2025-11-08 12:30]

### 🎯 Objetivos Iniciales
- [x] Implementar generación de contratos PDF
- [x] Integrar firma digital en proceso de registro
- [x] Guardar firma como imagen PNG

### ✅ Logros Completados
- ✅ **ContractService.php creado**
  - Generación de PDF con mPDF
  - Plantilla dinámica con datos de reserva y huésped
  - Inserción de firma digital en PDF
- ✅ **RegisterTerms.tsx mejorado**
  - Captura de firma en Canvas
  - Conversión a Blob PNG
  - Upload vía FormData
  - Llamada a API con multipart/form-data
- ✅ **Endpoint guests.php actualizado**
  - Manejo de $_FILES['signature']
  - Guardado en `/uploads/signatures/`
  - Llamada a ContractService para generar PDF
  - Guardado de paths en BD

### 📁 Archivos Modificados
- `api/services/ContractService.php` - CREADO
- `api/guests.php` - Upload de firma y generación de PDF
- `src/pages/RegisterTerms.tsx` - Canvas + FormData
- `database/migrations/007_add_signature_and_contract_to_guests.sql` - CREADO

---

## 🗓️ Sesión #004 - [2025-11-08 11:45]

### 🎯 Objetivos Iniciales
- [x] Completar flujo de registro multi-paso
- [x] Implementar persistencia temporal con Context
- [x] Crear página de términos y condiciones con firma

### ✅ Logros Completados
- ✅ **Hook useRegistrationFlow creado**
  - Context para datos temporales (guestData, preferenceData, signatureData)
  - Limpieza al completar registro
- ✅ **Página RegisterTerms creada**
  - Canvas para firma digital
  - Scroll de términos
  - Checkbox de aceptación
  - Guardado final en DB via API
- ✅ **Guardado de huésped con preferencias**
  - POST /api/guests con todos los datos
  - Si es responsable, guardado adicional de preferencias

### 📁 Archivos Modificados
- `src/hooks/useRegistrationFlow.tsx` - CREADO
- `src/pages/RegisterTerms.tsx` - CREADO
- `src/pages/RegisterPreferences.tsx` - Integración con context

---

## 🗓️ Sesión #003 - [2025-11-08 11:33]

### 🎯 Objetivos Iniciales
- [x] Crear página de preferencias para responsable
- [x] Implementar contadores de camas
- [x] Agregar campo de hora de llegada

### ✅ Logros Completados
- ✅ **Página RegisterPreferences creada**
  - Solo visible para huésped responsable
  - Hora de llegada estimada (Select)
  - Checkbox para necesita cuna
  - Contadores para camas (dobles, individuales, sofá)
  - Textarea para info adicional
  - Validación y guardado temporal

### 📁 Archivos Modificados
- `src/pages/RegisterPreferences.tsx` - CREADO

---

## 🗓️ Sesión #002 - [2025-11-08 09:25]

### 🎯 Objetivos Iniciales
- [x] Crear endpoint de huéspedes
- [x] Implementar formulario de registro
- [x] Conectar frontend con API

### ✅ Logros Completados
- ✅ **Endpoint /api/guests creado**
  - POST para crear huésped
  - GET para obtener huésped
  - GET para listar por reserva
- ✅ **Página Register creada**
  - Formulario completo de datos personales
  - Validación con React Hook Form + Zod
  - Campos condicionales según tipo de documento
  - Integración con API

### 📁 Archivos Modificados
- `api/guests.php` - CREADO
- `src/pages/Register.tsx` - CREADO
- `src/services/api.ts` - guestService agregado

---

## 🗓️ Sesión #001 - [2025-11-08 07:57]

### 🎯 Objetivos Iniciales
- [x] Setup inicial del proyecto
- [x] Configurar base de datos
- [x] Crear arquitectura backend
- [x] Setup frontend con React + TypeScript

### ✅ Logros Completados
- ✅ **Backend PHP completo**
  - Arquitectura MVC
  - PDO con prepared statements
  - Sistema de respuestas JSON estandarizado
  - CORS configurado
- ✅ **Base de datos MySQL**
  - 12 tablas creadas
  - Esquema completo en schema.sql
  - Datos de ejemplo
- ✅ **Frontend React**
  - Vite + TypeScript configurado
  - shadcn/ui instalado
  - React Router configurado
  - Tailwind CSS configurado
- ✅ **Página Welcome creada**
  - Logo y bienvenida
  - Selector de idioma
  - Información de reserva
  - Progreso de huéspedes
- ✅ **Sistema de traducciones**
  - Hook useLanguage
  - 6 idiomas soportados
  - Persistencia en localStorage

### 📁 Archivos Modificados
- `database/schema.sql` - CREADO
- `api/*` - Arquitectura completa creada
- `src/pages/Welcome.tsx` - CREADO
- `src/hooks/useLanguage.tsx` - CREADO
- `src/hooks/useReservation.tsx` - CREADO
- `src/services/api.ts` - CREADO

### 💡 Aprendizajes y Decisiones
- **Decisión**: No usar framework PHP (Laravel, Symfony) para mantener simplicidad
- **Decisión**: No usar i18next, implementar traducciones custom
- **Decisión**: Usar shadcn/ui copiando componentes (no paquete npm)

---

## 🗓️ Sesión #015 - 2025-11-16

### 🎯 Objetivos Iniciales
- [x] Integrar nueva tabla `reserva` y `clientem` con el sistema existente
- [x] Agregar soporte para literas (bunk_beds) en preferencias
- [x] Implementar validación de disponibilidad de camas por alojamiento
- [x] Corregir persistencia de datos al navegar entre formularios
- [x] Mejorar UX del escaneo de documentos (Klippa)
- [x] Implementar scroll automático a campos con error

### ✅ Logros Completados

#### **1. Migración a Nuevas Tablas (reserva y clientem)**
- ✅ Creado modelo `Cliente.php` con formateo de datos para frontend
- ✅ Creado endpoint `GET /api/clients/{id}`
- ✅ Actualizado modelo `Reservation.php` para usar tabla `reserva`
- ✅ Mapeo de campos: `localizador_canal` → `reservation_code`, `alojamiento_id` → `accommodation_id`
- ✅ Validación: redirige a 404 si reserva no tiene `cliente_id` o cliente no existe
- ✅ Agregado `cliente_id` a interfaz `ReservationData` en frontend
- ✅ Autocompletado de datos de cliente al marcar "Soy el titular de la reserva"
- ✅ Checkbox de responsable movido al inicio del formulario con mejor UX

#### **2. Sistema de Literas (Bunk Beds)**
- ✅ Creado modelo `BedAvailability.php` con métodos de validación
- ✅ Creado endpoint `GET /api/accommodation/{id}/beds`
- ✅ Migración 011: agregado campo `bunk_beds` a tabla `preferences`
- ✅ Actualizado modelo `Preference.php` para soportar literas
- ✅ Endpoint `/api/preferences` valida disponibilidad antes de guardar
- ✅ Frontend: agregado estado y UI para literas en `RegisterPreferences.tsx`
- ✅ Carga dinámica de disponibilidad desde API
- ✅ Límites de selección según disponibilidad real del alojamiento
- ✅ Contadores deshabilitados cuando disponibilidad es 0

#### **3. Mejoras en Escaneo de Documentos**
- ✅ Función `mapDocumentType()`: PASSPORT → PAS, DNI → DNI, NIE → NIE, otros → other
- ✅ Botón "Seleccionar archivo" arreglado (ahora toda el área es clickeable)
- ✅ Botón "Continuar" se bloquea durante el escaneo
- ✅ Texto cambia a "Procesando..." mientras se escanea
- ✅ Logging mejorado en consola para debugging

#### **4. Persistencia de Datos del Formulario**
- ✅ `Register.tsx`: useEffect restaura ~30 campos desde contexto
- ✅ `RegisterPreferences.tsx`: useEffect restaura 9 campos de preferencias
- ✅ Datos persisten al navegar atrás desde cualquier paso
- ✅ Permite corregir errores sin perder información

#### **5. Navegación y UX**
- ✅ Scroll automático a campos con error (función `focusField()`)
- ✅ Navegación condicional en `RegisterTerms`:
  - Responsable: vuelve a `RegisterPreferences`
  - No responsable: vuelve a `Register`
- ✅ Validación visual mejorada con mensajes específicos

### 📁 Archivos Modificados/Creados

#### Backend (6 archivos)
1. `api/models/Cliente.php` - **CREADO**
   - Métodos: getById(), formatForFrontend(), exists()
   - Mapeo de tipos de documento y códigos de país
2. `api/models/BedAvailability.php` - **CREADO**
   - Métodos: getByAccommodation(), hasAvailability(), validateRequest()
3. `api/endpoints/clients.php` - **CREADO**
   - Endpoint: GET /api/clients/{id}
4. `api/endpoints/accommodation.php` - **MODIFICADO**
   - Agregado endpoint: GET /api/accommodation/{id}/beds
5. `api/endpoints/reservations.php` - **MODIFICADO**
   - Validación de cliente_id
   - Uso de tabla `reserva`
6. `api/endpoints/preferences.php` - **MODIFICADO**
   - Validación de disponibilidad de camas
7. `api/models/Reservation.php` - **MODIFICADO**
   - Query actualizado para tabla `reserva`
   - Mapeo de campos nuevos
8. `api/models/Preference.php` - **MODIFICADO**
   - Soporte para bunk_beds
9. `api/index.php` - **MODIFICADO**
   - Agregada ruta /api/clients/{id}
10. `database/migrations/011_add_bunk_beds_to_preferences.sql` - **CREADO**

#### Frontend (6 archivos)
1. `src/services/api.ts` - **MODIFICADO**
   - Agregado `clientService.getById()`
   - Agregado `accommodationService.getBeds()`
   - Actualizado `preferenceService.save()` con bunk_beds
2. `src/pages/Register.tsx` - **MODIFICADO**
   - Función `mapDocumentType()`
   - useEffect para restaurar datos (30+ campos)
   - Botón escanear arreglado
   - Botón continuar bloqueado durante escaneo
   - Autocompletado de datos de cliente
3. `src/pages/RegisterPreferences.tsx` - **MODIFICADO**
   - Estado `bunkBeds` agregado
   - UI contador para literas
   - Carga de disponibilidad desde API
   - Validación visual de disponibilidad
   - useEffect para restaurar preferencias
   - Contadores deshabilitados si disponibilidad = 0
4. `src/pages/RegisterTerms.tsx` - **MODIFICADO**
   - Navegación condicional en botón "Atrás"
5. `src/hooks/useRegistrationFlow.tsx` - **MODIFICADO**
   - Interfaz `PreferenceData` con bunk_beds
6. `src/hooks/useReservation.tsx` - **MODIFICADO**
   - Interfaz `ReservationData` con cliente_id

### 🐛 Bugs Resueltos
1. **Bug**: Permisos incorrectos en archivos PHP creados (600)
   - **Solución**: chmod 644 en Cliente.php y clients.php
2. **Bug**: Columnas SQL no coinciden (wifi_ssid, portal_code, door_code)
   - **Solución**: Mapeo a columnas reales (wifi_name, building_code, NULL)
3. **Bug**: Falta llamada a getConnection() en clients.php
   - **Solución**: Agregada inicialización de Database
4. **Bug**: Al volver atrás se borran datos del formulario
   - **Solución**: useEffect restaura datos desde contexto
5. **Bug**: Literas no se deshabilitan cuando disponibilidad es 0
   - **Solución**: Parámetro `disabled` en componente Counter
6. **Bug**: Botón "Atrás" en RegisterTerms siempre va a Preferencias
   - **Solución**: Navegación condicional según is_responsible

### 💡 Aprendizajes y Decisiones

#### **Decisiones Arquitectónicas**
1. **Tabla `reserva` vs `reservations`**: Usar tabla `reserva` de producción, mapear campos en modelo
2. **Validación de disponibilidad**: Backend valida antes de guardar, frontend muestra límites
3. **Persistencia de datos**: Usar contexto `useRegistrationFlow` para mantener estado entre navegación
4. **Literas como tipo separado**: No agrupar con otros tipos de cama, manejar independientemente

#### **Patrones Útiles**
1. **Restauración de datos**: useEffect con dependencia en guestData/preferenceData
2. **Validación visual**: Deshabilitar UI cuando no hay disponibilidad + mensaje explicativo
3. **Mapeo de datos**: Función `formatForFrontend()` centraliza transformación de datos
4. **Scroll a errores**: Función `focusField()` combina scroll + focus + toast

#### **Mejoras de UX**
1. Checkbox de responsable al inicio del formulario (más visible)
2. Autocompletado de datos reduce fricción para titular
3. Contadores muestran disponibilidad máxima en label
4. Mensajes específicos cuando algo no está disponible
5. Botones bloqueados durante operaciones async

### 🔄 Trabajo en Progreso
- 🚧 **Pendiente para mañana**: Actualizar modal de preferencias de camas en Dashboard

### ⏭️ Próximos Pasos (Para Mañana)

#### **Alta Prioridad**
1. **Modal de preferencias en Dashboard**
   - Actualizar con soporte para literas
   - Validación de disponibilidad en tiempo real
   - Actualización optimista de UI

2. **Actualizar información del alojamiento**
   - Migrar a nuevas tablas de información
   - Videos de bienvenida
   - Guía local
   - Atención al cliente

3. **Sistema de aperturas de puertas**
   - Actualizar con nueva estructura de tablas
   - Validación de permisos
   - Logging de intentos

#### **Media Prioridad**
4. Testing de flujo completo con datos reales
5. Verificar compatibilidad con alojamientos sin ciertas camas
6. Optimizar queries de disponibilidad (caching?)

### 📊 Métricas de la Sesión
- **Archivos creados**: 4
- **Archivos modificados**: 12
- **Líneas de código agregadas**: ~800 líneas
- **Bugs resueltos**: 6
- **Features completadas**: 6 grandes features
- **Migraciones de BD**: 1 (migración 011)
- **Endpoints nuevos**: 2 (clients, beds)
- **Duración estimada**: ~4 horas

### 🎓 Conocimientos Técnicos Aplicados
- React hooks avanzados (useEffect con múltiples dependencias)
- TypeScript interfaces y tipos
- PHP PDO y consultas SQL complejas
- Validación de datos en múltiples capas
- Manejo de estado global con Context API
- Scroll programático y focus management
- Mapeo de datos entre sistemas legacy y nuevos

---

## 📊 ESTADÍSTICAS DEL PROYECTO

### Sesiones Totales
**15 sesiones** de desarrollo activo

### Tiempo Aproximado
- **Sesión promedio**: 1-2 horas
- **Total estimado**: 15-22 horas

### Métricas de Código (Aproximadas)
- **Archivos TypeScript/TSX**: ~15 archivos
- **Archivos PHP**: ~13 archivos (incluyendo models)
- **Líneas de código frontend**: ~3,500 líneas
- **Líneas de código backend**: ~2,600 líneas
- **Archivos de spec**: 10 especificaciones técnicas
- **Migraciones de BD**: 3 archivos aplicados correctamente

### Commits Git
- **Total**: 4 commits
- **Último commit**: Sesión #011 - Bug fix checkbox + compilation
- **Próximo commit recomendado**: Después de implementar nuevas features

### Build de Producción
- **Bundle size**: 523.40 kB (159.91 kB gzip)
- **CSS size**: 65.59 kB (11.56 kB gzip)
- **Build time**: ~44 segundos
- **Última compilación**: 2025-11-10 05:47

---

## 🎯 OBJETIVOS GLOBALES DEL PROYECTO

### Fase 1: MVP Funcional (COMPLETADO ✅)
- [x] Setup inicial
- [x] Base de datos
- [x] Backend API REST
- [x] Frontend básico
- [x] Flujo de registro completo
- [x] Generación de contratos PDF
- [x] Sistema de traducciones

### Fase 2: Funcionalidades Avanzadas (EN PROGRESO 🔄)
- [x] Sistema de preferencias
- [x] Dashboard interactivo
- [x] Sistema de información de alojamiento (base de datos + API)
- [ ] Integración con cerraduras inteligentes
- [ ] Sistema de notificaciones
- [ ] Admin panel para anfitriones

### Fase 3: Optimización y Testing (PENDIENTE 📋)
- [ ] Tests unitarios
- [ ] Tests E2E
- [ ] Optimización de rendimiento
- [ ] PWA completa
- [ ] Documentación completa de API

### Fase 4: Producción (PENDIENTE 📋)
- [ ] CI/CD pipeline
- [ ] Monitoreo y logging
- [ ] Backups automatizados
- [ ] Despliegue a producción
- [ ] Marketing y lanzamiento

---

**Última actualización:** 2025-11-10 05:47
**Próxima sesión:** TBD
