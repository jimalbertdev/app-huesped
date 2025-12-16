<?php
/**
 * Interfaz Web para Duplicar Alojamientos
 * Permite seleccionar un alojamiento, ver su información y duplicarlo
 */

// Configuración de la base de datos
require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

// Iniciar sesión para mensajes
session_start();

$database = new Database();
$db = $database->getConnection();

// Obtener mensaje de sesión si existe
$message = $_SESSION['message'] ?? null;
$messageType = $_SESSION['message_type'] ?? 'info';
unset($_SESSION['message'], $_SESSION['message_type']);

// Obtener todos los alojamientos
$query = "SELECT idalojamiento, referencia, nombre FROM alojamiento ORDER BY referencia ASC";
$stmt = $db->prepare($query);
$stmt->execute();
$alojamientos = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Duplicar Alojamiento</title>
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
            max-width: 900px;
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

        .subtitle {
            color: #718096;
            margin-bottom: 30px;
            font-size: 16px;
        }

        .form-group {
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #2d3748;
            font-weight: 600;
            font-size: 14px;
        }

        select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.3s;
            background: white;
        }

        select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .alert {
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }

        .icon {
            font-size: 20px;
        }

        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            font-size: 14px;
            opacity: 0.9;
        }

        .footer a {
            color: white;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>🏠 Duplicar Alojamiento</h1>
            <p class="subtitle">Selecciona un alojamiento para ver su información y duplicarlo</p>

            <?php if ($message): ?>
                <div class="alert alert-<?= $messageType ?>">
                    <span class="icon">
                        <?php if ($messageType === 'success'): ?>✅<?php endif; ?>
                        <?php if ($messageType === 'error'): ?>❌<?php endif; ?>
                        <?php if ($messageType === 'info'): ?>ℹ️<?php endif; ?>
                    </span>
                    <span><?= htmlspecialchars($message) ?></span>
                </div>
            <?php endif; ?>

            <form action="preview.php" method="GET">
                <div class="form-group">
                    <label for="alojamiento_id">Selecciona el alojamiento a duplicar:</label>
                    <select name="id" id="alojamiento_id" required>
                        <option value="">-- Selecciona un alojamiento --</option>
                        <?php foreach ($alojamientos as $alojamiento): ?>
                            <option value="<?= $alojamiento['idalojamiento'] ?>">
                            Referencia <?= $alojamiento['referencia'] ?> - <?= htmlspecialchars($alojamiento['nombre']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary">
                    Ver Información y Continuar →
                </button>
            </form>
        </div>

        <div class="footer">
            <p>Sistema de Duplicación de Alojamientos v1.0</p>
            <p><a href="README.md" target="_blank">Ver Documentación</a></p>
        </div>
    </div>
</body>
</html>
