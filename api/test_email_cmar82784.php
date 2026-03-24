<?php
require_once 'config/database.php';
require_once 'includes/Database.php';
require_once 'models/Reservation.php';
require_once 'models/Viajero.php';
require_once 'models/Preference.php';
require_once 'models/Cliente.php';
require_once 'services/EmailService.php';

$database = new Database();
$db = $database->getConnection();

$reservationModel = new Reservation($database);
$viajeroModel = new Viajero($database);
$preferenceModel = new Preference($database);
$clienteModel = new Cliente($database);
$emailService = new EmailService($database);

$reservation = $reservationModel->getByCode('CMAR82784');
$reservation_id = $reservation['id'];

echo "=====================================================\n";
echo "  TEST: ENVÍO DE EMAILS - RESERVA CMAR82784\n";
echo "=====================================================\n\n";

echo "=== RESERVA ===\n";
echo "ID: {$reservation['id']}\n";
echo "Código: {$reservation['reservation_code']}\n";
echo "Alojamiento: {$reservation['accommodation_name']}\n";
echo "Huéspedes: {$reservation['total_guests']}\n";
echo "Owner: " . ($reservation['owner_email'] ?? 'N/A') . "\n";
echo "Host: " . ($reservation['host_email'] ?? 'N/A') . "\n";
echo "Cliente: " . ($clienteModel->getById($reservation['cliente_id'])['email'] ?? 'N/A') . "\n\n";

echo "=== TEST 1: Registro de huésped (NO responsable) ===\n";

$preferenceModel->upsert($reservation_id, [
    'double_beds' => 2,
    'single_beds' => 0,
    'sofa_beds' => 0,
    'needs_crib' => false,
    'pets' => false
]);

$preferences = $preferenceModel->getByReservation($reservation_id);
$totalBeds = ($preferences['double_beds'] ?? 0) + ($preferences['single_beds'] ?? 0) + ($preferences['sofa_beds'] ?? 0);
$excess = $totalBeds > $reservation['total_guests'] ? [
    'requested' => $totalBeds,
    'guests' => $reservation['total_guests'],
    'difference' => $totalBeds - $reservation['total_guests'],
    'double_beds' => $preferences['double_beds'],
    'single_beds' => $preferences['single_beds'],
    'sofa_beds' => $preferences['sofa_beds']
] : null;

$guest = [
    'reservation_id' => $reservation_id,
    'document_type' => 'PAS',
    'document_number' => 'TEST' . time() . 'A',
    'support_number' => '01',
    'nationality' => 'ES',
    'first_name' => 'Juan',
    'last_name' => 'Prueba',
    'birth_date' => '1985-05-15',
    'sex' => 'm',
    'residence_country' => 'ES',
    'residence_address' => 'Calle Test 123',
    'phone_country_code' => '+34',
    'phone' => '600111222',
    'email' => 'juan.prueba@test.com',
    'is_responsible' => false,
    'registration_method' => 'manual',
    'accepted_terms' => true
];

$viajero_id = $viajeroModel->create($guest);
$guest_data = $viajeroModel->getById($viajero_id);

echo "Huésped ID: $viajero_id - {$guest['first_name']} {$guest['last_name']} (NO responsable)\n";
echo "Camas: $totalBeds, Huéspedes: {$reservation['total_guests']}\n";
echo "Excedencia: " . ($excess ? "SÍ (+{$excess['difference']})" : "NO") . "\n";

$result1 = $emailService->sendGuestRegisteredNotification($reservation, $guest_data, false, $excess);
echo "Email a host/owner/super-host: " . ($result1 ? "✓ ENVIADO" : "✗ ERROR") . "\n\n";

echo "=== TEST 2: Registro de huésped (RESPONSABLE) ===\n";

$preferenceModel->upsert($reservation_id, [
    'double_beds' => 3,
    'single_beds' => 1,
    'sofa_beds' => 0,
    'needs_crib' => false,
    'pets' => false
]);

$preferences = $preferenceModel->getByReservation($reservation_id);
$totalBeds = ($preferences['double_beds'] ?? 0) + ($preferences['single_beds'] ?? 0) + ($preferences['sofa_beds'] ?? 0);
$excess = $totalBeds > $reservation['total_guests'] ? [
    'requested' => $totalBeds,
    'guests' => $reservation['total_guests'],
    'difference' => $totalBeds - $reservation['total_guests'],
    'double_beds' => $preferences['double_beds'],
    'single_beds' => $preferences['single_beds'],
    'sofa_beds' => $preferences['sofa_beds']
] : null;

$guest2 = [
    'reservation_id' => $reservation_id,
    'document_type' => 'PAS',
    'document_number' => 'TEST' . time() . 'B',
    'support_number' => '02',
    'nationality' => 'ES',
    'first_name' => 'María',
    'last_name' => 'Prueba',
    'birth_date' => '1990-01-01',
    'sex' => 'f',
    'residence_country' => 'ES',
    'residence_address' => 'Calle Test 456',
    'phone_country_code' => '+34',
    'phone' => '600333444',
    'email' => 'maria.prueba@test.com',
    'is_responsible' => true,
    'registration_method' => 'manual',
    'accepted_terms' => true
];

$viajero_id2 = $viajeroModel->create($guest2);
$guest_data2 = $viajeroModel->getById($viajero_id2);

echo "Huésped ID: $viajero_id2 - {$guest2['first_name']} {$guest2['last_name']} (RESPONSABLE)\n";
echo "Camas: $totalBeds, Huéspedes: {$reservation['total_guests']}\n";
echo "Excedencia: " . ($excess ? "SÍ (+{$excess['difference']})" : "NO") . "\n";

$result2 = $emailService->sendGuestRegisteredNotification($reservation, $guest_data2, true, $excess);
echo "Email a host/owner/super-host: " . ($result2 ? "✓ ENVIADO" : "✗ ERROR") . "\n";

$cliente = $clienteModel->getById($reservation['cliente_id']);
if ($cliente && !empty($cliente['email'])) {
    $result3 = $emailService->sendResponsibleWithContract($reservation, $guest_data2, $cliente['email']);
    echo "Email al cliente ({$cliente['email']}): " . ($result3 ? "✓ ENVIADO" : "✗ ERROR") . "\n";
}

echo "\n=====================================================\n";
echo "  RESUMEN\n";
echo "=====================================================\n";
echo "Test 1 (NO responsable): " . ($result1 ? "✓ PASS" : "✗ FAIL") . "\n";
echo "Test 2 (RESPONSABLE - host): " . ($result2 ? "✓ PASS" : "✗ FAIL") . "\n";
echo "Test 2 (RESPONSABLE - cliente): " . (isset($result3) && $result3 ? "✓ PASS" : "✗ FAIL") . "\n\n";

echo "Revisa los logs de Apache:\n";
echo "  tail -f /var/log/apache2/error.log | grep EmailService\n";
