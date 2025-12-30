<?php
/**
 * Script de migración: Importar Guía Local desde PDFs
 * 
 * Uso: php database/import_pdf_guides.php [dry-run]
 * 
 * Actualizado para soportar jerarquía explícita:
 * - Categoria-Padre: ...
 * - sub-categoria: ...
 * - recomendaciones: ... (Item)
 * - Resumen: ... (Descripción de subcategoría)
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

// Configuración
$docDir = __DIR__ . '/docs/guia_local';
$isCli = (php_sapi_name() === 'cli');
$args = $isCli ? $argv : [];
$dryRun = in_array('dry-run', $args) || (isset($_GET['dry-run']) && $_GET['dry-run'] == '1');

echo "=== MIGRACIÓN GUÍA LOCAL DESDE PDFs (Estructura Jerárquica) ===\n";
echo "Directorio: $docDir\n";
echo "Modo: " . ($dryRun ? "SIMULACIÓN (No se realizarán cambios)" : "EJECUCIÓN") . "\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // 1. Obtener archivos PDF
    $files = glob("$docDir/*.pdf");
    echo "Encontrados " . count($files) . " archivos PDF.\n\n";
    
    // Cache de categorías
    $categoryCache = [];
    
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
        
        // State Machine
        $context = 'NONE'; // NONE, ITEM, SUMMARY
        $currentItemName = null;
        $currentItemDesc = "";
        $currentSummary = "";
        $itemOrder = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            // Limpiar caracteres de control
            $line = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $line);
            
            if (empty($line)) continue;
            
            // 1. Detectar Keywords explícitos
            
            // CATEGORIA PADRE
             if (preg_match('/^categoria-padre:\s*(.+)/i', $line, $matches)) {
                  finishCurrentContext($db, $accommodationId, $context, $currentItemName, $currentItemDesc, $currentSummary, $currentSubId, ($currentSubId ?: $currentParentId), $dryRun, $itemOrder);
                  
                  $catNameRaw = trim($matches[1]);
                  $catNameWithTag = $catNameRaw;
                  $currentParentId = findOrCreateCategory($db, $catNameWithTag, null, $categoryCache, $globalOrder, $dryRun);
                  $currentSubId = null;
                  $context = 'NONE';
                  $itemOrder = 0;
                  echo "    [PADRE] $catNameWithTag (ID: $currentParentId)\n";
                  continue;
             }
             
             if (preg_match('/^sub-categoria:\s*(.+)/i', $line, $matches)) {
                  finishCurrentContext($db, $accommodationId, $context, $currentItemName, $currentItemDesc, $currentSummary, $currentSubId, ($currentSubId ?: $currentParentId), $dryRun, $itemOrder);
                  
                  $catNameRaw = trim($matches[1]);
                  $catNameWithTag = $catNameRaw;
                  if (!$currentParentId) {
                      echo "    ! Advertencia: Subcategoría '$catNameWithTag' encontrada sin Padre previo. Creando huérfana.\n";
                  }
                  $currentSubId = findOrCreateCategory($db, $catNameWithTag, $currentParentId, $categoryCache, $globalOrder, $dryRun);
                  $context = 'NONE';
                  $itemOrder = 0;
                  echo "      [SUB] $catNameWithTag (ID: $currentSubId)\n";
                  continue;
             }

             // RECOMENDACIONES (Auto-detectar como subcategoría)
             // Detectamos explícitamente "recomendaciones:" (prefijo común) o "Nuestras recomendaciones"
             if (preg_match('/^(?:recomendaciones:\s*|Nuestras recomendaciones)/iu', $line)) {
                  finishCurrentContext($db, $accommodationId, $context, $currentItemName, $currentItemDesc, $currentSummary, $currentSubId, ($currentSubId ?: $currentParentId), $dryRun, $itemOrder);
                  
                  // Limpiar el prefijo "recomendaciones:" si existe para dejar solo el título
                  $catNameRaw = preg_replace('/^recomendaciones:\s*/iu', '', $line);
                  $catNameRaw = trim($catNameRaw);
                  $catNameRaw = str_replace(['❖', '❖ '], '', $catNameRaw);
                  
                  $catNameWithTag = $catNameRaw;
                  if (!$currentParentId) {
                      echo "    ! Advertencia: Recomendación '$catNameWithTag' encontrada sin Padre previo. Creando huérfana.\n";
                  }
                  $currentSubId = findOrCreateCategory($db, $catNameWithTag, $currentParentId, $categoryCache, $globalOrder, $dryRun);
                  $context = 'NONE';
                  $itemOrder = 0;
                  echo "      [SUB-AUTO] $catNameWithTag (ID: $currentSubId)\n";
                  continue;
             }
             
             // RESUMEN (Descripción de Subcategoría)
             if (preg_match('/^Resumen:\s*(.+)?/i', $line, $matches)) {
                  finishCurrentContext($db, $accommodationId, $context, $currentItemName, $currentItemDesc, $currentSummary, $currentSubId, ($currentSubId ?: $currentParentId), $dryRun, $itemOrder);
                  
                  $context = 'SUMMARY';
                  $currentSummary = isset($matches[1]) ? trim($matches[1]) : "";
                  continue;
             }
             
             // ITEM (recomendaciones OR Bullet Point)
             $isItem = false;
             $itemNameRaw = '';
             
             if (preg_match('/^recomendaciones:\s*(.+)/i', $line, $matches)) {
                 $isItem = true;
                 $itemNameRaw = $matches[1];
             } elseif (mb_strpos($line, '❖') !== false) {
                  $isItem = true;
                  $itemNameRaw = str_replace(['❖', '❖ '], '', $line);
             }
             
             if ($isItem) {
                  finishCurrentContext($db, $accommodationId, $context, $currentItemName, $currentItemDesc, $currentSummary, $currentSubId, ($currentSubId ?: $currentParentId), $dryRun, $itemOrder);
                   $context = 'ITEM';
                   $currentItemName = "<h6>" . trim($itemNameRaw) . "</h6>";
                   $currentItemDesc = "";
                   $itemOrder++;
                   continue;
             }
             
             // 2. Procesar contenido según contexto
             if ($context === 'SUMMARY') {
                 $currentSummary .= ($currentSummary ? "<br>" : "") . $line;
             } elseif ($context === 'ITEM') {
                  // Detectar y formatear enlaces/teléfonos en la descripción del item (lógica anterior reutilizada)
                  $line = formatLine($line);
                  $currentItemDesc .= $line . "<br>";
             } else {
                 // Texto fuera de contexto explícito... podría ser basura o continuación de algo mal parseado.
                 // Ignorar o loguear.
             }
        }
        
        // Cerrar último bloque al terminar archivo
        finishCurrentContext($db, $accommodationId, $context, $currentItemName, $currentItemDesc, $currentSummary, $currentSubId, ($currentSubId ?: $currentParentId), $dryRun, $itemOrder);
        
    }
    
    echo "\n=== MIGRACIÓN COMPLETADA ===\n";
    
} catch (Exception $e) {
    echo "\nERROR FATAL: " . $e->getMessage() . "\n";
}


// --- FUNCIONES DE SOPORTE ---

function finishCurrentContext($db, $accId, &$context, &$itemName, &$itemDesc, &$summary, $subId, $targetCatId, $dryRun, $order) {
    if ($context === 'ITEM' && $itemName) {
        saveItem($db, $accId, $itemName, $itemDesc, $targetCatId, $dryRun, $order);
        $itemName = null;
        $itemDesc = "";
    } elseif ($context === 'SUMMARY' && $subId && $summary) {
        updateCategoryDescription($db, $subId, $summary, $dryRun);
        $summary = "";
    }
    $context = 'NONE';
}

function normalizeName($name) {
    return trim(mb_strtoupper($name));
}

function findOrCreateCategory($db, $name, $parentId, &$cache, &$order, $dryRun) {
    $name = trim($name);
    // Clave única compuesta por Nombre + PadreID para diferenciar subcategorías con mismo nombre
    $key = normalizeName($name) . '_' . ($parentId ?: 'ROOT');
    
    if (isset($cache[$key])) {
        return $cache[$key];
    }
    
    if ($dryRun) return 999;
    
    // Verificar en BD por si acaso
    $sql = "SELECT id FROM guia_local_subcategoria WHERE nombre = ?";
    $params = [$name];
    if ($parentId) {
        $sql .= " AND id_subcategoria = ?";
        $params[] = $parentId;
    } else {
        $sql .= " AND id_subcategoria IS NULL";
    }
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $cache[$key] = $row['id'];
        return $row['id'];
    }
    
    // Crear
    $order++;
    $stmt = $db->prepare("INSERT INTO guia_local_subcategoria (nombre, id_subcategoria, orden) VALUES (?, ?, ?)");
    try {
        $stmt->execute([$name, $parentId, $order]);
        $id = $db->lastInsertId();
        $cache[$key] = $id;
        return $id;
    } catch (Exception $e) {
        echo "      Error creando categoría '$name': " . $e->getMessage() . "\n";
        return 0;
    }
}

function updateCategoryDescription($db, $catId, $description, $dryRun) {
    if (!$catId || !$description) return;
    
    if ($dryRun) {
        echo "      + RESUMEN para CatID $catId: " . substr($description, 0, 50) . "...\n";
        return;
    }
    
    $stmt = $db->prepare("UPDATE guia_local_subcategoria SET descripcion = ? WHERE id = ?");
    $stmt->execute([$description, $catId]);
    echo "      + Resumen actualizado para CatID $catId\n";
}

function saveItem($db, $accId, $name, $desc, $catId, $dryRun, $order) {
    if (!$name || !$catId) return;
    $name = trim(preg_replace('/\s+/', ' ', $name));
    
    if ($dryRun) {
        echo "      + ITEM: $name (CatID: $catId)\n";
        return;
    }
    
    // Verificar duplicado
    $stmt = $db->prepare("SELECT id FROM guia_local WHERE id_alojamiento = ? AND nombre = ? AND id_subcategoria = ?");
    $stmt->execute([$accId, $name, $catId]);
    if ($stmt->fetch()) {
        // Podríamos actualizar la descripción si ya existe
        $stmt = $db->prepare("UPDATE guia_local SET descripcion = ?, orden = ? WHERE id_alojamiento = ? AND nombre = ? AND id_subcategoria = ?");
        $stmt->execute([$desc, $order, $accId, $name, $catId]);
        echo "      . Item actualizado: $name\n";
        return;
    }
    
    $stmt = $db->prepare("INSERT INTO guia_local (id_alojamiento, id_subcategoria, nombre, descripcion, orden) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$accId, $catId, $name, $desc, $order]);
    echo "      + Insertado: $name\n";
}

function formatLine($line) {
    // Formatear enlaces y teléfonos
    if (preg_match('/(Teléfono|Telf|Móvil)[:\.]?\s*(.+)/i', $line, $matches) || (preg_match('/^\+?[\d\s\-\.]{7,}$/', $line) && !strpos($line, 'http'))) {
         $rawPhone = $matches[2] ?? $line;
         $cleanPhone = preg_replace('/[^\d\+]/', '', $rawPhone);
         $formattedPhone = '<a href="tel:' . $cleanPhone . '">' . trim($rawPhone) . '</a>';
         $prefix = isset($matches[1]) ? $matches[1] . ': ' : '';
         return $prefix . $formattedPhone;
    }
    if (preg_match('/(https?:\/\/[^\s]+)/', $line, $matches)) {
         $url = $matches[1];
         $linkText = 'Ver enlace';
         if (strpos($url, 'maps') !== false) $linkText = 'Ver en Google Maps';
         elseif (strpos($url, 'instagram') !== false) $linkText = 'Instagram';
         elseif (strpos($url, 'facebook') !== false) $linkText = 'Facebook';
         
         $linkHtml = '<a href="' . $url . '" target="_blank">' . $linkText . '</a>';
         return str_replace($url, $linkHtml, $line);
    }
    return $line;
}
