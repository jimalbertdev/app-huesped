<?php
/**
 * Servicio: Generación de Contratos PDF
 *
 * Genera contratos de hospedaje en formato PDF usando mPDF
 * Incluye datos de la reserva, huésped responsable, preferencias y firma
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Mpdf\Mpdf;

class ContractService
{
    private $database;

    public function __construct($database)
    {
        $this->database = $database;
    }

    /**
     * Generar contrato PDF para una reserva
     *
     * @param int $reservation_id ID de la reserva
     * @param int $responsible_guest_id ID del huésped responsable
     * @param string $signature_path Ruta a la imagen de la firma
     * @param object $reservationModel Modelo de Reservation para actualizar la tabla reserva
     * @return array Array con 'contract_path' y 'contract_date'
     */
    public function generateContract($reservation_id, $responsible_guest_id, $signature_path = null, $reservationModel = null)
    {
        // 1. OBTENER DATOS DE LA RESERVA
        $reservation = $this->getReservationData($reservation_id);
        if (!$reservation) {
            throw new Exception("Reserva no encontrada");
        }

        // 2. OBTENER DATOS DEL HUÉSPED RESPONSABLE
        $guest = $this->getGuestData($responsible_guest_id);
        if (!$guest) {
            throw new Exception("Huésped no encontrado");
        }

        // 3. OBTENER PREFERENCIAS (si existen)
        $preferences = $this->getPreferencesData($reservation_id);

        // 4. GENERAR HTML DEL CONTRATO
        $html = $this->generateContractHTML($reservation, $guest, $preferences, $signature_path);

        // 5. CREAR PDF CON MPDF
        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 20,
            'margin_bottom' => 20,
            'margin_header' => 10,
            'margin_footer' => 10
        ]);

        // Configurar metadata
        $mpdf->SetTitle('Contrato de Hospedaje - ' . $reservation['reservation_code']);
        $mpdf->SetAuthor('VACANFLY');
        $mpdf->SetCreator('VACANFLY Guest App');

        // Escribir HTML al PDF
        $mpdf->WriteHTML($html);

        // 6. GUARDAR PDF EN EL SERVIDOR
        $contracts_dir = __DIR__ . '/../../uploads/contracts/RES' . $reservation_id;
        if (!file_exists($contracts_dir)) {
            mkdir($contracts_dir, 0777, true);
        }

        $filename = 'contrato_' . $reservation['reservation_code'] . '_' . time() . '.pdf';
        $file_path = $contracts_dir . '/' . $filename;
        $mpdf->Output($file_path, \Mpdf\Output\Destination::FILE);

        error_log("CONTRACT: PDF generado en: " . $file_path);

        // 7. RUTA RELATIVA Y FECHA
        $contract_path = '/uploads/contracts/RES' . $reservation_id . '/' . $filename;
        $contract_date = date('Y-m-d H:i:s');

        error_log("CONTRACT: Ruta relativa: " . $contract_path);
        error_log("CONTRACT: Fecha: " . $contract_date);
        error_log("CONTRACT: ReservationModel is " . ($reservationModel !== null ? "NOT NULL" : "NULL"));

        // 8. GUARDAR EN LA TABLA RESERVA
        if ($reservationModel !== null) {
            try {
                error_log("CONTRACT: Intentando actualizar reserva ID: " . $reservation_id);
                $result = $reservationModel->updateContract($reservation_id, $contract_path, $contract_date);
                error_log("CONTRACT: Resultado de updateContract: " . ($result ? "SUCCESS" : "FAILED"));
            } catch (Exception $e) {
                error_log("CONTRACT ERROR: Error guardando contrato en tabla reserva: " . $e->getMessage());
                error_log("CONTRACT ERROR: Stack trace: " . $e->getTraceAsString());
                // No lanzar excepción, solo registrar el error
            }
        } else {
            error_log("CONTRACT WARNING: ReservationModel es NULL, no se puede actualizar la tabla reserva");
        }

        // 9. RETORNAR RUTA Y FECHA
        return [
            'contract_path' => $contract_path,
            'contract_date' => $contract_date
        ];
    }

    /**
     * Obtener datos de la reserva
     */
    private function getReservationData($reservation_id)
    {
        $sql = "SELECT 
                    r.*,
                    r.localizador_canal as reservation_code,
                    a.nombre as accommodation_name,
                    a.direccion as address,
                    ac.nombre_anfitrion as host_name,
                    e.registrotur,
                    e.nrua,
                    ent.nombre as entidad_nombre
                FROM reserva r
                LEFT JOIN alojamiento a ON r.alojamiento_id = a.idalojamiento
                LEFT JOIN alojamiento_caracteristica ac ON a.idalojamiento = ac.idalojamiento
                LEFT JOIN establecimiento e ON r.establecimiento_id = e.idestablecimiento
                LEFT JOIN entidad ent ON e.id_entidad = ent.identidad
                WHERE r.id = ?";
        return $this->database->queryOne($sql, [$reservation_id]);
    }

    /**
     * Obtener datos del huésped
     */
    private function getGuestData($guest_id)
    {
        $sql = "SELECT * FROM viajeros WHERE id = ?";
        return $this->database->queryOne($sql, [$guest_id]);
    }

    /**
     * Obtener preferencias de la reserva
     */
    private function getPreferencesData($reservation_id)
    {
        // NOTA: La tabla es 'reservas_detalles' y la columna tiene un typo 'reseva_id'
        $sql = "SELECT * FROM reservas_detalles WHERE reseva_id = ?";
        return $this->database->queryOne($sql, [$reservation_id]);
    }

    /**
     * Generar HTML del contrato
     */
    private function generateContractHTML($reservation, $guest, $preferences, $signature_path)
    {
        // Formatear fechas
        $check_in = date('d-m-Y', strtotime($reservation['fecha_inicio']));
        $check_out = date('d-m-Y', strtotime($reservation['fecha_fin']));
        $contract_date = date('d-m-Y');

        // Calcular número de huéspedes
        $num_guests = $reservation['total_huespedes'] ?? 'N/A';
        
        // Precio total
        $total_price = number_format($reservation['total'], 2, ',', '.');
        
        // Nombre del alojamiento
        $property_name = $reservation['accommodation_name'];
        
        // Nombre completo del huésped
        $guest_full_name = trim(($guest['n0mbr3s'] ?? '') . ' ' . ($guest['p3ll1d01'] ?? '') . ' ' . ($guest['p3ll1d02'] ?? ''));
        
        // Documento del huésped
        $guest_document = ($guest['tipo_documento'] ?? 'DNI') . ': ' . ($guest['nvm3r0_d0cvm3nt0'] ?? 'N/A');

        // Registros turísticos desde la tabla establecimiento
        $registro_turistico = $reservation['registrotur'] ?? 'Pendiente de registro';
        $nrua_registro = $reservation['nrua'] ?? 'Pendiente de registro';
        
        // Nombre de la entidad explotadora desde la tabla entidad
        $entidad_explotadora = $reservation['entidad_nombre'] ?? 'GESTIÓN DE INMUEBLES SSL';
        
        // TODO: Obtener este valor de la base de datos cuando el usuario indique la fuente
        $fianza_amount = '300,00'; // Monto de la fianza

        // Ruta absoluta de la firma
        $signature_img = '';
        $clean_path = ltrim($signature_path, '/');
        $full_signature_path = __DIR__ . '/../../' . $clean_path;
        
        error_log("CONTRACT: Verificando firma en: " . $full_signature_path);
        
        if ($signature_path && file_exists($full_signature_path)) {
            $clean_full_path = realpath($full_signature_path);
            $signature_img = '
            <table width="100%">
                <tr>
                    <td width="50%">
                        <img src="' . $clean_full_path . '" width="200" height="100" style="border: 0;" />
                    </td>
                </tr>
            </table>';
            error_log("CONTRACT: Firma incrustada con ruta absoluta limpia: " . $clean_full_path);
        } else {
            error_log("CONTRACT WARNING: No se encontró el archivo de firma o path vacío. Path original: " . $signature_path);
        }

        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
            margin: 20px;
        }
        .header-notice {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 10px;
            margin-bottom: 20px;
            font-size: 9pt;
            text-align: justify;
        }
        h1 {
            text-align: center;
            color: #2563eb;
            font-size: 16pt;
            margin: 20px 0;
            text-transform: uppercase;
        }
        h2 {
            color: #2563eb;
            font-size: 12pt;
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
        }
        h3 {
            color: #1e40af;
            font-size: 11pt;
            margin-top: 15px;
            margin-bottom: 8px;
        }
        .section-subtitle {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 11pt;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        table.data-table td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        table.data-table td.label {
            font-weight: bold;
            background-color: #f3f4f6;
            width: 40%;
        }
        .clause {
            margin: 10px 0;
            text-align: justify;
        }
        .clause ul {
            margin: 5px 0;
            padding-left: 20px;
        }
        .clause li {
            margin: 5px 0;
        }
        .signature-section {
            margin-top: 30px;
            page-break-inside: avoid;
        }
        .signature-box {
            border: 1px solid #ddd;
            padding: 15px;
            margin: 10px 0;
            min-height: 120px;
        }
        .signature-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .footer-note {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 8pt;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header-notice">
        Este documento tiene valor de <strong>CONTRATO DE ARRENDAMIENTO</strong> y se rige por la Ley 29/1994, 
        de Arrendamientos Urbanos (LAU), y la normativa turística específica de la Comunidad Autónoma de 
        ubicación del inmueble.
    </div>

    <h1>Contrato de Arrendamiento de Uso Turístico</h1>

    <h2>Datos de la Reserva:</h2>
    
    <div class="section-subtitle">Detalles:</div>
    
    <table class="data-table">
        <tr>
            <td class="label">Alojamiento (Nombre):</td>
            <td>{$property_name}</td>
        </tr>
        <tr>
            <td class="label">Nº de Registro Turístico:</td>
            <td>{$registro_turistico}</td>
        </tr>
        <tr>
            <td class="label">Nº de Registro Turístico (NRUA):</td>
            <td>{$nrua_registro}</td>
        </tr>
        <tr>
            <td class="label">Entidad Explotadora:</td>
            <td>{$entidad_explotadora}</td>
        </tr>
        <tr>
            <td class="label">Huésped Responsable:</td>
            <td>{$guest_full_name}</td>
        </tr>
        <tr>
            <td class="label">Nº de Ocupantes:</td>
            <td>{$num_guests}</td>
        </tr>
        <tr>
            <td class="label">Teléfono de Asistencia:</td>
            <td>+34 683 22 66 05</td>
        </tr>
        <tr>
            <td class="label">Precio Total:</td>
            <td>{$total_price} €</td>
        </tr>
        <tr>
            <td class="label">Fecha de Entrada:</td>
            <td>{$check_in}</td>
        </tr>
        <tr>
            <td class="label">Fecha de Salida:</td>
            <td>{$check_out}</td>
        </tr>
    </table>

    <h2>CLÁUSULAS CONTRACTUALES</h2>

    <h3>1. Objeto y Naturaleza</h3>
    <div class="clause">
        El objeto del presente es el Arrendamiento de Temporada con destino a uso turístico/vacacional del inmueble. 
        Este contrato no se destina a cubrir la necesidad de vivienda permanente del huésped y, por lo tanto, 
        queda excluido del régimen de prórroga obligatoria de la LAU.
    </div>

    <h3>2. Duración y Extensión</h3>
    <div class="clause">
        El período de arrendamiento es el estipulado en la tabla superior. El huésped deberá abandonar la propiedad 
        en la fecha y hora de salida.<br><br>
        El huésped renuncia a cualquier derecho de prórroga o renovación forzosa del contrato. No obstante, 
        si El huésped solicitara una extensión de la estadía, esta podrá ser concedida sólo si La Arrendadora 
        tiene disponibilidad y ambas partes firman un nuevo acuerdo de extensión con las condiciones económicas 
        y temporales pactadas.
    </div>

    <h3>3. Precio</h3>
    <div class="clause">
        El precio total de la estancia es el indicado.
    </div>

    <h3>4. Fianza</h3>
    <div class="clause">
        El Arrendador podrá reclamar una vez comprobado el estado del alojamiento en concepto de fianza el importe 
        de hasta ({$fianza_amount}€) para cubrir posibles daños en la conservación del inmueble y el cumplimiento 
        de las obligaciones.
    </div>

    <h3>5. Obligaciones del Huésped</h3>
    <div class="clause">
        <ul>
            <li><strong>Responsabilidad por Daños:</strong> El huésped es directa y totalmente responsable de los daños, 
            desperfectos, pérdidas o menoscabos causados en el inmueble, mobiliario o enseres, por él o por sus acompañantes.</li>
            
            <li><strong>Ocupación Máxima:</strong> El número de ocupantes no podrá exceder del máximo indicado. 
            El incumplimiento o el subarriendo de la vivienda son causas de resolución contractual y desalojo 
            inmediato sin derecho a reembolso.</li>
            
            <li><strong>Normas de Convivencia:</strong> Queda estrictamente prohibido realizar fiestas, actividades 
            molestas, insalubres o ilícitas, debiendo respetar el descanso vecinal, especialmente en horas nocturnas.</li>
            
            <li><strong>Identificación:</strong> El huésped se compromete a facilitar los datos de identificación de 
            todos los ocupantes, según lo exige la normativa española de seguridad ciudadana (Libro Registro).</li>
        </ul>
    </div>

    <h3>6. Ley Aplicable y Jurisdicción</h3>
    <div class="clause">
        Este contrato se interpreta y aplica conforme a la ley española. Para cualquier controversia, las partes 
        se someten expresamente a los Juzgados y Tribunales del lugar donde se ubica el inmueble, con renuncia 
        a cualquier otro fuero.
    </div>

    <div class="signature-section">
        <h2>Firmas</h2>
        
        <table width="100%">
            <tr>
                <td width="50%" style="vertical-align: top;">
                    <div class="signature-box">
                        <div class="signature-title">La Arrendadora</div>
                        <div>{$entidad_explotadora}</div>
                        <!-- <div style="margin-top: 60px; border-top: 1px solid #000; padding-top: 5px;">
                            Firmado: FIRMA DEL RESPONSABLE
                        </div> -->
                    </div>
                </td>
                <td width="50%" style="vertical-align: top;">
                    <div class="signature-box">
                        <div class="signature-title">El Huésped</div>
                        <div>{$guest_full_name}</div>
                        <div>{$guest_document}</div>
                        <div style="margin-top: 10px;">
                            {$signature_img}
                        </div>
                        <div style="margin-top: 10px;">
                            <strong>Fecha:</strong> {$contract_date}
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="footer-note">
        <p>Este contrato incluye ahora de forma prominente el Nº de Registro Turístico, esencial para operar legalmente 
        y demostrar el cumplimiento de las normativas de turismo de las Comunidades Autónomas.</p>
        <p>Generado automáticamente por VACANFLY</p>
    </div>
</body>
</html>
HTML;

        return $html;
    }
}

