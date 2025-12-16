<?php
/**
 * Vista Previa del Alojamiento a Duplicar
 * Muestra toda la información antes de confirmar la duplicación
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

session_start();

$database = new Database();
$db = $database->getConnection();

// Obtener ID del alojamiento
$id = $_GET['id'] ?? null;

if (!$id || !is_numeric($id)) {
    $_SESSION['message'] = 'ID de alojamiento inválido';
    $_SESSION['message_type'] = 'error';
    header('Location: index.php');
    exit;
}

// Obtener información del alojamiento
$query = "SELECT * FROM alojamiento WHERE idalojamiento = ?";
$stmt = $db->prepare($query);
$stmt->execute([$id]);
$alojamiento = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$alojamiento) {
    $_SESSION['message'] = 'Alojamiento no encontrado';
    $_SESSION['message_type'] = 'error';
    header('Location: index.php');
    exit;
}

// Obtener información externa
$query = "SELECT * FROM informacion_externa_alojamiento WHERE id_alojamiento = ? ORDER BY categoria, orden";
$stmt = $db->prepare($query);
$stmt->execute([$id]);
$info_externa = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Obtener información turística
$query = "SELECT * FROM informacion_turistica_alojamiento WHERE id_alojamiento = ?";
$stmt = $db->prepare($query);
$stmt->execute([$id]);
$info_turistica = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Obtener camas
$query = "SELECT * FROM camas_alojamiento WHERE id_alojamiento = ?";
$stmt = $db->prepare($query);
$stmt->execute([$id]);
$camas = $stmt->fetch(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vista Previa - Duplicar Alojamiento</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            margin-bottom: 20px;
        }

        h1 {
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 32px;
        }

        h2 {
            color: #2d3748;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 24px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }

        h3 {
            color: #4a5568;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 18px;
        }

        .subtitle {
            color: #718096;
            margin-bottom: 30px;
            font-size: 16px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .info-item {
            background: #f7fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }

        .info-label {
            font-weight: 600;
            color: #4a5568;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .info-value {
            color: #2d3748;
            font-size: 16px;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
            margin-bottom: 8px;
        }

        .badge-primary {
            background: #e6f2ff;
            color: #0066cc;
        }

        .badge-success {
            background: #d4edda;
            color: #155724;
        }

        .badge-info {
            background: #d1ecf1;
            color: #0c5460;
        }

        .list-item {
            background: #f7fafc;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 8px;
            border-left: 3px solid #cbd5e0;
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
            margin-right: 10px;
        }

        .btn-success {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
        }

        .btn-success:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(72, 187, 120, 0.4);
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
            padding-top: 30px;
            border-top: 2px solid #e2e8f0;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }

        .highlight-box {
            background: linear-gradient(135deg, #fef5e7 0%, #fdebd0 100%);
            border: 2px solid #f39c12;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }

        .highlight-box h3 {
            color: #d68910;
            margin-top: 0;
        }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: #718096;
        }

        .count-badge {
            background: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>📋 Vista Previa de Duplicación</h1>
            <p class="subtitle">Revisa la información antes de confirmar la duplicación</p>

            <div class="highlight-box">
                <h3>🏠 Alojamiento Original</h3>
                <p><strong>ID:</strong> <?= $alojamiento['idalojamiento'] ?></p>
                <p><strong>Nombre:</strong> <?= htmlspecialchars($alojamiento['nombre']) ?></p>
                <p style="margin-top: 15px; color: #d68910;">
                    ⚠️ El nuevo alojamiento se llamará: <strong>"<?= htmlspecialchars($alojamiento['nombre']) ?> DUPLICADO"</strong>
                </p>
            </div>

            <h2>📊 Información del Alojamiento</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">ID Cerradura Raixer</div>
                    <div class="info-value"><?= $alojamiento['id_cerradura_raixer'] ?? 'No configurado' ?></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Foto Anfitrión</div>
</div>
            </div>

            <?php if ($alojamiento['informacion_portal']): ?>
                <h3>🚪 Información del Portal</h3>
                <div class="list-item"><?= nl2br(htmlspecialchars($alojamiento['informacion_portal'])) ?></div>
            <?php endif; ?>

            <?php if ($alojamiento['informacion_casa']): ?>
                <h3>🏡 Información de la Casa</h3>
                <div class="list-item"><?= nl2br(htmlspecialchars($alojamiento['informacion_casa'])) ?></div>
            <?php endif; ?>

            <h2>📝 Información Externa <span class="count-badge"><?= count($info_externa) ?></span></h2>
            <?php if (count($info_externa) > 0): ?>
                <?php
                $categorias = [];
                foreach ($info_externa as $item) {
                    $cat = $item['categoria'];
                    if (!isset($categorias[$cat])) {
                        $categorias[$cat] = [];
                    }
                    $categorias[$cat][] = $item;
                }
                ?>
                <?php foreach ($categorias as $cat => $items): ?>
                    <h3>Categoría <?= $cat ?> (<?= count($items) ?> items)</h3>
                    <?php foreach ($items as $item): ?>
                        <div class="list-item">
                            <strong><?= htmlspecialchars($item['nombre']) ?></strong>
                            <?php if ($item['sensible']): ?>
                                <span class="badge badge-info">Sensible</span>
                            <?php endif; ?>
                            <?php if ($cat == 8): ?>
                                <span class="badge badge-primary">Video</span>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="empty-state">No hay información externa registrada</div>
            <?php endif; ?>

            <h2>🗺️ Información Turística <span class="count-badge"><?= count($info_turistica) ?></span></h2>
            <?php if (count($info_turistica) > 0): ?>
                <?php foreach ($info_turistica as $item): ?>
                    <div class="list-item">
                        <?= $item['icono'] ?> <strong><?= htmlspecialchars($item['nombre']) ?></strong>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="empty-state">No hay información turística registrada</div>
            <?php endif; ?>

            <h2>🛏️ Configuración de Camas</h2>
            <?php if ($camas): ?>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Camas Dobles</div>
                        <div class="info-value"><?= $camas['camas_dobles'] ?? 0 ?></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Camas Individuales</div>
                        <div class="info-value"><?= $camas['camas_individuales'] ?? 0 ?></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Sofá Cama</div>
                        <div class="info-value"><?= $camas['sofa_cama'] ?? 0 ?></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Literas</div>
                        <div class="info-value"><?= $camas['literas'] ?? 0 ?></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Cuna</div>
                        <div class="info-value"><?= $camas['cuna'] ? '✅ Disponible' : '❌ No disponible' ?></div>
                    </div>
                </div>
            <?php else: ?>
                <div class="empty-state">No hay configuración de camas registrada</div>
            <?php endif; ?>

            <div class="actions">
                <form action="duplicar.php" method="POST" style="display: inline;">
                    <input type="hidden" name="id" value="<?= $id ?>">
                    <button type="submit" class="btn btn-success" onclick="return confirm('¿Estás seguro de que deseas duplicar este alojamiento?')">
                        ✅ Confirmar y Duplicar
                    </button>
                </form>
                <a href="index.php" class="btn btn-secondary">← Cancelar</a>
            </div>
        </div>
    </div>
</body>
</html>
