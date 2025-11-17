<?php
/**
 * Endpoint: Escaneo de Documentos con Klippa
 * Rutas:
 * POST   /api/document-scan  - Escanear documento de identidad
 */

require_once __DIR__ . '/../includes/Response.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    // POST /api/document-scan - Escanear documento
    if ($method === 'POST') {
        // Configuración de Klippa
        $apiKey = 'SLEWuIbhYA04NbOTVKFn86jIODBQI4vP';
        $urlJson = 'https://dochorizon.klippa.com/api/services/document_capturing/v1/identity';

        // Verificar que se haya enviado un archivo
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error("No se recibió ningún archivo o hubo un error en la carga", 400);
        }

        $file = $_FILES['file']['tmp_name'];

        if (!$file || !file_exists($file)) {
            Response::error("Archivo no encontrado o no se pudo leer", 400);
        }

        // Codificar imagen en base64
        $imageData = base64_encode(file_get_contents($file));

        // Preparar payload para Klippa
        $data = [
            "documents" => [
                ["data" => $imageData]
            ]
        ];

        // Headers para la API de Klippa
        $headers = [
            'x-api-key: ' . $apiKey,
            'Content-Type: application/json'
        ];

        // Realizar petición a Klippa
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $urlJson);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        // Log para debugging
        error_log("=== KLIPPA SCAN DEBUG ===");
        error_log("Status: " . $status);
        error_log("Response: " . substr($response, 0, 500)); // Primeros 500 caracteres

        if ($curlError) {
            error_log("CURL Error: " . $curlError);
            Response::error("Error de conexión con Klippa: " . $curlError, 500);
        }

        if ($status !== 200) {
            $errorDetails = json_decode($response, true);
            error_log("Klippa Error: " . json_encode($errorDetails));
            Response::error("Error en la solicitud a la API de Klippa", $status, $errorDetails);
        }

        // Procesar respuesta de Klippa
        $responseData = json_decode($response, true);

        if (!$responseData) {
            error_log("Error: No se pudo decodificar JSON de Klippa");
            Response::error("Error decodificando respuesta de Klippa", 500);
        }

        // Log de la estructura de la respuesta
        error_log("Estructura de respuesta: " . json_encode(array_keys($responseData)));
        if (isset($responseData['data'])) {
            error_log("Campos en data: " . json_encode(array_keys($responseData['data'])));
        }

        // Extraer datos del documento
        $extractedData = extractDocumentData($responseData);
        error_log("Datos extraídos: " . json_encode($extractedData));

        // Añadir la imagen codificada a la respuesta
        $extractedData['image'] = $imageData;

        Response::success($extractedData, "Documento escaneado exitosamente");
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}

/**
 * Extraer datos estructurados del response de Klippa
 */
function extractDocumentData($response) {
    $data = [
        'first_name' => '',
        'last_name' => '',
        'second_last_name' => '',
        'document_number' => '',
        'birth_date' => '',
        'sex' => '',
        'nationality' => '',
        'document_type' => '',
        'issue_date' => '',
        'expiry_date' => '',
        'support_number' => ''
    ];

    if (!isset($response['data']['components']['text_fields'])) {
        return $data;
    }

    $textFields = $response['data']['components']['text_fields'];

    // Nombres
    if (isset($textFields['given_names'])) {
        $data['first_name'] = $textFields['given_names'];
    }

    // Apellidos
    if (isset($textFields['surname'])) {
        $apellidos = explode(' ', $textFields['surname']);
        $data['last_name'] = $apellidos[0] ?? '';
        $data['second_last_name'] = $apellidos[1] ?? '';
    }

    // Fecha de nacimiento (convertir de DD.MM.YYYY a YYYY-MM-DD)
    if (isset($textFields['date_of_birth'])) {
        $data['birth_date'] = convertDate($textFields['date_of_birth']);
    }

    // Fecha de expedición
    if (isset($textFields['date_of_issue'])) {
        $data['issue_date'] = convertDate($textFields['date_of_issue']);
    }

    // Fecha de vencimiento
    if (isset($textFields['date_of_expiry'])) {
        $data['expiry_date'] = convertDate($textFields['date_of_expiry']);
    }

    // Nacionalidad
    if (isset($textFields['nationality'])) {
        $data['nationality'] = $textFields['nationality'];
    }

    // Tipo de documento
    if (isset($textFields['place_of_birth']) && $textFields['place_of_birth'] == "RESIDENCIA") {
        $data['document_type'] = 'NIE';
    }

    if (isset($textFields['document_type'])) {
        if ($textFields['document_type'] == 'I') {
            $data['document_type'] = 'DNI';
        } elseif ($textFields['document_type'] == 'P') {
            $data['document_type'] = 'PASSPORT';
        } else {
            $data['document_type'] = $textFields['document_type'];
        }
    }

    // Número de documento y soporte (lógica diferente según tipo)
    if ($data['document_type'] == 'DNI' || $data['document_type'] == 'NIE') {
        // Para DNI/NIE: document_number es el soporte, personal_number contiene el DNI
        if (isset($textFields['document_number'])) {
            $data['support_number'] = $textFields['document_number'];
        }

        if (isset($textFields['personal_number'])) {
            // Extraer número después de "DNI"
            if (preg_match('/^DNI(.+)$/', $textFields['personal_number'], $match)) {
                $data['document_number'] = $match[1];
            } else {
                $data['document_number'] = $textFields['personal_number'];
            }
        }
    } else {
        // Para pasaportes u otros: document_number es el número del documento
        if (isset($textFields['document_number'])) {
            $data['document_number'] = $textFields['document_number'];
        }

        if (isset($textFields['personal_number'])) {
            $data['support_number'] = $textFields['personal_number'];
        }
    }

    // Sexo
    if (isset($textFields['gender'])) {
        // Convertir a formato esperado (M/F -> m/f)
        $data['sex'] = strtolower($textFields['gender']);
    }

    return $data;
}

/**
 * Convertir fecha de formato DD.MM.YYYY a YYYY-MM-DD
 */
function convertDate($dateString) {
    if (empty($dateString)) return '';

    $parts = explode('.', $dateString);
    if (count($parts) === 3) {
        return $parts[2] . '-' . $parts[1] . '-' . $parts[0];
    }

    return $dateString;
}
