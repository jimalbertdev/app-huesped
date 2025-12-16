# 📁 Carpeta CLONAR - Índice de Archivos

## 🌐 INTERFAZ WEB (RECOMENDADO)

### ⚡ Acceso Rápido
**Local**: `http://localhost/app_huesped/clonar/`  
**Servidor**: `https://tudominio.com/app_huesped/clonar/`

### 📱 Archivos de la Interfaz Web
- **index.php** - Página principal para seleccionar alojamiento
- **preview.php** - Vista previa completa antes de duplicar
- **duplicar.php** - Procesador de duplicación
- **exito.php** - Página de confirmación con estadísticas

### 📖 Documentación Web
- **README_WEB.md** - Guía completa de la interfaz web
- **INICIO_RAPIDO.md** - Guía de inicio rápido

👉 **¡Usa la interfaz web! Es más fácil y no necesitas escribir SQL**

---

## 📋 Archivos SQL (Alternativa)


### 1. 📖 **README.md** (3.4 KB)
**Descripción**: Documentación completa del sistema de duplicación
- Explicación detallada de qué se duplica
- Instrucciones de uso paso a paso
- Ejemplos prácticos
- Notas importantes y advertencias
- Consultas de verificación

👉 **Empieza aquí si es tu primera vez**

---

### 2. 🔧 **duplicar_alojamiento.sql** (3.8 KB)
**Descripción**: Script SQL principal para duplicar alojamientos
- Versión estándar con variable editable
- Incluye comentarios explicativos
- Muestra resultados de la duplicación
- Resumen de registros copiados

**Uso**:
```sql
-- Editar la línea 13:
SET @id_alojamiento_original = 1; -- Cambiar este número

-- Luego ejecutar todo el script
```

---

### 3. ⚡ **duplicar_alojamiento_parametrizado.sql** (4.0 KB)
**Descripción**: Script SQL parametrizado para uso desde línea de comandos
- Acepta parámetros externos
- Ideal para automatización
- Validación de parámetros incluida

**Uso**:
```bash
mysql -u usuario -p base_datos -e "SET @id_alojamiento_original = 5; SOURCE duplicar_alojamiento_parametrizado.sql"
```

---

### 4. ⚡ **guia_rapida.sql** (1.5 KB)
**Descripción**: Guía de referencia rápida con ejemplos
- Ejemplos listos para copiar y pegar
- Consultas de verificación
- Comandos para limpiar duplicados

**Uso**: Abre el archivo y copia los comandos que necesites

---

### 5. 📊 **ESTRUCTURA_BD.md** (3.6 KB)
**Descripción**: Documentación técnica de la estructura de base de datos
- Diagrama Mermaid de relaciones entre tablas
- Descripción detallada de cada tabla
- Explicación del proceso de duplicación
- Notas técnicas importantes

👉 **Útil para entender cómo funciona el sistema**

---

### 6. 📑 **INDICE.md** (este archivo)
**Descripción**: Índice navegable de todos los archivos

---

## 🚀 Inicio Rápido

### Para usuarios nuevos:
1. Lee **README.md** primero
2. Usa **duplicar_alojamiento.sql** para tu primera duplicación
3. Consulta **guia_rapida.sql** para ejemplos

### Para usuarios avanzados:
1. Usa **duplicar_alojamiento_parametrizado.sql** para automatización
2. Consulta **ESTRUCTURA_BD.md** para entender las relaciones

---

## 📌 Tablas que se Duplican

✅ **alojamiento** - Tabla principal del alojamiento  
✅ **informacion_externa_alojamiento** - Videos, normas, wifi, etc.  
✅ **informacion_turistica_alojamiento** - Guía local y lugares de interés  
✅ **camas_alojamiento** - Disponibilidad de camas  

---

## ⚠️ Importante

- El script NO duplica reservas ni huéspedes
- El alojamiento original NO se modifica
- El nombre del duplicado incluye " DUPLICADO"
- Todas las relaciones se mantienen correctamente

---

## 🆘 Soporte

Si tienes problemas:
1. Verifica que el ID del alojamiento existe
2. Revisa los permisos de la base de datos
3. Consulta los mensajes de error del script
4. Lee la sección de verificación en README.md

---

## 📝 Versión

- **Creado**: 2025-12-01
- **Versión**: 1.0
- **Base de datos**: moon_desarrollo
