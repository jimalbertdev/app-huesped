# 🌐 Interfaz Web PHP - Duplicar Alojamientos

## 🎯 ¿Qué es esto?

Una interfaz web moderna y fácil de usar para duplicar alojamientos sin necesidad de ejecutar comandos SQL manualmente. Perfecta para usar desde phpMyAdmin o subir a tu servidor.

## ✨ Características

- ✅ **Interfaz visual moderna** - No necesitas escribir SQL
- ✅ **Vista previa completa** - Revisa toda la información antes de duplicar
- ✅ **Confirmación de seguridad** - Evita duplicaciones accidentales
- ✅ **Resultados detallados** - Ve exactamente qué se duplicó
- ✅ **Transacciones seguras** - Si algo falla, no se duplica nada
- ✅ **Diseño responsive** - Funciona en móvil, tablet y desktop

## 📋 Requisitos

- PHP 7.0 o superior
- Acceso a la base de datos
- Clase `Database` en `/api/includes/Database.php`

## 🚀 Instalación

### Opción 1: Ya está instalado (Desarrollo Local)

Si estás trabajando en el proyecto localmente, los archivos ya están en:
```
/var/www/html/app_huesped/clonar/
```

Simplemente abre en tu navegador:
```
http://localhost/app_huesped/clonar/
```

### Opción 2: Subir al Servidor

1. **Sube la carpeta completa** `clonar/` a tu servidor
2. **Asegúrate de que esté en la raíz** del proyecto (mismo nivel que `/api`)
3. **Accede desde el navegador**:
   ```
   https://tudominio.com/app_huesped/clonar/
   ```

### Opción 3: Usar desde phpMyAdmin

1. Copia el contenido de `clonar/` a una carpeta accesible por web
2. Asegúrate de que la ruta a `Database.php` sea correcta
3. Abre `index.php` en tu navegador

## 📖 Cómo Usar

### Paso 1: Seleccionar Alojamiento
![Paso 1](https://via.placeholder.com/800x400/667eea/ffffff?text=Selecciona+el+alojamiento)

1. Abre `index.php` en tu navegador
2. Selecciona el alojamiento que deseas duplicar del menú desplegable
3. Haz clic en "Ver Información y Continuar"

### Paso 2: Revisar Información
![Paso 2](https://via.placeholder.com/800x400/764ba2/ffffff?text=Revisa+la+información)

Verás una vista previa completa con:
- 🏠 Información del alojamiento
- 📝 Información externa (videos, normas, wifi)
- 🗺️ Guía local (restaurantes, transporte)
- 🛏️ Configuración de camas

### Paso 3: Confirmar Duplicación
![Paso 3](https://via.placeholder.com/800x400/48bb78/ffffff?text=Confirma+y+duplica)

1. Revisa que todo esté correcto
2. Haz clic en "✅ Confirmar y Duplicar"
3. Confirma en el diálogo de seguridad

### Paso 4: Ver Resultado
![Paso 4](https://via.placeholder.com/800x400/38a169/ffffff?text=Duplicación+exitosa)

Verás:
- ✅ Confirmación de éxito
- 📊 Estadísticas de registros duplicados
- 🔗 Enlaces para duplicar otro o ver el nuevo alojamiento

## 📁 Estructura de Archivos

```
clonar/
├── index.php              # Página principal - Selección
├── preview.php            # Vista previa del alojamiento
├── duplicar.php          # Procesador de duplicación
├── exito.php             # Página de éxito
├── duplicar_alojamiento.sql          # Script SQL (alternativa)
├── duplicar_alojamiento_parametrizado.sql
├── guia_rapida.sql
├── README.md             # Documentación SQL
├── ESTRUCTURA_BD.md      # Documentación técnica
├── INDICE.md             # Índice de archivos
└── README_WEB.md         # Esta documentación
```

## 🔒 Seguridad

- ✅ **Validación de entrada** - Todos los IDs son validados
- ✅ **Prepared statements** - Protección contra SQL injection
- ✅ **Transacciones** - Si algo falla, se revierte todo
- ✅ **Confirmación doble** - Evita duplicaciones accidentales
- ✅ **Escape de HTML** - Protección contra XSS

## ⚙️ Configuración

### Cambiar la Ruta de Database.php

Si tu archivo `Database.php` está en otra ubicación, edita la línea 6 en cada archivo PHP:

```php
// Cambiar esta línea:
require_once __DIR__ . '/../api/includes/Database.php';

// Por tu ruta:
require_once __DIR__ . '/tu/ruta/Database.php';
```

### Personalizar el Sufijo "DUPLICADO"

En `duplicar.php`, línea 47, cambia:

```php
CONCAT(nombre, ' DUPLICADO') as nombre,

// Por ejemplo:
CONCAT(nombre, ' - Copia') as nombre,
```

## 🐛 Solución de Problemas

### Error: "Class 'Database' not found"

**Solución**: Verifica que la ruta a `Database.php` sea correcta en la línea 6 de cada archivo.

### Error: "Access denied for user"

**Solución**: Verifica las credenciales de la base de datos en tu archivo de configuración.

### La página se ve sin estilos

**Solución**: Los estilos están embebidos en cada archivo PHP, no necesitas archivos CSS externos.

### Error: "Alojamiento no encontrado"

**Solución**: Verifica que el ID del alojamiento exista en la tabla `alojamiento`.

## 📊 Qué se Duplica

| Tabla | Descripción | Cantidad |
|-------|-------------|----------|
| `alojamiento` | Alojamiento principal | 1 registro |
| `informacion_externa_alojamiento` | Videos, normas, wifi | Todos los registros |
| `informacion_turistica_alojamiento` | Guía local | Todos los registros |
| `camas_alojamiento` | Configuración de camas | 1 registro |

## ⚠️ Importante

- ❌ **NO duplica reservas** - Solo la estructura del alojamiento
- ❌ **NO duplica huéspedes** - Solo información del alojamiento
- ✅ **El original NO se modifica** - Se crea uno nuevo
- ✅ **Nombre automático** - Se agrega " DUPLICADO" al nombre

## 🎨 Personalización de Estilos

Los estilos están en la sección `<style>` de cada archivo. Puedes personalizarlos editando:

- **Colores principales**: Busca `#667eea` y `#764ba2`
- **Fuentes**: Busca `font-family`
- **Espaciados**: Busca `padding` y `margin`

## 📞 Soporte

Si tienes problemas:

1. Verifica que todos los archivos estén en la misma carpeta
2. Revisa que la ruta a `Database.php` sea correcta
3. Comprueba los permisos de la carpeta
4. Revisa los logs de PHP para errores específicos

## 🔄 Actualización

Para actualizar la interfaz:

1. Descarga los nuevos archivos PHP
2. Reemplaza los archivos antiguos
3. Mantén tus personalizaciones de configuración

## 📝 Changelog

### v1.0 (2025-12-01)
- ✨ Lanzamiento inicial
- ✅ Interfaz completa de 4 páginas
- ✅ Sistema de transacciones
- ✅ Vista previa detallada
- ✅ Diseño responsive

---

**¿Prefieres usar SQL directamente?** Lee `README.md` para instrucciones de los scripts SQL.
