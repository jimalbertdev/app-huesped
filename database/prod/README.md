# Migraciones de Producción

Este directorio contiene todas las migraciones necesarias para ejecutar en el servidor de producción.

## Contenido

- `migrations/016_create_application_views.sql` - Crea las vistas necesarias para la aplicación
- `run_migration_016.php` - Script para ejecutar la migración de vistas
- `run_local_guide_migration.php` - Script para separar registros concatenados de guía local
- `run_video_migration.php` - Script para convertir enlaces de video a embeds
- `run_all_migrations.php` - Script maestro para ejecutar todas las migraciones

## Prerrequisitos

1. **Configuración de base de datos**: El archivo `.env` debe estar configurado con las credenciales correctas:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=nombre_base_datos
   DB_USER=usuario
   DB_PASS=contraseña
   ```

2. **PHP**: Versión 7.4 o superior
3. **Extensiones PHP**: PDO, pdo_mysql
4. **Composer**: Las dependencias deben estar instaladas (`composer install`)

## Orden de Ejecución

Las migraciones deben ejecutarse en el siguiente orden:

1. **Migración 016 - Vistas de aplicación** (OBLIGATORIO)
2. **Migración de guía local** (OPCIONAL - solo si hay registros concatenados)
3. **Migración de videos** (OPCIONAL - solo si hay datos de videos)

## Instrucciones de Ejecución

### ⭐ RECOMENDADO: Ejecutar desde Navegador Web

**La forma más fácil de ejecutar las migraciones es desde el navegador:**

1. Sube la carpeta `database/prod/` a tu servidor
2. Accede a: `http://tudominio.com/database/prod/index.html`
3. Verás un panel con todas las migraciones disponibles
4. Haz clic en los botones para ejecutar cada migración

**URLs directas:**
- Panel principal: `http://tudominio.com/database/prod/index.html`
- Migración 016 (Vistas): `http://tudominio.com/database/prod/run_migration_016.php`
- Guía Local (Dry-run): `http://tudominio.com/database/prod/run_local_guide_migration.php?dry_run=1`
- Guía Local (Real): `http://tudominio.com/database/prod/run_local_guide_migration.php`
- Videos (Dry-run): `http://tudominio.com/database/prod/run_video_migration.php?dry_run=1`
- Videos (Real): `http://tudominio.com/database/prod/run_video_migration.php`

**Ventajas:**
- ✅ No requiere acceso a consola/SSH
- ✅ Interfaz visual con colores y formato
- ✅ Botones para dry-run y ejecución real
- ✅ Resultados en tiempo real en el navegador

---

### Opción Alternativa: Línea de Comandos

Si tienes acceso a consola SSH, también puedes ejecutar:

### Opción 1: Ejecutar todas las migraciones automáticamente

```bash
cd /ruta/a/app_huesped/database/prod
php run_all_migrations.php
```

### Opción 2: Ejecutar migraciones individuales

#### 1. Crear vistas de aplicación

```bash
cd /ruta/a/app_huesped/database/prod
php run_migration_016.php
```

**Qué hace:**
- Crea la vista `v_reservations_full` - Información completa de reservas
- Crea la vista `v_reservations_with_host` - Reservas con datos del anfitrión
- Crea la vista `v_guests_with_reservation` - Huéspedes con información de reserva

**Verificación:**
```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
SELECT COUNT(*) FROM v_reservations_full;
```

#### 2. Separar registros de guía local (OPCIONAL)

**Primero, ejecutar en modo dry-run para ver qué se va a cambiar:**

```bash
cd /ruta/a/app_huesped/database/prod
php run_local_guide_migration.php --dry-run
```

**Luego, ejecutar la migración real:**

```bash
php run_local_guide_migration.php
```

**Qué hace:**
- Busca registros en `informacion_turistica_alojamiento` que contengan múltiples bloques HTML concatenados
- Separa cada bloque en un registro individual
- Elimina el registro original concatenado

**Verificación:**
```sql
SELECT COUNT(*) FROM informacion_turistica_alojamiento;
```

#### 3. Convertir videos a embeds (OPCIONAL)

**Primero, ejecutar en modo dry-run para ver qué se va a cambiar:**

```bash
cd /ruta/a/app_huesped/database/prod
php run_video_migration.php --dry-run
```

**Luego, ejecutar la migración real:**

```bash
php run_video_migration.php
```

**Qué hace:**
- Busca enlaces de YouTube y Google Drive en `informacion_externa_alojamiento` (categoría 8)
- Convierte los enlaces a iframes embebidos
- Reemplaza el contenido de la columna `descripcion`

**Verificación:**
```sql
SELECT id, descripcion 
FROM informacion_externa_alojamiento 
WHERE categoria = 8 AND descripcion LIKE '%<iframe%' 
LIMIT 3;
```

## Rollback (Reversión)

### Revertir migración de vistas

```sql
DROP VIEW IF EXISTS v_reservations_full;
DROP VIEW IF EXISTS v_reservations_with_host;
DROP VIEW IF EXISTS v_guests_with_reservation;
```

### Revertir migración de guía local

⚠️ **ADVERTENCIA**: La migración de guía local modifica datos existentes. Se recomienda hacer un backup antes de ejecutarla.

Para revertir, necesitarás restaurar desde el backup:

```bash
# Restaurar tabla específica desde backup
mysql -u usuario -p nombre_base_datos < backup_informacion_turistica_alojamiento.sql
```

### Revertir migración de videos

⚠️ **ADVERTENCIA**: La migración de videos modifica datos existentes. Se recomienda hacer un backup antes de ejecutarla.

Para revertir, necesitarás restaurar desde el backup:

```bash
# Restaurar tabla específica desde backup
mysql -u usuario -p nombre_base_datos < backup_informacion_externa_alojamiento.sql
```

## Crear Backup Antes de Migrar

**Backup de toda la base de datos:**
```bash
mysqldump -u usuario -p nombre_base_datos > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Backup solo de la tabla de videos:**
```bash
mysqldump -u usuario -p nombre_base_datos informacion_externa_alojamiento > backup_videos_$(date +%Y%m%d_%H%M%S).sql
```

## Solución de Problemas

### Error: "Access denied for user"
- Verificar credenciales en el archivo `.env`
- Verificar que el usuario tenga permisos CREATE VIEW y UPDATE

### Error: "Table doesn't exist"
- Verificar que las tablas base existan: `reserva`, `alojamiento`, `alojamiento_caracteristica`, `viajeros`, `checkin`
- Ejecutar migraciones anteriores si es necesario

### Error: "View already exists"
- Las vistas se eliminan automáticamente antes de crearlas (DROP VIEW IF EXISTS)
- Si persiste, eliminar manualmente: `DROP VIEW nombre_vista;`

## Verificación Post-Migración

Después de ejecutar las migraciones, verificar:

1. **Vistas creadas:**
   ```sql
   SHOW FULL TABLES WHERE Table_type = 'VIEW';
   ```

2. **Vistas funcionando:**
   ```sql
   SELECT COUNT(*) FROM v_reservations_full;
   SELECT COUNT(*) FROM v_reservations_with_host;
   SELECT COUNT(*) FROM v_guests_with_reservation;
   ```

3. **Videos convertidos (si aplica):**
   ```sql
   SELECT COUNT(*) FROM informacion_externa_alojamiento 
   WHERE categoria = 8 AND descripcion LIKE '%<iframe%';
   ```

## Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs de error de PHP
2. Verifica los permisos de base de datos
3. Asegúrate de que todas las dependencias estén instaladas
4. Consulta la documentación de la aplicación
