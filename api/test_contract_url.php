<?php
require_once 'config/database.php';
require_once 'includes/Database.php';
require_once 'models/Reservation.php';
require_once 'services/EmailService.php';

$database = new Database();
$db = $database->getConnection();
$emailService = new EmailService($database);

echo "=====================================================\n";
echo "  TEST: VERIFICACIÓN DE URL DEL CONTRATO\n";
echo "=====================================================\n\n";

// Obtener reserva con contrato
$reservationModel = new Reservation($database);
$reservation = $reservationModel->getById(9605);

echo "=== Datos del contrato ===\n";
echo "contract_path (raw): {$reservation['contract_path']}\n\n";

// Simular construcción del email
$reflection = new ReflectionClass($emailService);
$method = $reflection->getMethod('normalizeContractUrl');
$method->setAccessible(true);

$normalizedUrl = $method->invoke($emailService, $reservation['contract_path']);

echo "=== URL Normalizada ===\n";
echo "URL pública: {$normalizedUrl}\n\n";

// Verificar que es una URL válida
if (strpos($normalizedUrl, 'http://') === 0 || strpos($normalizedUrl, 'https://') === 0) {
    echo "✓ URL válida para enlace en email\n";
} else {
    echo "✗ ERROR: URL no válida\n";
}
