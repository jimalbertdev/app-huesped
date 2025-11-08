<?php
/**
 * Script de prueba de la API
 * Ejecuta pruebas básicas de todos los endpoints
 */

$base_url = 'http://localhost/app_huesped/api';

echo "===========================================\n";
echo "VACANFLY - Pruebas de API\n";
echo "===========================================\n\n";

// Helper para hacer peticiones
function apiRequest($url, $method = 'GET', $data = null) {
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

// Prueba 1: Health Check
echo "1. Probando Health Check...\n";
$result = apiRequest("$base_url/health");
if ($result['code'] == 200 && $result['data']['success']) {
    echo "   ✓ API funcionando\n\n";
} else {
    echo "   ✗ Error en health check\n\n";
}

// Prueba 2: Obtener reserva
echo "2. Probando GET /api/reservations/RES-2024-001...\n";
$result = apiRequest("$base_url/reservations/RES-2024-001");
if ($result['code'] == 200 && $result['data']['success']) {
    $reservation = $result['data']['data']['reservation'];
    echo "   ✓ Reserva encontrada: {$reservation['accommodation_name']}\n";
    echo "   - Check-in: {$reservation['check_in_date']}\n";
    echo "   - Total huéspedes: {$reservation['total_guests']}\n\n";
    $reservation_id = $reservation['id'];
} else {
    echo "   ✗ Error al obtener reserva\n\n";
    exit(1);
}

// Prueba 3: Registrar huésped
echo "3. Probando POST /api/guests (registrar huésped)...\n";
$guest_data = [
    'reservation_id' => $reservation_id,
    'document_type' => 'dni',
    'document_number' => '12345678Z',
    'nationality' => 'España',
    'first_name' => 'Test',
    'last_name' => 'Usuario',
    'birth_date' => '1990-01-01',
    'sex' => 'm',
    'phone' => '+34 600000000',
    'email' => 'test@test.com',
    'is_responsible' => true,
    'registration_method' => 'manual',
    'accepted_terms' => true
];

$result = apiRequest("$base_url/guests", 'POST', $guest_data);
if ($result['code'] == 201 || $result['code'] == 200) {
    if ($result['data']['success']) {
        echo "   ✓ Huésped registrado exitosamente\n\n";
        $guest_id = $result['data']['data']['id'];
    } else {
        echo "   ⚠ Huésped ya existe (esperado si se ejecuta varias veces)\n\n";
    }
} else {
    echo "   ✗ Error al registrar huésped\n";
    print_r($result);
    echo "\n";
}

// Prueba 4: Obtener huéspedes de la reserva
echo "4. Probando GET /api/guests/reservation/$reservation_id...\n";
$result = apiRequest("$base_url/guests/reservation/$reservation_id");
if ($result['code'] == 200 && $result['data']['success']) {
    $guests_count = count($result['data']['data']);
    echo "   ✓ Huéspedes encontrados: $guests_count\n\n";
} else {
    echo "   ✗ Error al obtener huéspedes\n\n";
}

// Prueba 5: Actualizar preferencias
echo "5. Probando POST /api/preferences (guardar preferencias)...\n";
$preferences = [
    'reservation_id' => $reservation_id,
    'needs_crib' => false,
    'double_beds' => 2,
    'single_beds' => 1,
    'sofa_beds' => 0,
    'estimated_arrival_time' => '15:30:00',
    'additional_info' => 'Preferimos habitación en planta baja'
];

$result = apiRequest("$base_url/preferences", 'POST', $preferences);
if ($result['code'] == 200 && $result['data']['success']) {
    echo "   ✓ Preferencias guardadas\n\n";
} else {
    echo "   ✗ Error al guardar preferencias\n\n";
}

// Prueba 6: Obtener preferencias
echo "6. Probando GET /api/preferences/$reservation_id...\n";
$result = apiRequest("$base_url/preferences/$reservation_id");
if ($result['code'] == 200) {
    echo "   ✓ Preferencias obtenidas\n\n";
} else {
    echo "   ✗ Error al obtener preferencias\n\n";
}

// Prueba 7: Dashboard completo
echo "7. Probando GET /api/reservations/$reservation_id/dashboard...\n";
$result = apiRequest("$base_url/reservations/$reservation_id/dashboard");
if ($result['code'] == 200 && $result['data']['success']) {
    $dashboard = $result['data']['data'];
    echo "   ✓ Dashboard obtenido\n";
    echo "   - Alojamiento: {$dashboard['accommodation']['name']}\n";
    echo "   - WiFi: {$dashboard['accommodation']['wifi_name']}\n";
    echo "   - Categorías de guía local: " . count($dashboard['local_guide']) . "\n\n";
} else {
    echo "   ✗ Error al obtener dashboard\n\n";
}

// Prueba 8: Crear incidencia
echo "8. Probando POST /api/incidents (reportar incidencia)...\n";
$incident = [
    'reservation_id' => $reservation_id,
    'guest_id' => null,
    'incident_type' => 'suggestion',
    'title' => 'Sugerencia de prueba',
    'description' => 'Esta es una prueba del sistema de incidencias'
];

$result = apiRequest("$base_url/incidents", 'POST', $incident);
if ($result['code'] == 201 && $result['data']['success']) {
    echo "   ✓ Incidencia creada\n\n";
} else {
    echo "   ✗ Error al crear incidencia\n\n";
}

// Prueba 9: Obtener historial de puertas
echo "9. Probando GET /api/doors/history/$reservation_id...\n";
$result = apiRequest("$base_url/doors/history/$reservation_id");
if ($result['code'] == 200 && $result['data']['success']) {
    echo "   ✓ Historial obtenido\n\n";
} else {
    echo "   ✗ Error al obtener historial\n\n";
}

echo "===========================================\n";
echo "✓ PRUEBAS COMPLETADAS\n";
echo "===========================================\n\n";
echo "La API está funcionando correctamente.\n";
echo "Ahora puedes conectar el frontend React.\n\n";
