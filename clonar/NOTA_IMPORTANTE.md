# ⚠️ NOTA IMPORTANTE - Scripts SQL

## Actualización del Sistema

Los scripts SQL (`duplicar_alojamiento.sql` y `duplicar_alojamiento_parametrizado.sql`) contienen ejemplos de campos, pero **la interfaz web PHP es más completa y recomendada**.

### 🌐 Interfaz Web PHP (RECOMENDADO)

La interfaz web en `duplicar.php` **duplica automáticamente TODOS los campos** de la tabla `alojamiento` sin necesidad de especificarlos manualmente:

- ✅ Descubre la estructura de la tabla dinámicamente
- ✅ Copia TODOS los campos excepto el ID
- ✅ Agrega " DUPLICADO" al nombre
- ✅ Agrega "-DUP" a la referencia
- ✅ No requiere actualización si cambias la estructura de la tabla

### 📝 Scripts SQL

Si prefieres usar SQL directamente, debes:

1. **Verificar los campos de tu tabla** ejecutando:
   ```sql
   SHOW COLUMNS FROM alojamiento;
   ```

2. **Actualizar el script** con TODOS los campos que veas (excepto `idalojamiento`)

3. **Ejecutar el script** modificado

### 💡 Recomendación

**Usa la interfaz web** (`http://localhost/app_huesped/clonar/`) porque:
- Es más fácil de usar
- Duplica automáticamente todos los campos
- Tiene vista previa
- Maneja errores automáticamente
- No requiere editar SQL

---

**Última actualización**: 2025-12-01  
**Versión**: 2.0 - Duplicación dinámica de campos
