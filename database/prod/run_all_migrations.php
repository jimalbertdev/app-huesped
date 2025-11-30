<?php
/**
 * Script maestro para ejecutar todas las migraciones de producción
 * 
 * Uso: php run_all_migrations.php [--dry-run]
 */

// Verificar si es dry-run
$dryRun = in_array('--dry-run', $argv);

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║     MIGRACIONES DE PRODUCCIÓN - APP HUÉSPED               ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

if ($dryRun) {
    echo "⚠️  MODO DRY-RUN: No se realizarán cambios en la base de datos\n\n";
}

// Verificar que estamos en el directorio correcto
$currentDir = __DIR__;
$expectedPath = 'database/prod';

if (strpos($currentDir, $expectedPath) === false) {
    echo "❌ ERROR: Este script debe ejecutarse desde el directorio database/prod\n";
    echo "   Directorio actual: $currentDir\n";
    exit(1);
}

// Verificar que existe el archivo .env
$envFile = dirname(dirname(__DIR__)) . '/.env';
if (!file_exists($envFile)) {
    echo "❌ ERROR: No se encontró el archivo .env\n";
    echo "   Ruta esperada: $envFile\n";
    echo "   Por favor, configura el archivo .env con las credenciales de la base de datos\n";
    exit(1);
}

echo "✓ Archivo .env encontrado\n";
echo "✓ Directorio correcto\n\n";

// Lista de migraciones a ejecutar
$migrations = [
    [
        'name' => 'Migración 016: Crear vistas de aplicación',
        'script' => 'run_migration_016.php',
        'required' => true,
        'description' => 'Crea las vistas v_reservations_full, v_reservations_with_host, v_guests_with_reservation'
    ],
    [
        'name' => 'Migración de guía local: Separar registros concatenados',
        'script' => 'run_local_guide_migration.php',
        'required' => false,
        'description' => 'Separa registros HTML concatenados en informacion_turistica_alojamiento'
    ],
    [
        'name' => 'Migración de videos: Convertir enlaces a embeds',
        'script' => 'run_video_migration.php',
        'required' => false,
        'description' => 'Convierte enlaces de YouTube y Google Drive a iframes embebidos'
    ]
];

echo "════════════════════════════════════════════════════════════\n";
echo "PLAN DE EJECUCIÓN\n";
echo "════════════════════════════════════════════════════════════\n\n";

foreach ($migrations as $index => $migration) {
    $num = $index + 1;
    $required = $migration['required'] ? '[OBLIGATORIO]' : '[OPCIONAL]';
    echo "$num. {$migration['name']} $required\n";
    echo "   {$migration['description']}\n";
    echo "   Script: {$migration['script']}\n\n";
}

if ($dryRun) {
    echo "════════════════════════════════════════════════════════════\n";
    echo "DRY-RUN COMPLETADO\n";
    echo "════════════════════════════════════════════════════════════\n";
    echo "Para ejecutar las migraciones reales, ejecuta:\n";
    echo "php run_all_migrations.php\n\n";
    exit(0);
}

// Pedir confirmación al usuario
echo "════════════════════════════════════════════════════════════\n";
echo "⚠️  ADVERTENCIA\n";
echo "════════════════════════════════════════════════════════════\n";
echo "Estás a punto de ejecutar " . count($migrations) . " migraciones.\n";
echo "Se recomienda hacer un backup de la base de datos antes de continuar.\n\n";
echo "¿Deseas continuar? (s/n): ";

$handle = fopen("php://stdin", "r");
$line = fgets($handle);
$confirmation = trim(strtolower($line));
fclose($handle);

if ($confirmation !== 's' && $confirmation !== 'si' && $confirmation !== 'y' && $confirmation !== 'yes') {
    echo "\n❌ Migraciones canceladas por el usuario\n\n";
    exit(0);
}

echo "\n";
echo "════════════════════════════════════════════════════════════\n";
echo "EJECUTANDO MIGRACIONES\n";
echo "════════════════════════════════════════════════════════════\n\n";

$results = [];
$totalSuccess = 0;
$totalFailed = 0;

foreach ($migrations as $index => $migration) {
    $num = $index + 1;
    echo "────────────────────────────────────────────────────────────\n";
    echo "Migración $num de " . count($migrations) . ": {$migration['name']}\n";
    echo "────────────────────────────────────────────────────────────\n\n";

    $scriptPath = __DIR__ . '/' . $migration['script'];
    
    if (!file_exists($scriptPath)) {
        echo "❌ ERROR: Script no encontrado: {$migration['script']}\n\n";
        $results[] = [
            'name' => $migration['name'],
            'success' => false,
            'error' => 'Script no encontrado'
        ];
        $totalFailed++;
        
        if ($migration['required']) {
            echo "❌ Esta migración es obligatoria. Abortando proceso.\n\n";
            break;
        }
        continue;
    }

    // Ejecutar el script
    $output = [];
    $returnCode = 0;
    
    // Construir comando
    $command = "php " . escapeshellarg($scriptPath);
    
    // Ejecutar y capturar salida
    exec($command . " 2>&1", $output, $returnCode);
    
    // Mostrar salida
    echo implode("\n", $output) . "\n\n";
    
    if ($returnCode === 0) {
        echo "✓ Migración completada exitosamente\n\n";
        $results[] = [
            'name' => $migration['name'],
            'success' => true
        ];
        $totalSuccess++;
    } else {
        echo "❌ Migración falló con código de error: $returnCode\n\n";
        $results[] = [
            'name' => $migration['name'],
            'success' => false,
            'error' => "Código de error: $returnCode"
        ];
        $totalFailed++;
        
        if ($migration['required']) {
            echo "❌ Esta migración es obligatoria. Abortando proceso.\n\n";
            break;
        }
    }
}

// Resumen final
echo "\n";
echo "════════════════════════════════════════════════════════════\n";
echo "RESUMEN DE EJECUCIÓN\n";
echo "════════════════════════════════════════════════════════════\n\n";

echo "Total de migraciones: " . count($migrations) . "\n";
echo "Exitosas: $totalSuccess\n";
echo "Fallidas: $totalFailed\n\n";

echo "Detalle:\n";
foreach ($results as $result) {
    $status = $result['success'] ? '✓' : '❌';
    echo "  $status {$result['name']}\n";
    if (!$result['success'] && isset($result['error'])) {
        echo "     Error: {$result['error']}\n";
    }
}

echo "\n";

if ($totalFailed === 0) {
    echo "════════════════════════════════════════════════════════════\n";
    echo "✓ TODAS LAS MIGRACIONES COMPLETADAS EXITOSAMENTE\n";
    echo "════════════════════════════════════════════════════════════\n\n";
    exit(0);
} else {
    echo "════════════════════════════════════════════════════════════\n";
    echo "⚠️  ALGUNAS MIGRACIONES FALLARON\n";
    echo "════════════════════════════════════════════════════════════\n";
    echo "Por favor, revisa los errores arriba y ejecuta las migraciones\n";
    echo "fallidas manualmente si es necesario.\n\n";
    exit(1);
}
