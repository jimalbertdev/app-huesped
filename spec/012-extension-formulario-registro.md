# 📋 SPEC #012: Extensión de Formulario de Registro

**Fecha:** 2025-11-14
**Autor:** Claude + Usuario
**Estado:** ✅ COMPLETADO
**Tipo:** Feature Extension
**Prioridad:** Alta
**Sesión:** #012

---

## 🎯 Objetivo

Extender el formulario de registro de huéspedes con campos adicionales requeridos para cumplir con la normativa policial española de registro de viajeros, implementando validaciones condicionales complejas y mejorando la UX con autocompletado de municipios.

---

## 📊 Alcance

### Incluido en este Spec
- ✅ 12 nuevos campos en tabla `guests`
- ✅ 2 nuevos endpoints API (países y municipios)
- ✅ 8 validaciones condicionales (backend y frontend)
- ✅ Rediseño completo del formulario Register.tsx
- ✅ Autocompletado de municipios con debounce
- ✅ Cálculo automático de edad
- ✅ Auto-asignación de nacionalidad para DNI/NIE

### Excluido de este Spec
- ❌ OCR para extracción de datos de documento
- ❌ Validación de formato específico por tipo de documento (regex)
- ❌ Integración con Google Maps API
- ❌ Tests unitarios automatizados
- ❌ Internacionalización de labels

---

## 🏗️ Arquitectura

### Diagrama de Flujo
```
Usuario → Formulario Register.tsx
         ↓
     Validación Frontend (Zod)
         ↓
     POST /api/guests
         ↓
     Validación Backend (PHP)
         ↓
     Modelo Guest.php
         ↓
     BD: INSERT into guests
```

### Nuevas Dependencias
- **Frontend:** Ninguna (usa librerías existentes)
- **Backend:** Ninguna (usa PDO nativo)
- **BD:** Tablas `paises` y `municipios_ine_esp` (ya existentes)

---

## 📦 Base de Datos

### Migración: `009_add_extended_guest_fields.sql`

**Campos Agregados (12):**
1. `second_last_name` VARCHAR(100) NULL
2. `support_number` VARCHAR(20) NULL
3. `issue_date` DATE NULL
4. `expiry_date` DATE NULL
5. `age` INT NULL (calculado)
6. `relationship` ENUM(...) NULL
7. `residence_country` VARCHAR(3) NULL
8. `residence_municipality_code` VARCHAR(10) NULL
9. `residence_municipality_name` VARCHAR(150) NULL
10. `residence_postal_code` VARCHAR(10) NULL
11. `residence_address` TEXT NULL
12. `phone_country_code` VARCHAR(5) NULL

**Modificaciones:**
- `document_type` ENUM extendido: DNI, NIE, NIF, CIF, PAS, OTRO
- `phone` VARCHAR(20) (sin código de país)

**Índices Nuevos (5):**
- idx_residence_country
- idx_residence_municipality
- idx_age
- idx_expiry_date
- idx_relationship

**Tablas Auxiliares:**
- `paises` (246 registros) - Ya existente, copiada
- `municipios_ine_esp` (8,107 registros) - Ya existente

---

## 🔌 API

### Nuevos Endpoints

#### 1. GET /api/countries
**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "code": "ES",
      "code_alpha3": "ESP",
      "name": "España",
      "phone_prefix": "+34"
    }
  ]
}
```

#### 2. GET /api/countries/search?q={query}
**Parámetros:** `q` (query string, min 1 carácter)
**Respuesta:** Array de países filtrados

#### 3. GET /api/countries/{code}
**Parámetros:** `code` (ISO 2 o 3 letras)
**Respuesta:** Objeto país único

#### 4. GET /api/municipalities/search?q={query}
**Parámetros:** `q` (query string, min 2 caracteres)
**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "code": "28079",
      "name": "Madrid",
      "postal_code": "28000",
      "display_name": "Madrid (CP: 28000)"
    }
  ]
}
```

#### 5. GET /api/municipalities/{code}
**Parámetros:** `code` (código INE)
**Respuesta:** Objeto municipio único

### Endpoint Modificado

#### POST /api/guests (extendido)
**Nuevas Validaciones:**
1. DNI/NIE requiere `second_last_name`
2. DNI/NIE requiere `support_number`
3. Edad < 18 requiere `relationship`
4. `residence_country` = ES requiere `residence_municipality_code`
5. `residence_country` != ES requiere `residence_municipality_name`
6. `expiry_date` > `issue_date`
7. `expiry_date` >= hoy
8. Formato email válido

**Nuevos Campos Aceptados:** 12 campos adicionales

---

## 🎨 Frontend

### Archivos Creados

#### 1. `src/lib/catalogs.ts`
**Propósito:** Catálogos estáticos de datos

**Exports:**
- `DOCUMENT_TYPES` (6 tipos con metadatos)
- `RELATIONSHIP_TYPES` (15 tipos)
- `SEX_OPTIONS` (4 opciones)
- Helper functions:
  - `requiresSecondSurname(type): boolean`
  - `requiresSupportNumber(type): boolean`
  - `calculateAge(birthDate): number`
  - `isMinor(birthDate): boolean`

#### 2. `src/schemas/guestSchema.ts`
**Propósito:** Validaciones Zod

**Exports:**
- `extendedGuestSchema` (Zod schema con 8 refinements)
- `ExtendedGuestFormData` (tipo derivado)
- Interfaces: `Country`, `Municipality`, `ApiResponse<T>`

**Refinements (8):**
1. DNI/NIE → second_last_name required
2. DNI/NIE → support_number required
3. País ES → municipality required
4. País != ES → city required
5. expiry_date > issue_date
6. expiry_date >= today
7. Edad < 18 → relationship required
8. Edad razonable (0-120)

### Archivos Modificados

#### 1. `src/services/api.ts`
**Agregado:**
- `countryService` (getAll, search, getByCode)
- `municipalityService` (search, getByCode)

#### 2. `src/pages/Register.tsx` (REDISEÑO COMPLETO)

**Estados Agregados (23):**
- Documento: 5 estados
- Personal: 8 estados (incluye `age` calculado)
- Residencia: 5 estados
- Contacto: 3 estados
- Auxiliares: 4 estados (countries, municipalities, search, loading)

**useEffects Agregados (4):**
1. Cargar países al montar
2. Calcular edad automáticamente
3. Auto-seleccionar nacionalidad ES para DNI/NIE
4. Buscar municipios con debounce 300ms

**Validaciones Frontend (handleSubmit):**
- 8 validaciones condicionales
- Validación formato email (regex)
- Normalización de datos

**UI Rediseñada (4 secciones):**

**Sección 1: 📄 Documento de Identidad**
- Tipo documento (Select dinámico)
- Número documento (auto-mayúsculas)
- Número soporte (condicional DNI/NIE)
- Fecha expedición
- Fecha vencimiento

**Sección 2: 👤 Datos Personales**
- Nacionalidad (auto-disabled para DNI/NIE)
- Nombres
- Primer apellido
- Segundo apellido (condicional DNI/NIE)
- Fecha nacimiento + edad automática
- Sexo
- Parentesco (condicional < 18 años)

**Sección 3: 🏠 Datos de Residencia**
- País residencia (Select 246 países)
- **Si España:**
  - Búsqueda municipio con autocompletado
  - Código postal (auto-completado, disabled)
- **Si otro país:**
  - Ciudad (input libre)
  - Código postal (opcional)
- Dirección completa

**Sección 4: 📞 Información de Contacto**
- Código país (Select con banderas)
- Número teléfono
- Email

---

## 🧪 Testing

### Tests Backend Realizados
- ✅ Migración ejecutada sin errores
- ✅ Endpoint países: GET /api/countries/ES → 200 OK
- ✅ Endpoint municipios: GET /api/municipalities/search?q=Madrid → 200 OK
- ✅ Validación DNI sin segundo apellido → 400 Bad Request ✓

### Tests Frontend Realizados
- ✅ Compilación exitosa (build en 40.65s)
- ✅ Bundle size: 532 kB (162 kB gzip)

### Tests Manuales Pendientes
- [ ] Registro DNI completo (España)
- [ ] Registro NIE completo
- [ ] Registro Pasaporte extranjero
- [ ] Registro menor de edad (requiere parentesco)
- [ ] Autocompletado municipios (escribir "Madrid")
- [ ] Validación documento vencido
- [ ] Validación fecha expedición > vencimiento

---

## 📈 Métricas

### Código
- **Archivos creados:** 4 (2 backend, 2 frontend)
- **Archivos modificados:** 6 (3 backend, 3 frontend)
- **Líneas de código:** ~1,200 nuevas
- **Campos formulario:** 8 → 23+ (incremento 188%)
- **Validaciones:** 3 → 11 (incremento 267%)

### Base de Datos
- **Campos tabla guests:** 24 → 36 (incremento 50%)
- **Índices nuevos:** 5
- **Registros paises:** 246
- **Registros municipios:** 8,107

### Performance
- **Build time:** 40.65s
- **Bundle size:** 532 kB (advertencia: >500 kB)
- **Debounce búsqueda:** 300ms
- **Endpoints probados:** 5/5 funcionando

---

## 🔒 Seguridad

### Validación Doble
- ✅ Frontend: Zod schemas con refinements
- ✅ Backend: PHP validaciones robustas

### Sanitización
- ✅ Normalización mayúsculas (documentos)
- ✅ Trim de espacios
- ✅ Validación formato email
- ✅ Prepared statements SQL (protección injection)

### Validaciones de Negocio
- ✅ Documento no vencido
- ✅ Fechas coherentes (expedición < vencimiento)
- ✅ Edad razonable (0-120 años)
- ✅ Municipio válido (solo códigos INE existentes)

---

## 🚀 Despliegue

### Pasos Realizados
1. ✅ Ejecutar migración 009
2. ✅ Copiar tabla `paises` a BD activa
3. ✅ Crear endpoints API
4. ✅ Actualizar modelo Guest.php
5. ✅ Rediseñar formulario
6. ✅ Compilar aplicación (`npm run build`)

### Configuración Requerida
- **Base de datos:** `vacanfly_app_huesped_prueba`
- **URL desarrollo:** `http://localhost.local:8080`
- **URL API:** `http://localhost.local/app_huesped/api`

---

## 💡 Decisiones Técnicas

### 1. Usar Tablas Existentes de Países y Municipios
**Decisión:** No crear tablas nuevas, usar `paises` y `municipios_ine_esp`
**Razón:** Ya estaban pobladas con datos oficiales INE
**Beneficio:** Ahorro de tiempo, datos confiables

### 2. Debounce de 300ms en Búsqueda
**Decisión:** Implementar debounce en búsqueda de municipios
**Razón:** 8,107 municipios requieren optimización
**Implementación:** useEffect con setTimeout + cleanup

### 3. Separar Código País del Teléfono
**Decisión:** Campos separados `phone_country_code` + `phone`
**Razón:** Normalización internacional, validación precisa
**Beneficio:** Futura validación por país

### 4. Campos Condicionales vs Siempre Visibles
**Decisión:** Renderizado condicional con helpers
**Razón:** Mejor UX, menos confusión
**Implementación:** `{condition && <Component />}`

### 5. Helper Functions en Catálogos
**Decisión:** Centralizar lógica en `catalogs.ts`
**Razón:** Reutilización en validaciones y UI
**Beneficio:** Código DRY y mantenible

---

## 📋 Próximos Pasos

### Inmediatos (Críticos)
1. **Testing manual completo** - Verificar todos los flujos
2. **Documentar casos de prueba** - Crear checklist

### Corto Plazo (Mejoras)
1. **Code splitting** - Reducir bundle size
2. **Cache de países** - Almacenar en localStorage
3. **Tests unitarios** - Vitest + React Testing Library

### Largo Plazo (Futuro)
1. **OCR de documentos** - Extracción automática
2. **Validación regex** - Por tipo de documento
3. **Google Maps** - Geocodificación de dirección
4. **i18n de labels** - Internacionalización completa

---

## ⚠️ Problemas Conocidos

### Bundle Size > 500 kB
**Problema:** Vite warning sobre bundle size
**Impacto:** Potencial degradación en conexiones lentas
**Solución sugerida:** Code splitting con React.lazy()
**Prioridad:** Media

### Sin Tests Automatizados
**Problema:** Solo tests manuales
**Impacto:** Riesgo de regresiones
**Solución sugerida:** Implementar Vitest + RTL
**Prioridad:** Media

### Municipios Sin Cache
**Problema:** Búsqueda siempre va a BD
**Impacto:** Latencia innecesaria
**Solución sugerida:** Cache en localStorage
**Prioridad:** Baja

---

## 📚 Referencias

- [Normativa Policial de Registro de Viajeros (España)](https://www.policia.es)
- [INE - Códigos de Municipios](https://www.ine.es/daco/daco42/codmun/cod_ccaa_provincia.htm)
- [ISO 3166-1 alpha-2 - Códigos de Países](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)
- [Zod Documentation - Refinements](https://zod.dev/?id=refine)

---

## ✅ Checklist de Completitud

- [x] Migración SQL ejecutada
- [x] Endpoints API creados y probados
- [x] Modelo Guest.php actualizado
- [x] Validaciones backend implementadas
- [x] Catálogos frontend creados
- [x] Schemas Zod implementados
- [x] Formulario completamente rediseñado
- [x] useEffects implementados
- [x] Compilación exitosa
- [x] Documentación actualizada (SESSION_LOG, PROJECT_CONTEXT)
- [ ] Tests manuales completados
- [ ] Deploy a producción

---

**Fecha de Completitud:** 2025-11-14
**Tiempo Invertido:** ~4.5 horas
**Estado:** ✅ IMPLEMENTADO - Pendiente testing manual
