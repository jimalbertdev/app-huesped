<?php
/**
 * Script de migración AI: Importar Guía Local desde PDFs usando Gemini
 * 
 * Uso: php database/import_pdf_ai.php [dry-run]
 * 
 * Requiere:
 * - GEMINI_API_KEY en archivo .env
 * - pdftotext instalado
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

// Cargar variables de entorno si no están cargadas (aunque config/database.php ya lo hace)
if (!isset($_ENV['GEMINI_API_KEY'])) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
}

$apiKey = $_ENV['GEMINI_API_KEY'] ?? null;

if (!$apiKey) {
    die("ERROR: No se encontró la variable GEMINI_API_KEY en el archivo .env\n");
}

// Configuración
$docDir = __DIR__ . '/docs/guia_local';
$isCli = (php_sapi_name() === 'cli');
$args = $isCli ? $argv : [];
$dryRun = in_array('dry-run', $args) || (isset($_GET['dry-run']) && $_GET['dry-run'] == '1');

echo "=== MIGRACIÓN GUÍA LOCAL CON GEMINI AI ===\n";
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
    $globalOrder = 0;
    
    foreach ($files as $file) {
        $filename = basename($file);
        $accommodationId = (int) pathinfo($filename, PATHINFO_FILENAME);
        
        echo ">>> Procesando: $filename (ID Alojamiento: $accommodationId)...\n";
        
        // 1. Extraer texto
        $text = shell_exec("pdftotext " . escapeshellarg($file) . " -");
        if (!$text || strlen(trim($text)) < 50) {
            echo "    Error: No se pudo extraer texto suficiente o archivo vacío.\n";
            continue;
        }
        
        // 2. Consultar a Gemini
        echo "    Enviando a Gemini... ";
        $data = analyzeWithGemini($apiKey, $text);
        //var_dump($data);
        if (!$data) {
            echo "Error en la respuesta de la IA.\n";
            // continue; // Let the loop continue to debug other files if any
        }
        else {
             echo "OK (" . count($data) . " categorías raíz)\n";
        }
        
        // 3. Guardar datos
        foreach ($data as $cat) {
            // Categoría Padre
            $parentName = trim($cat['category'] ?? '');
            if (!$parentName) continue;
            
            $parentId = findOrCreateCategory($db, $parentName, null, $categoryCache, $globalOrder, $dryRun);
            echo "    [PADRE] $parentName\n";
            
            // Subcategorías
            if (!empty($cat['subcategories'])) {
                foreach ($cat['subcategories'] as $sub) {
                    $subName = trim($sub['name'] ?? '');
                    if (!$subName) continue;
                    
                    $subDesc = trim($sub['summary'] ?? '');
                    
                    $subId = findOrCreateCategory($db, $subName, $parentId, $categoryCache, $globalOrder, $dryRun);
                    
                    // Actualizar descripción si existe
                    if ($subDesc) {
                         updateCategoryDescription($db, $subId, $subDesc, $dryRun);
                    }
                    
                    echo "      [SUB] $subName\n";
                    
                    // Items
                    if (!empty($sub['items'])) {
                        $itemOrder = 0;
                        foreach ($sub['items'] as $item) {
                            $itemName = trim($item['name'] ?? '');
                            if (!$itemName) continue;
                            
                            $itemDesc = trim($item['description'] ?? '');
                            // Formatear enlaces en la descripción si vienen planos
                            $itemDesc = formatLine($itemDesc);
                            
                            $itemOrder++;
                            saveItem($db, $accommodationId, $itemName, $itemDesc, $subId, $dryRun, $itemOrder);
                        }
                    }
                }
            }
        }
    }
    
    echo "\n=== MIGRACIÓN COMPLETADA ===\n";
    
} catch (Exception $e) {
    echo "\nERROR FATAL: " . $e->getMessage() . "\n";
}

// --- FUNCIONES ---

function analyzeWithGemini($apiKey, $text) {
    // Use gemini-flash-latest (Usually 1.5 Flash, more stable free tier)
    // If this fails, try 'gemini-pro'
    $modelName = 'gemini-flash-latest';
    $url = "https://generativelanguage.googleapis.com/v1beta/models/$modelName:generateContent?key=" . $apiKey;
    
    // URL already set above
    
    $prompt = "Analiza el siguiente texto de una guía turística y extrae la información estructurada en formato JSON estrictamente.
    
    ESTRUCTURA JSON ESPERADA:
    [
      {
        \"category\": \"Nombre Categoria Principal (ej: RESTAURANTES)\",
        \"subcategories\": [
          {
            \"name\": \"Nombre Subcategoria (ej: Pizzerías)\",
            \"summary\": \"Resumen o descripción de la subcategoría si existe\",
            \"items\": [
              {
                \"name\": \"Nombre del Lugar\",
                \"description\": \"Descripción completa incluyendo dirección, teléfono y enlaces\"
              }
            ]
          }
        ]
      }
    ]
    
    TEXTO A ANALIZAR:
    " . substr($text, 0, 10000); // Limitar caracteres por seguridad

    $body = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ],
        "generationConfig" => [
            "responseMimeType" => "application/json"
        ]
    ];
    
    $maxRetries = 5;
    $attempt = 0;
    
    do {
        $attempt++;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        
        $response = curl_exec($ch);
        
        if (curl_errno($ch)) {
            echo "CURL Error: " . curl_error($ch) . "\n";
            return null;
        }
        curl_close($ch);
        
        $json = json_decode($response, true);
        
        if (isset($json['error'])) {
            $errorCode = $json['error']['code'] ?? 0;
            $errorMsg = $json['error']['message'] ?? '';
            
            if ($errorCode == 429) {
                echo "    ! Rate Limit Exceeded (Attempt $attempt/$maxRetries). Waiting 30s...\n";
                sleep(30);
                continue;
            } else {
                echo "API Error Code: $errorCode\n";
                echo "API Error Message: $errorMsg\n";
                return null;
            }
        }
        
        // Success
        break;
        
    } while ($attempt < $maxRetries);
    
    if (!isset($json['candidates'])) {
        echo "    ! Failed after $maxRetries attempts or non-retriable error.\n";
        return null;
    }
    
    // Extraer el texto generado
    if (isset($json['candidates'][0]['content']['parts'][0]['text'])) {
        $responseText = $json['candidates'][0]['content']['parts'][0]['text'];
        // Limpiar bloques de código markdown si existen
        $responseText = str_replace(['```json', '```'], '', $responseText);
        return json_decode($responseText, true);
    }
    
    return null;
}

function normalizeName($name) {
    return trim(mb_strtoupper($name));
}

function findOrCreateCategory($db, $name, $parentId, &$cache, &$order, $dryRun) {
    $name = trim($name);
    $key = normalizeName($name) . '_' . ($parentId ?: 'ROOT');
    
    if (isset($cache[$key])) return $cache[$key];
    if ($dryRun) return 999;
    
    // Verificar en BD
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
        return 0;
    }
}

function updateCategoryDescription($db, $catId, $description, $dryRun) {
    if (!$catId || !$description) return;
    if ($dryRun) {
        echo "      + RESUMEN: " . substr($description, 0, 30) . "...\n";
        return;
    }
    $stmt = $db->prepare("UPDATE guia_local_subcategoria SET descripcion = ? WHERE id = ?");
    $stmt->execute([$description, $catId]);
}

function saveItem($db, $accId, $name, $desc, $catId, $dryRun, $order) {
    if (!$name || !$catId) return;
    $name = trim(preg_replace('/\s+/', ' ', $name));
    
    if ($dryRun) {
        echo "      + ITEM: $name\n";
        return;
    }
    
    // Verificar duplicado
    $stmt = $db->prepare("SELECT id FROM guia_local WHERE id_alojamiento = ? AND nombre = ? AND id_subcategoria = ?");
    $stmt->execute([$accId, $name, $catId]);
    if ($stmt->fetch()) {
        // Actualizar
        $stmt = $db->prepare("UPDATE guia_local SET descripcion = ?, orden = ? WHERE id_alojamiento = ? AND nombre = ? AND id_subcategoria = ?");
        $stmt->execute([$desc, $order, $accId, $name, $catId]);
        return;
    }
    
    $stmt = $db->prepare("INSERT INTO guia_local (id_alojamiento, id_subcategoria, nombre, descripcion, orden) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$accId, $catId, $name, $desc, $order]);
}

function formatLine($line) {
    // Reutilizar lógica de formateo de enlaces básica
    if (preg_match('/(https?:\/\/[^\s]+)/', $line, $matches)) {
         $url = $matches[1];
         $linkHtml = '<a href="' . $url . '" target="_blank">Ver enlace</a>';
         $line = str_replace($url, $linkHtml, $line);
    }
    return nl2br($line);
}
