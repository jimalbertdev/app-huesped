<?php
/**
 * Página de Éxito - Duplicación Completada
 * Muestra el resultado de la duplicación
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

$database = new Database();
$db = $database->getConnection();

// Obtener parámetros
$idOriginal = $_GET['id_original'] ?? null;
$idNuevo = $_GET['id_nuevo'] ?? null;
$infoExternaCount = $_GET['info_externa'] ?? 0;
$infoTuristicaCount = $_GET['info_turistica'] ?? 0;
$camasCount = $_GET['camas'] ?? 0;
$hospederiaCount = $_GET['hospederia'] ?? 0;
$caracteristicaCount = $_GET['caracteristica'] ?? 0;

if (!$idOriginal || !$idNuevo) {
    header('Location: index.php');
    exit;
}

// Obtener información de ambos alojamientos
$query = "SELECT idalojamiento, nombre FROM alojamiento WHERE idalojamiento IN (?, ?)";
$stmt = $db->prepare($query);
$stmt->execute([$idOriginal, $idNuevo]);
$alojamientos = $stmt->fetchAll(PDO::FETCH_ASSOC);

$nombreOriginal = '';
$nombreNuevo = '';
foreach ($alojamientos as $aloj) {
    if ($aloj['idalojamiento'] == $idOriginal) {
        $nombreOriginal = $aloj['nombre'];
    } else {
        $nombreNuevo = $aloj['nombre'];
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Duplicación Exitosa</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            max-width: 800px;
            width: 100%;
        }

        .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 50px;
            text-align: center;
        }

        .success-icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: bounce 1s ease;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }

        h1 {
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 36px;
        }

        .subtitle {
            color: #718096;
            margin-bottom: 40px;
            font-size: 18px;
        }

        .result-box {
            background: #f7fafc;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: left;
        }

        .result-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .result-item:last-child {
            border-bottom: none;
        }

        .result-label {
            font-weight: 600;
            color: #4a5568;
        }

        .result-value {
            color: #2d3748;
            font-size: 16px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }

        .stat-number {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
        }

        .btn {
            padding: 14px 28px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: #e2e8f0;
            color: #2d3748;
        }

        .btn-secondary:hover {
            background: #cbd5e0;
        }

        .actions {
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="success-icon">✅</div>
            <h1>¡Duplicación Exitosa!</h1>
            <p class="subtitle">El alojamiento ha sido duplicado correctamente</p>

            <div class="result-box">
                <div class="result-item">
                    <span class="result-label">🏠 Alojamiento Original:</span>
                    <span class="result-value">ID <?= $idOriginal ?> - <?= htmlspecialchars($nombreOriginal) ?></span>
                </div>
                <div class="result-item">
                    <span class="result-label">🆕 Nuevo Alojamiento:</span>
                    <span class="result-value">ID <?= $idNuevo ?> - <?= htmlspecialchars($nombreNuevo) ?></span>
                </div>
            </div>

            <h3 style="color: #2d3748; margin-bottom: 15px;">📊 Registros Duplicados</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number"><?= $infoExternaCount ?></div>
                    <div class="stat-label">Info Externa</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?= $infoTuristicaCount ?></div>
                    <div class="stat-label">Info Turística</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?= $camasCount ?></div>
                    <div class="stat-label">Configuración Camas</div>
                </div>
                <?php if ($hospederiaCount > 0): ?>
                <div class="stat-card">
                    <div class="stat-number"><?= $hospederiaCount ?></div>
                    <div class="stat-label">Hospedería</div>
                </div>
                <?php endif; ?>
                <?php if ($caracteristicaCount > 0): ?>
                <div class="stat-card">
                    <div class="stat-number"><?= $caracteristicaCount ?></div>
                    <div class="stat-label">Características</div>
                </div>
                <?php endif; ?>
            </div>

            <div class="actions">
                <a href="index.php" class="btn btn-primary">Duplicar Otro Alojamiento</a>
                <a href="preview.php?id=<?= $idNuevo ?>" class="btn btn-secondary">Ver Alojamiento Duplicado</a>
            </div>
        </div>
    </div>
</body>
</html>
