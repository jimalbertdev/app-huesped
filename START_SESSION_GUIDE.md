# 🚀 START SESSION GUIDE - VACANFLY GUEST APPLICATION

> **Propósito:** Guía paso a paso para iniciar sesiones de trabajo con Claude Code de manera eficiente y mantener contexto entre sesiones.

---

## 📖 TABLA DE CONTENIDOS

1. [Para el Usuario (Tú)](#-para-el-usuario-tú)
2. [Para Claude Code](#-para-claude-code)
3. [Comandos Útiles](#-comandos-útiles)
4. [Checklist de Inicio de Sesión](#-checklist-de-inicio-de-sesión)
5. [Checklist de Fin de Sesión](#-checklist-de-fin-de-sesión)
6. [Troubleshooting](#-troubleshooting)

---

## 👤 PARA EL USUARIO (TÚ)

### 🎯 Antes de Iniciar una Sesión con Claude

#### 1. **Revisar Contexto de Sesión Anterior**
```bash
# Leer la última sesión en SESSION_LOG.md
cat SESSION_LOG.md | grep -A 30 "Sesión #[0-9]" | tail -35

# O simplemente abrir el archivo
nano SESSION_LOG.md  # Ir al final del archivo
```

**Puntos clave a revisar:**
- ✅ ¿Qué se completó en la última sesión?
- ⚠️ ¿Qué quedó en progreso?
- 📋 ¿Cuáles son los próximos pasos sugeridos?
- 🐛 ¿Hay bugs pendientes de resolver?

#### 2. **Verificar Estado del Proyecto**
```bash
# Ver estado de Git
git status

# Ver últimos commits
git log --oneline -5

# Ver si hay cambios sin commitear
git diff --stat
```

#### 3. **Iniciar Servicios Necesarios**
```bash
# Verificar que Apache esté corriendo
sudo systemctl status apache2

# Si no está corriendo:
sudo systemctl start apache2

# Iniciar servidor de desarrollo frontend
cd /var/www/html/app_huesped
npm run dev
# Debería correr en http://localhost:8080
```

#### 4. **Verificar Conexión a Base de Datos**
```bash
# Test rápido de conexión
mysql -u root -p12345678 -e "USE moon_desarrollo; SELECT COUNT(*) FROM reservations;"

# O probar la API
curl http://localhost.local/app_huesped/api/health
```

### 💬 Cómo Iniciar la Conversación con Claude

**Opción 1: Sesión de Continuación** (tienes tareas pendientes)
```
Hola Claude! Voy a continuar trabajando en VACANFLY Guest Application.

Por favor:
1. Lee PROJECT_CONTEXT.md para entender el proyecto
2. Lee la última sesión en SESSION_LOG.md
3. Dime qué tareas quedaron pendientes y sugiere por dónde empezar

Contexto adicional:
[Agregar cualquier información extra, bugs encontrados, ideas nuevas, etc.]
```

**Opción 2: Sesión Nueva** (nueva funcionalidad)
```
Hola Claude! Voy a trabajar en una nueva funcionalidad para VACANFLY Guest Application.

Por favor lee PROJECT_CONTEXT.md para entender el proyecto.

Quiero implementar:
[Descripción detallada de la nueva funcionalidad]

Necesito que:
1. Analices cómo encaja en la arquitectura actual
2. Propongas un plan de implementación
3. Identifiques qué archivos necesitamos modificar/crear
```

**Opción 3: Sesión de Debugging**
```
Hola Claude! Necesito ayuda con un bug en VACANFLY Guest Application.

Contexto del proyecto en PROJECT_CONTEXT.md

El problema:
[Descripción del bug]

Pasos para reproducir:
1. [Paso 1]
2. [Paso 2]
3. [Error que ocurre]

Comportamiento esperado:
[Qué debería pasar]

Lo que he intentado:
[Cualquier solución que hayas probado]
```

### 📝 Durante la Sesión

#### Toma Notas de:
- ✅ Archivos creados o modificados
- 🐛 Bugs encontrados y resueltos
- 💡 Decisiones técnicas importantes
- ⚠️ Cambios que podrían afectar otras partes del sistema
- 📋 Tareas que surjan durante el desarrollo

#### Comandos Frecuentes
```bash
# Ver cambios en tiempo real
watch -n 2 'git status --short'

# Buscar TODOs que dejaste
grep -r "TODO" src/ api/ --exclude-dir=node_modules

# Ver logs de errores
tail -f logs/app.log

# Test rápido de API después de cambios
curl http://localhost.local/app_huesped/api/guests/1

# Ver si el frontend compila sin errores
# (ya debería estar corriendo con npm run dev)
```

---

## 🤖 PARA CLAUDE CODE

### 📚 Protocolo de Inicio de Sesión

#### 1. **Leer Archivos de Contexto** (SIEMPRE)
```
Al iniciar cualquier sesión, DEBES leer en este orden:

1. PROJECT_CONTEXT.md - Contexto general del proyecto
2. SESSION_LOG.md - Últimas 2 sesiones al menos
3. Cualquier archivo .md adicional que el usuario mencione
```

#### 2. **Analizar Estado Actual**
```
Después de leer contexto, analiza:

- ¿Qué se completó en la última sesión?
- ¿Qué quedó pendiente?
- ¿Hay bugs conocidos relacionados con la tarea actual?
- ¿Hay decisiones técnicas que debo respetar?
```

#### 3. **Confirmar Comprensión**
```
Antes de empezar a codificar, confirma con el usuario:

"He leído el contexto del proyecto. Entiendo que:
- [Resumen del estado actual]
- [Tarea pendiente de última sesión]
- [Próximos pasos sugeridos]

¿Quieres que continúe con [tarea pendiente] o prefieres trabajar en algo diferente?"
```

#### 4. **Durante el Desarrollo**
```
RECUERDA:

✅ Usar TodoWrite tool para trackear progreso
✅ Seguir convenciones del proyecto (ver PROJECT_CONTEXT.md)
✅ NO crear archivos nuevos innecesarios (preferir editar existentes)
✅ Mantener consistencia con arquitectura actual
✅ Comentar decisiones técnicas importantes
✅ Probar cambios cuando sea posible
```

#### 5. **Antes de Finalizar Sesión**
```
AL TERMINAR, DEBES:

1. Actualizar SESSION_LOG.md con entrada nueva usando el template
2. Si hubo cambios significativos, crear archivo en spec/ (formato: YYYYMMDD-HHMM-XXX.md)
3. Sugerir próximos pasos específicos
4. Listar cualquier bug o tarea pendiente
5. Dar resumen conciso de lo completado
```

### 🎯 Plantilla de Respuesta Inicial

```markdown
He leído el contexto del proyecto VACANFLY Guest Application.

## 📊 Estado Actual
- **Última sesión:** #008 (2025-11-08)
- **Completado:** [Lista de logros recientes]
- **Pendiente:** [Lista de tareas pendientes]
- **Bugs conocidos:** [Lista de bugs si hay]

## 🎯 Próximos Pasos Sugeridos
1. [Tarea 1 de SESSION_LOG]
2. [Tarea 2 de SESSION_LOG]
3. [Tarea 3 de SESSION_LOG]

## 💬 ¿Qué quieres trabajar hoy?
¿Continúo con las tareas pendientes o tienes algo específico en mente?
```

---

## 🛠 COMANDOS ÚTILES

### 🔍 Exploración del Proyecto

```bash
# Ver estructura de carpetas (sin node_modules, .git, vendor)
find . -maxdepth 3 -type d -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/vendor/*' | sort

# Ver archivos modificados recientemente
find . -name "*.tsx" -o -name "*.ts" -o -name "*.php" | xargs ls -lt | head -20

# Buscar archivos por nombre
find . -name "*Dashboard*" -type f

# Ver tamaño de archivos grandes
find . -type f -size +1M -exec ls -lh {} \; | awk '{ print $5, $9 }'
```

### 📝 Búsqueda de Código

```bash
# Buscar TODO, FIXME, NOTE en el código
grep -r "TODO\|FIXME\|NOTE" src/ api/ --exclude-dir=node_modules

# Buscar una función o clase específica
grep -r "function handleUpdatePreferences" src/

# Buscar importaciones de un archivo
grep -r "import.*useLanguage" src/

# Buscar uso de una API específica
grep -r "preferenceService" src/

# Buscar traducciones faltantes
grep -r "t('.*')" src/ | grep -o "t('[^']*')" | sort -u
```

### 🗄️ Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p12345678

# Usar BD del proyecto
mysql -u root -p12345678 -e "USE moon_desarrollo; SHOW TABLES;"

# Ver estructura de tabla
mysql -u root -p12345678 -e "USE moon_desarrollo; DESCRIBE guests;"

# Ver datos de ejemplo
mysql -u root -p12345678 -e "USE moon_desarrollo; SELECT * FROM reservations LIMIT 3;"

# Contar registros
mysql -u root -p12345678 -e "USE moon_desarrollo; SELECT COUNT(*) FROM guests;"

# Ver últimos registros
mysql -u root -p12345678 -e "USE moon_desarrollo; SELECT * FROM guests ORDER BY created_at DESC LIMIT 5;"

# Ejecutar migración
mysql -u root -p12345678 moon_desarrollo < database/migrations/009_*.sql

# Backup rápido
mysqldump -u root -p12345678 moon_desarrollo > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 🌐 Testing de API

```bash
# Health check
curl http://localhost.local/app_huesped/api/health

# Test endpoint de reservas
curl http://localhost.local/app_huesped/api/reservations/RES-2024-001

# Test endpoint de preferencias (GET)
curl http://localhost.local/app_huesped/api/preferences/1

# Test endpoint de preferencias (POST)
curl -X POST http://localhost.local/app_huesped/api/preferences \
  -H "Content-Type: application/json" \
  -d '{"reservation_id": 1, "needs_crib": true, "double_beds": 2}'

# Test con formato bonito
curl http://localhost.local/app_huesped/api/health | jq

# Ver headers de respuesta
curl -i http://localhost.local/app_huesped/api/health
```

### 📊 Git

```bash
# Ver estado
git status

# Ver últimos commits
git log --oneline -10

# Ver cambios sin commitear
git diff

# Ver cambios de un archivo específico
git diff src/pages/Dashboard.tsx

# Ver historial de un archivo
git log --oneline -- src/pages/Dashboard.tsx

# Ver quién modificó qué (blame)
git blame src/pages/Dashboard.tsx | head -20

# Buscar en commits
git log --grep="preferences"
```

### 🧹 Limpieza y Mantenimiento

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar build
rm -rf dist

# Limpiar cache de Vite
rm -rf node_modules/.vite

# Ver espacio usado por carpetas
du -sh dist/ node_modules/ uploads/

# Limpiar logs viejos
find logs/ -name "*.log" -mtime +7 -delete

# Limpiar uploads de prueba (¡CUIDADO!)
# find uploads/ -name "test_*" -delete
```

### 📈 Estadísticas

```bash
# Contar líneas de código TypeScript/React
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1

# Contar líneas de código PHP
find api -name "*.php" | xargs wc -l | tail -1

# Contar archivos por tipo
find src -type f | sed 's/.*\.//' | sort | uniq -c

# Ver archivos más grandes
find . -type f -not -path '*/node_modules/*' -not -path '*/vendor/*' -exec ls -lh {} \; | sort -k5 -hr | head -10
```

---

## ✅ CHECKLIST DE INICIO DE SESIÓN

### Para el Usuario

- [ ] **Revisar SESSION_LOG.md** - Leer última sesión
- [ ] **Verificar servicios** - Apache y npm dev server corriendo
- [ ] **Test rápido** - API health check y frontend carga
- [ ] **Git status** - Ver si hay cambios sin commitear
- [ ] **Definir objetivo** - Saber qué quiero lograr hoy
- [ ] **Iniciar conversación** - Dar contexto a Claude

### Para Claude

- [ ] **Leer PROJECT_CONTEXT.md**
- [ ] **Leer SESSION_LOG.md** (últimas 2 sesiones mínimo)
- [ ] **Analizar tareas pendientes**
- [ ] **Confirmar comprensión** con el usuario
- [ ] **Crear TODO list** para la sesión actual
- [ ] **Comenzar desarrollo** siguiendo convenciones

---

## 🏁 CHECKLIST DE FIN DE SESIÓN

### Para el Usuario

- [ ] **Probar cambios** - Verificar que todo funciona
- [ ] **Revisar archivos modificados** - `git status`
- [ ] **Decidir si hacer commit** - Si es un punto estable
- [ ] **Pedir a Claude actualizar SESSION_LOG.md**
- [ ] **Revisar próximos pasos** sugeridos por Claude
- [ ] **Guardar notas mentales** de decisiones importantes

### Para Claude

- [ ] **Completar TODO list** - Marcar todas las tareas
- [ ] **Actualizar SESSION_LOG.md** - Nueva entrada con template
- [ ] **Crear spec file** si hubo cambios significativos
- [ ] **Listar archivos modificados** con descripción de cambios
- [ ] **Documentar bugs** encontrados
- [ ] **Sugerir próximos pasos** específicos y accionables
- [ ] **Dar resumen final** conciso de la sesión

---

## 🆘 TROUBLESHOOTING

### Problema: Frontend no compila

```bash
# 1. Verificar errores en consola
npm run dev
# Leer errores cuidadosamente

# 2. Limpiar cache
rm -rf node_modules/.vite

# 3. Reinstalar dependencias si es necesario
rm -rf node_modules package-lock.json
npm install

# 4. Verificar imports
grep -r "import.*from" src/ | grep "ERROR"
```

### Problema: API devuelve 404

```bash
# 1. Verificar que Apache está corriendo
sudo systemctl status apache2

# 2. Verificar .htaccess
cat api/.htaccess

# 3. Verificar mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# 4. Probar endpoint directo
curl -i http://localhost.local/app_huesped/api/index.php
```

### Problema: Error de base de datos

```bash
# 1. Verificar que MySQL está corriendo
sudo systemctl status mysql

# 2. Test de conexión
mysql -u root -p12345678 -e "SELECT 1;"

# 3. Verificar que la BD existe
mysql -u root -p12345678 -e "SHOW DATABASES LIKE 'moon_desarrollo';"

# 4. Verificar credenciales en .env
cat .env | grep DB_
```

### Problema: Cambios no se reflejan en el frontend

```bash
# 1. Verificar que dev server está corriendo
# Deberías ver "hmr update" en consola cuando guardas

# 2. Hard refresh en navegador
# Ctrl + Shift + R (Windows/Linux)
# Cmd + Shift + R (Mac)

# 3. Limpiar cache del navegador
# DevTools → Application → Clear Storage

# 4. Reiniciar dev server
# Ctrl+C para detener
npm run dev
```

### Problema: Git muestra muchos cambios que no hice

```bash
# Posibles causas:
# 1. Cambios de EOL (line endings)
git config core.autocrlf input

# 2. Cambios de permisos
git config core.fileMode false

# 3. Archivos generados (dist/, node_modules/)
# Verificar .gitignore
cat .gitignore
```

---

## 📚 RECURSOS RÁPIDOS

### Documentación del Proyecto
- `PROJECT_CONTEXT.md` - Contexto general, stack, decisiones
- `SESSION_LOG.md` - Historial de sesiones
- `INSTRUCCIONES.md` - Guía de instalación
- `CLAUDE.md` - Contexto para Claude
- `spec/` - Especificaciones técnicas detalladas
- `README.md` - Readme original

### Archivos Clave
- `src/App.tsx` - Routing principal
- `src/hooks/useLanguage.tsx` - Sistema de traducciones
- `src/hooks/useReservation.tsx` - Datos de reserva
- `src/services/api.ts` - Cliente API
- `api/bootstrap.php` - Inicialización backend
- `api/guests.php` - Endpoint de huéspedes
- `api/preferences.php` - Endpoint de preferencias
- `database/schema.sql` - Esquema completo de BD

### URLs Importantes
- Frontend Dev: `http://localhost:8080/`
- API Base: `http://localhost.local/app_huesped/api/`
- Health Check: `http://localhost.local/app_huesped/api/health`
- Lovable Project: `https://lovable.dev/projects/19f23aac-3a01-4477-bc1e-1991b26b193f`

---

## 🎯 FLUJO DE TRABAJO IDEAL

```
1. INICIO
   ├─ Leer SESSION_LOG.md (última sesión)
   ├─ Verificar servicios (Apache + npm dev)
   ├─ Iniciar conversación con Claude
   └─ Claude lee contexto

2. PLANIFICACIÓN
   ├─ Claude confirma entendimiento
   ├─ Definir objetivos de sesión
   ├─ Crear TODO list
   └─ Comenzar desarrollo

3. DESARROLLO
   ├─ Escribir código
   ├─ Probar cambios
   ├─ Actualizar TODOs
   ├─ Documentar decisiones
   └─ Resolver bugs

4. FINALIZACIÓN
   ├─ Probar todo funcione
   ├─ Revisar archivos modificados
   ├─ Actualizar SESSION_LOG.md
   ├─ Crear spec/ si necesario
   └─ Commit (opcional)

5. CIERRE
   ├─ Revisar próximos pasos
   ├─ Guardar notas
   └─ Preparar para próxima sesión
```

---

**Última actualización:** 2025-11-09
**Versión:** 1.0
