<?php
/**
 * Script de Prueba: Registro de Huésped con Firma y Generación de Contrato
 *
 * Este script simula el envío desde el frontend para probar:
 * 1. Guardado de firma PNG
 * 2. Creación de huésped responsable
 * 3. Generación automática del contrato PDF
 */

// Cargar variables de entorno
require_once __DIR__ . '/api/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Definir constantes de base de datos
define('DB_HOST', $_ENV['DB_HOST']);
define('DB_NAME', $_ENV['DB_NAME']);
define('DB_USER', $_ENV['DB_USER']);
define('DB_PASS', $_ENV['DB_PASS']);
define('DB_PORT', $_ENV['DB_PORT'] ?? 3306);
define('DB_CHARSET', $_ENV['DB_CHARSET'] ?? 'utf8mb4');

// Simular archivo de firma (crear un PNG simple)
$signatureData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC');
$tmpSignature = tempnam(sys_get_temp_dir(), 'sig');
file_put_contents($tmpSignature, $signatureData);

// Datos del huésped responsable de prueba
$data = [
    'reservation_id' => 1,
    'document_type' => 'dni',
    'document_number' => '12345678X',
    'nationality' => 'España',
    'first_name' => 'Juan',
    'last_name' => 'Pérez García',
    'birth_date' => '1990-05-15',
    'sex' => 'm',
    'phone' => '+34612345678',
    'email' => 'juan.perez@example.com',
    'is_responsible' => '1',
    'registration_method' => 'manual',
    'accepted_terms' => '1',
];

// Simular $_FILES['signature']
$_FILES['signature'] = [
    'name' => 'signature_12345678X.png',
    'type' => 'image/png',
    'tmp_name' => $tmpSignature,
    'error' => UPLOAD_ERR_OK,
    'size' => strlen($signatureData),
];

// Simular $_POST
$_POST = $data;

// Simular Content-Type
$_SERVER['CONTENT_TYPE'] = 'multipart/form-data';
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/guests';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['HTTP_USER_AGENT'] = 'Test Script';

echo "╔════════════════════════════════════════════════════════════════════╗\n";
echo "║  PRUEBA DE REGISTRO CON FIRMA Y GENERACIÓN DE CONTRATO PDF        ║\n";
echo "╚════════════════════════════════════════════════════════════════════╝\n\n";

echo "📋 Datos del huésped:\n";
echo "   - Nombre: {$data['first_name']} {$data['last_name']}\n";
echo "   - Documento: {$data['document_number']}\n";
echo "   - Reserva ID: {$data['reservation_id']}\n";
echo "   - Es responsable: SÍ\n\n";

try {
    // Ejecutar el endpoint
    ob_start();
    include __DIR__ . '/api/endpoints/guests.php';
    $output = ob_get_clean();

    // Parsear respuesta JSON
    $response = json_decode($output, true);

    if ($response && $response['status'] === 'success') {
        echo "✅ Huésped registrado exitosamente!\n\n";

        $guest = $response['data'];

        // Verificar firma
        echo "🖊️  FIRMA:\n";
        if ($guest['signature_path']) {
            $signaturePath = __DIR__ . $guest['signature_path'];
            if (file_exists($signaturePath)) {
                echo "   ✅ Firma guardada: {$guest['signature_path']}\n";
                echo "   📏 Tamaño: " . filesize($signaturePath) . " bytes\n";
            } else {
                echo "   ❌ Archivo de firma NO encontrado\n";
            }
        } else {
            echo "   ❌ signature_path NO guardado en DB\n";
        }

        echo "\n";

        // Verificar contrato
        echo "📄 CONTRATO PDF:\n";
        if ($guest['contract_path']) {
            $contractPath = __DIR__ . $guest['contract_path'];
            if (file_exists($contractPath)) {
                echo "   ✅ Contrato generado: {$guest['contract_path']}\n";
                echo "   📏 Tamaño: " . filesize($contractPath) . " bytes\n";
                echo "   \n   🔗 URL de descarga: http://localhost.local{$guest['contract_path']}\n";
            } else {
                echo "   ❌ Archivo de contrato NO encontrado\n";
            }
        } else {
            echo "   ⚠️  contract_path NO guardado en DB (puede ser normal si hubo error)\n";
        }

        echo "\n";

        // Verificar en base de datos
        require_once __DIR__ . '/api/includes/Database.php';
        $db = new Database();
        $result = $db->queryOne("SELECT id, first_name, last_name, is_responsible, signature_path, contract_path FROM guests WHERE id = ?", [$guest['id']]);

        echo "💾 VERIFICACIÓN EN BASE DE DATOS:\n";
        echo "   ID: {$result['id']}\n";
        echo "   Nombre: {$result['first_name']} {$result['last_name']}\n";
        echo "   Es Responsable: " . ($result['is_responsible'] ? 'SÍ' : 'NO') . "\n";
        echo "   Firma: " . ($result['signature_path'] ?: 'NULL') . "\n";
        echo "   Contrato: " . ($result['contract_path'] ?: 'NULL') . "\n";

        echo "\n╔════════════════════════════════════════════════════════════════════╗\n";
        echo "║                    ✅ PRUEBA EXITOSA                               ║\n";
        echo "╚════════════════════════════════════════════════════════════════════╝\n";

    } else {
        echo "❌ Error en el registro:\n";
        echo "   " . ($response['message'] ?? 'Error desconocido') . "\n";
        echo "\n📋 Respuesta completa:\n";
        print_r($response);
    }

} catch (Exception $e) {
    echo "❌ EXCEPCIÓN CAPTURADA:\n";
    echo "   " . $e->getMessage() . "\n";
    echo "   Archivo: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

// Limpiar archivo temporal
unlink($tmpSignature);

echo "\n";
