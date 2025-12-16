<?php
/**
 * Script de migración: Importar Guía Local desde PDFs
 * 
 * Uso: php database/import_pdf_guides.php [dry-run]
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

// Configuración
$docDir = __DIR__ . '/docs/guia_local';
$isCli = (php_sapi_name() === 'cli');
$args = $isCli ? $argv : [];
$dryRun = in_array('dry-run', $args) || (isset($_GET['dry-run']) && $_GET['dry-run'] == '1');

echo "=== MIGRACIÓN GUÍA LOCAL DESDE PDFs ===\n";
echo "Directorio: $docDir\n";
echo "Modo: " . ($dryRun ? "SIMULACIÓN (No se realizarán cambios)" : "EJECUCIÓN") . "\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // 1. Obtener archivos PDF
    $files = glob("$docDir/*.pdf");
    echo "Encontrados " . count($files) . " archivos PDF.\n\n";
    
    // Cache de categorías para evitar duplicados / mantener IDs
    // [ 'NOMBRE_UPPER' => ['id' => 1, 'parent_id' => null] ]
    $categoryCache = [];
    
    // Cargar categorías existentes
    $stmt = $db->query("SELECT id, nombre, id_subcategoria FROM guia_local_subcategoria");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $key = normalizeName($row['nombre']);
        $categoryCache[$key] = [
            'id' => $row['id'],
            'parent_id' => $row['id_subcategoria']
        ];
    }
    
    $globalOrder = 0; // Para ordenar nuevas categorías
    
    foreach ($files as $file) {
        $filename = basename($file);
        $accommodationId = (int) pathinfo($filename, PATHINFO_FILENAME);
        
        echo ">>> Procesando: $filename (ID Alojamiento: $accommodationId)...\n";
        
        // Extraer texto
        $text = shell_exec("pdftotext " . escapeshellarg($file) . " -");
        if (!$text) {
            echo "    Error: No se pudo extraer texto.\n";
            continue;
        }
        
        $lines = explode("\n", $text);
        
        $currentParentId = null;
        $currentSubId = null;
        
        $currentItemName = null;
        $currentItemDesc = "";
        
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            // Detectar Item (comienza con ❖)
            // A veces pdftotext extrae "❖" como algo diferente, revisar char code si falla. 
            // En la prueba salió "❖".
            if (mb_strpos($line, '❖') !== false) {
                // Guardar item anterior
                if ($currentItemName) {
                    saveItem($db, $accommodationId, $currentItemName, $currentItemDesc, ($currentSubId ?: $currentParentId), $dryRun);
                }
                
                // Nuevo item
                // Limpiar marcador
                $currentItemName = trim(str_replace(['❖', '❖ '], '', $line));
                $currentItemDesc = ""; // Reiniciar descripción
                continue;
            }
            
            // Si estamos dentro de un item, agregar a descripción
            if ($currentItemName) {
                // Detectar si la línea parece un nuevo encabezado de categoría erróneo
                // (e.g. ALL CAPS pero estamos en la descripción? Poco probable si sigue formato)
                // Pero hay que tener cuidado con "Dirección:", etc.
                
                // Formatear líneas de detalle
                if (preg_match('/^(Dirección|Ubicación|Location|Teléfono|Telf|Móvil|Web|Redes|http|site|map):/i', $line) || strpos($line, 'http') !== false || preg_match('/^\+?\d[\d\s\-\.]{6,}/', $line)) {
                     
                     // Procesar Teléfonos
                     if (preg_match('/(Teléfono|Telf|Móvil)[:\.]?\s*(.+)/i', $line, $matches) || (preg_match('/^\+?[\d\s\-\.]{7,}$/', $line) && !strpos($line, 'http'))) {
                         $rawPhone = $matches[2] ?? $line;
                         // Limpiar para href (solo números y +)
                         $cleanPhone = preg_replace('/[^\d\+]/', '', $rawPhone);
                         $formattedPhone = '<a href="tel:' . $cleanPhone . '">' . trim($rawPhone) . '</a>';
                         
                         $prefix = isset($matches[1]) ? $matches[1] . ': ' : '';
                         $currentItemDesc .= $prefix . $formattedPhone . "<br>";
                     }
                     // Procesar URLs
                     else if (preg_match('/(https?:\/\/[^\s]+)/', $line, $matches)) {
                         $url = $matches[1];
                         $lowerUrl = strtolower($url);
                         
                         $linkText = 'Página web';
                         
                         if (strpos($lowerUrl, 'google.com/maps') !== false || strpos($lowerUrl, 'goo.gl') !== false || strpos($lowerUrl, 'maps.app.goo.gl') !== false) {
                             $linkText = 'Ver en Google Maps';
                         } elseif (strpos($lowerUrl, 'instagram.com') !== false) {
                             $linkText = 'Instagram';
                         } elseif (strpos($lowerUrl, 'facebook.com') !== false) {
                             $linkText = 'Facebook';
                         } elseif (strpos($lowerUrl, 'tripadvisor') !== false) {
                             $linkText = 'TripAdvisor';
                         } elseif (strpos($lowerUrl, 'twitter.com') !== false || strpos($lowerUrl, 'x.com') !== false) {
                             $linkText = 'X (Twitter)';
                         } elseif (strpos($lowerUrl, 'youtube.com') !== false || strpos($lowerUrl, 'youtu.be') !== false) {
                             $linkText = 'YouTube';
                         } elseif (strpos($lowerUrl, 'tiktok.com') !== false) {
                             $linkText = 'TikTok';
                         }
                         
                         $linkHtml = '<a href="' . $url . '" target="_blank">' . $linkText . '</a>';
                         
                         // Reemplazar URL en la línea original por el enlace
                         $newLine = str_replace($url, $linkHtml, $line);
                         $currentItemDesc .= $newLine . "<br>";
                     } 
                     else {
                         $currentItemDesc .= $line . "<br>";
                     }
                     
                } else if (preg_match('/^[A-ZÁÉÍÓÚÑ\s,]+$/u', $line) && strlen($line) > 3 && !strpos($line, ':')) {
                     // Parece un nuevo Parent Category (ALL CAPS)
                     // Guardar item y cerrar
                     saveItem($db, $accommodationId, $currentItemName, $currentItemDesc, ($currentSubId ?: $currentParentId), $dryRun);
                     $currentItemName = null;
                     
                     // Procesar como Parent
                     $catName = trim($line);
                     // Ignorar encabezados comunes o basura
                     if (strpos($catName, 'GUÍA LOCAL') !== false) continue;
                     
                     $currentParentId = findOrCreateCategory($db, $catName, null, $categoryCache, $globalOrder, $dryRun);
                     $currentSubId = null; // Reset sub
                } else if (preg_match('/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+$/u', $line) && strlen($line) < 50 && !strpos($line, ':')) {
                     // Parece una Subcategoría (Title Case, corta)
                     // Pero cuidado con lineas de descripción que coincidan.
                     // Asumimos que si estamos parseando descripción y sale esto, 
                     // Y NO es "Spain" o "Castellón", etc.
                     $ignore = ['spain', 'castellón', 'castelló'];
                     if (in_array(strtolower($line), $ignore)) {
                         $currentItemDesc .= $line . "<br>";
                     } else {
                         // Asumir que es nueva subcategoría
                         saveItem($db, $accommodationId, $currentItemName, $currentItemDesc, ($currentSubId ?: $currentParentId), $dryRun);
                         $currentItemName = null;
                         
                         $catName = trim($line);
                         $currentSubId = findOrCreateCategory($db, $catName, $currentParentId, $categoryCache, $globalOrder, $dryRun);
                     }
                } else {
                     // Línea normal de descripción
                     $currentItemDesc .= $line . "<br>";
                }
                
                continue;
            }
            
            // Si NO estamos en un item, buscar categorías
            
            // Parent Category (ALL CAPS)
            if (preg_match('/^[A-ZÁÉÍÓÚÑ\s,]+$/u', $line) && strlen($line) > 3) {
                 $catName = trim($line);
                 if (strpos($catName, 'GUÍA LOCAL') !== false) continue;
                 if (strpos($catName, 'ORDENAR EN BASE') !== false) continue; // Instrucciones
                 
                 $currentParentId = findOrCreateCategory($db, $catName, null, $categoryCache, $globalOrder, $dryRun);
                 $currentSubId = null;
                 echo "    [PADRE] $catName (ID: $currentParentId)\n";
            }
            // Subcategory (Mixed Case)
            else if ($currentParentId && strlen($line) < 60 && !strpos($line, ':')) {
                 $catName = trim($line);
                 // Ignorar basura
                 if (stripos($catName, 'recomendaciones') !== false) continue;
                 if (stripos($catName, 'ordenar en') !== false) continue;
                 
                 $currentSubId = findOrCreateCategory($db, $catName, $currentParentId, $categoryCache, $globalOrder, $dryRun);
                 echo "      [SUB] $catName (ID: $currentSubId)\n";
            }
        }
        
        // Guardar último item
        if ($currentItemName) {
            saveItem($db, $accommodationId, $currentItemName, $currentItemDesc, ($currentSubId ?: $currentParentId), $dryRun);
        }
        
    }
    
    echo "\n=== MIGRACIÓN COMPLETADA ===\n";
    
} catch (Exception $e) {
    echo "\nERROR FATAL: " . $e->getMessage() . "\n";
}


// --- FUNCIONES ---

function normalizeName($name) {
    return trim(mb_strtoupper($name));
}

function findOrCreateCategory($db, $name, $parentId, &$cache, &$order, $dryRun) {
    $name = trim($name);
    $key = normalizeName($name);
    
    // Verificar si existe en cache (para este padre)
    // Nota: Una subcategoría "Sushi" podría existir bajo "Asiático" y "Japonés".
    // Así que la clave debe incluir el padre si es subcategoría?
    // El usuario dijo "tengo catagorias padres y categoias hijas definidas en la misma tabla".
    // Si queremos reutilizar globalmente "Restaurantes", usamos solo nombre.
    // Si queremos "Trattoria" bajo "Italiano", usamos nombre.
    // Asumiremos que el nombre es único globalmente para simplificar, 
    // o buscamos por nombre AND parent_id.
    
    // Mejor buscar por nombre y padre
    foreach ($cache as $k => $data) {
        if ($k === $key && $data['parent_id'] == $parentId) {
            return $data['id'];
        }
    }
    
    // Si no existe, crear
    if ($dryRun) {
        return 999;
    }
    
    $order++;
    $stmt = $db->prepare("INSERT INTO guia_local_subcategoria (nombre, id_subcategoria, orden) VALUES (?, ?, ?)");
    try {
        $stmt->execute([$name, $parentId, $order]);
        $id = $db->lastInsertId();
        
        // Agregar a cache
        $cache[$key] = ['id' => $id, 'parent_id' => $parentId];
        
        return $id;
    } catch (Exception $e) {
        // Puede fallar si hay unique constraint
        echo "      Error al crear categoría '$name': " . $e->getMessage() . "\n";
        return 0;
    }
}

function saveItem($db, $accId, $name, $desc, $catId, $dryRun) {
    if (!$name || !$catId) return;
    
    // Limpiar nombre de caracteres extraños (espacios duros)
    $name = trim(preg_replace('/\s+/', ' ', $name));
    
    if ($dryRun) {
        echo "      + ITEM: $name (CatID: $catId)\n";
        return;
    }
    
    // Verificar duplicado
    $stmt = $db->prepare("SELECT id FROM guia_local WHERE id_alojamiento = ? AND nombre = ?");
    $stmt->execute([$accId, $name]);
    if ($stmt->fetch()) {
        echo "      . Item existente: $name (Mismo alojamiento)\n";
        return;
    }
    
    $stmt = $db->prepare("INSERT INTO guia_local (id_alojamiento, id_subcategoria, nombre, descripcion) VALUES (?, ?, ?, ?)");
    $stmt->execute([$accId, $catId, $name, $desc]);
    echo "      + Insertado: $name\n";
}
