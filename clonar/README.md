# Script para Duplicar Alojamiento

Este directorio contiene scripts SQL para duplicar un alojamiento completo con todas sus dependencias.

## 📋 Descripción

El script `duplicar_alojamiento.sql` crea una copia completa de un alojamiento existente, incluyendo:

- ✅ **Alojamiento principal** (tabla `alojamiento`)
  - Nombre con sufijo " DUPLICADO"
  - Todos los campos del alojamiento original
  
- ✅ **Información externa** (tabla `informacion_externa_alojamiento`)
  - Videos de bienvenida
  - Normas del alojamiento
  - Información de WiFi
  - Instrucciones de llegada
  - Toda la información categorizada

- ✅ **Información turística** (tabla `informacion_turistica_alojamiento`)
  - Guía local
  - Lugares de interés
  - Restaurantes, cafés, supermercados
  - Transporte y emergencias

- ✅ **Disponibilidad de camas** (tabla `camas_alojamiento`)
  - Camas dobles
  - Camas individuales
  - Sofá cama
  - Literas
  - Cuna

## 🚀 Uso

### Método 1: Editar el script directamente

1. Abre el archivo `duplicar_alojamiento.sql`
2. Busca la línea:
   ```sql
   SET @id_alojamiento_original = 1; -- CAMBIAR ESTE VALOR
   ```
3. Cambia el `1` por el ID del alojamiento que deseas duplicar
4. Ejecuta el script completo en tu base de datos

### Método 2: Usar el script parametrizado

1. Usa el archivo `duplicar_alojamiento_parametrizado.sql`
2. Ejecuta desde la línea de comandos:
   ```bash
   mysql -u usuario -p nombre_base_datos -e "SET @id_alojamiento_original = 5; SOURCE duplicar_alojamiento_parametrizado.sql"
   ```
   Reemplaza `5` con el ID del alojamiento que deseas duplicar

## 📊 Resultado

Después de ejecutar el script, verás:

1. **Mensaje de confirmación** con:
   - ID del alojamiento original
   - ID del nuevo alojamiento duplicado
   - Nombre original
   - Nombre nuevo (con " DUPLICADO")

2. **Resumen de registros copiados** mostrando cuántos registros se copiaron de cada tabla relacionada

## ⚠️ Notas Importantes

- El script NO duplica reservas ni huéspedes asociados al alojamiento
- El script NO duplica dispositivos de cerradura (se mantiene la referencia al mismo `id_cerradura_raixer`)
- Si necesitas un `id_cerradura_raixer` diferente, deberás actualizarlo manualmente después de la duplicación
- El script es seguro y no modifica ni elimina el alojamiento original

## 🔍 Verificación

Para verificar que la duplicación fue exitosa:

```sql
-- Ver el alojamiento duplicado
SELECT * FROM alojamiento WHERE idalojamiento = @id_alojamiento_nuevo;

-- Ver información externa duplicada
SELECT * FROM informacion_externa_alojamiento WHERE id_alojamiento = @id_alojamiento_nuevo;

-- Ver información turística duplicada
SELECT * FROM informacion_turistica_alojamiento WHERE id_alojamiento = @id_alojamiento_nuevo;

-- Ver camas duplicadas
SELECT * FROM camas_alojamiento WHERE id_alojamiento = @id_alojamiento_nuevo;
```

## 📝 Ejemplo

Si tienes un alojamiento con ID 3 llamado "Casa Vista Hermosa" y ejecutas el script:

- **Antes**: Alojamiento ID 3 - "Casa Vista Hermosa"
- **Después**: 
  - Alojamiento ID 3 - "Casa Vista Hermosa" (original, sin cambios)
  - Alojamiento ID 15 - "Casa Vista Hermosa DUPLICADO" (nuevo)

## 🛠️ Personalización

Si necesitas modificar el sufijo " DUPLICADO", edita esta línea en el script:

```sql
CONCAT(nombre, ' DUPLICADO') as nombre,
```

Por ejemplo, para usar " - Copia":

```sql
CONCAT(nombre, ' - Copia') as nombre,
```
