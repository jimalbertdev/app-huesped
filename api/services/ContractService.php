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
                    ac.nombre_anfitrion as host_name
                FROM reserva r
                LEFT JOIN alojamiento a ON r.alojamiento_id = a.idalojamiento
                LEFT JOIN alojamiento_caracteristica ac ON a.idalojamiento = ac.idalojamiento
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
        $check_in = date('d/m/Y', strtotime($reservation['check_in']));
        $check_out = date('d/m/Y', strtotime($reservation['check_out']));
        $contract_date = date('d/m/Y H:i');
        $birth_date = date('d/m/Y', strtotime($guest['birth_date']));

        // Formatear camas si hay preferencias
        $beds_info = '';
        if ($preferences) {
            $beds_parts = [];
            if ($preferences['double_beds'] > 0) {
                $beds_parts[] = $preferences['double_beds'] . ' cama(s) doble(s)';
            }
            if ($preferences['single_beds'] > 0) {
                $beds_parts[] = $preferences['single_beds'] . ' cama(s) individual(es)';
            }
            if ($preferences['sofa_beds'] > 0) {
                $beds_parts[] = $preferences['sofa_beds'] . ' sofá(s) cama';
            }
            if ($preferences['needs_crib']) {
                $beds_parts[] = '1 cuna';
            }
            $beds_info = !empty($beds_parts) ? implode(', ', $beds_parts) : 'No especificado';
        }

        // Ruta absoluta de la firma
        $signature_img = '';
        // Asegurar que la ruta no tenga slash inicial para concatenar correctamente
        $clean_path = ltrim($signature_path, '/');
        $full_signature_path = __DIR__ . '/../../' . $clean_path;
        
        error_log("CONTRACT: Verificando firma en: " . $full_signature_path);
        
        if ($signature_path && file_exists($full_signature_path)) {
            // Usar ruta absoluta limpia y atributos HTML simples para mPDF
            // object-fit no es soportado por mPDF
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

        // DEBUG: Mostrar ruta en el PDF
        $signature_img .= '<div style="color: red; font-size: 10px; margin-top: 5px;">Firma Temporal (Debug): ' . ($signature_path ?? 'NULL') . '</div>';
        $signature_img .= '<div style="color: red; font-size: 10px;">Full Path (Debug): ' . ($full_signature_path ?? 'NULL') . '</div>';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            text-align: center;
            color: #2563eb;
            font-size: 18pt;
            margin-bottom: 20px;
        }
        h2 {
            color: #2563eb;
            font-size: 14pt;
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
        }
        h3 {
            color: #1e40af;
            font-size: 12pt;
            margin-top: 15px;
            margin-bottom: 8px;
        }
        .info-box {
            background-color: #f3f4f6;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 15px 0;
        }
        .info-row {
            margin: 5px 0;
        }
        .label {
            font-weight: bold;
            color: #1e40af;
        }
        .terms {
            text-align: justify;
            margin: 10px 0;
        }
        .signature-box {
            margin-top: 30px;
            border: 1px solid #ddd;
            padding: 20px;
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9pt;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <h1>📄 CONTRATO DE HOSPEDAJE</h1>

    <div class="info-box">
        <div class="info-row"><span class="label">Código de Reserva:</span> {$reservation['reservation_code']}</div>
        <div class="info-row"><span class="label">Fecha del Contrato:</span> {$contract_date}</div>
    </div>

    <h2>1. Datos del Alojamiento</h2>
    <div class="info-box">
        <div class="info-row"><span class="label">Propiedad:</span> {$reservation['property_name']}</div>
        <div class="info-row"><span class="label">Dirección:</span> {$reservation['property_address']}</div>
        <div class="info-row"><span class="label">Anfitrión:</span> {$reservation['host_name']}</div>
        <div class="info-row"><span class="label">Teléfono Anfitrión:</span> {$reservation['host_phone']}</div>
    </div>

    <h2>2. Datos del Huésped Responsable</h2>
    <div class="info-box">
        <div class="info-row"><span class="label">Nombre Completo:</span> {$guest['first_name']} {$guest['last_name']}</div>
        <div class="info-row"><span class="label">Documento:</span> {$guest['document_type']} - {$guest['document_number']}</div>
        <div class="info-row"><span class="label">Nacionalidad:</span> {$guest['nationality']}</div>
        <div class="info-row"><span class="label">Fecha de Nacimiento:</span> {$birth_date}</div>
        <div class="info-row"><span class="label">Teléfono:</span> {$guest['phone']}</div>
        <div class="info-row"><span class="label">Email:</span> {$guest['email']}</div>
    </div>

    <h2>3. Detalles de la Estancia</h2>
    <div class="info-box">
        <div class="info-row"><span class="label">Check-in:</span> {$check_in}</div>
        <div class="info-row"><span class="label">Check-out:</span> {$check_out}</div>
        <div class="info-row"><span class="label">Número de Huéspedes:</span> {$reservation['num_guests']}</div>
HTML;

        // Agregar preferencias si existen
        if ($preferences && $beds_info) {
            $html .= <<<HTML
        <div class="info-row"><span class="label">Configuración de Camas:</span> {$beds_info}</div>
HTML;
            if ($preferences['estimated_arrival_time']) {
                $html .= <<<HTML
        <div class="info-row"><span class="label">Hora Estimada de Llegada:</span> {$preferences['estimated_arrival_time']}</div>
HTML;
            }
        }

        $html .= <<<HTML
    </div>

    <h2>4. Términos y Condiciones</h2>

    <h3>4.1. Horarios</h3>
    <div class="terms">
        <strong>Check-in:</strong> Entre las 15:00 y las 20:00 horas.<br>
        <strong>Check-out:</strong> Hasta las 11:00 horas.<br>
        El incumplimiento de estos horarios sin previo aviso podrá resultar en cargos adicionales.
    </div>

    <h3>4.2. Normas del Alojamiento</h3>
    <div class="terms">
        El huésped se compromete a mantener el alojamiento en buen estado y hacer un uso responsable de las instalaciones.
        Está <strong>prohibido fumar</strong> en el interior del alojamiento. No se permiten fiestas ni eventos sin autorización
        previa. El ruido debe mantenerse a un nivel razonable, especialmente entre las 22:00 y las 08:00 horas.
    </div>

    <h3>4.3. Capacidad Máxima</h3>
    <div class="terms">
        El número máximo de huéspedes permitidos es el indicado en la reserva. El alojamiento de personas adicionales
        sin autorización previa podrá resultar en la cancelación inmediata de la reserva sin derecho a reembolso.
    </div>

    <h3>4.4. Política de Cancelación</h3>
    <div class="terms">
        Las cancelaciones realizadas con más de 7 días de antelación tendrán reembolso completo. Cancelaciones entre 3
        y 7 días: 50% de reembolso. Cancelaciones con menos de 3 días: sin reembolso. En caso de no presentarse sin
        cancelación previa, no habrá reembolso.
    </div>

    <h3>4.5. Responsabilidades</h3>
    <div class="terms">
        El huésped es responsable de cualquier daño causado al alojamiento durante su estancia. Se realizará inspección
        al check-out. Los daños serán cargados a la tarjeta de crédito proporcionada. El anfitrión no se hace responsable
        de pérdidas o robos de pertenencias personales.
    </div>

    <h3>4.6. Protección de Datos</h3>
    <div class="terms">
        Los datos personales proporcionados serán tratados conforme al RGPD y la legislación española de protección de datos.
        La información será utilizada exclusivamente para la gestión de la reserva y el cumplimiento de obligaciones legales,
        incluyendo el registro de viajeros obligatorio según la normativa vigente.
    </div>

    <h2>5. Firma y Aceptación</h2>
    <div class="terms">
        El huésped responsable declara haber leído, comprendido y aceptado todos los términos y condiciones establecidos
        en este contrato. La firma digital a continuación confirma su conformidad y compromiso de cumplimiento.
    </div>

    <div class="signature-box">
        <div style="margin-bottom: 10px;"><strong>Firma del Huésped Responsable:</strong></div>
        {$signature_img}
        <div style="margin-top: 20px;">
            <div><strong>{$guest['first_name']} {$guest['last_name']}</strong></div>
            <div>{$guest['document_type']}: {$guest['document_number']}</div>
            <div>Fecha: {$contract_date}</div>
        </div>
    </div>

    <div class="footer">
        <p>Generado automáticamente por VACANFLY Guest App</p>
        <p>Este documento tiene validez legal como contrato de hospedaje.</p>
        <p>Para consultas: {$reservation['host_phone']} | {$reservation['host_email']}</p>
    </div>
</body>
</html>
HTML;

        return $html;
    }
}
