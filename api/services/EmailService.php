<?php
require_once __DIR__ . '/../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailService {
    private $db;
    private $config;

    public function __construct($database) {
        $this->db = $database;
        $this->config = $this->loadEmailConfig();
    }

    private function loadEmailConfig() {
        require_once __DIR__ . '/../models/Settings.php';
        $settingsModel = new Settings($this->db);
        return $settingsModel->getEmailConfig();
    }

    public function sendGuestRegisteredNotification($reservation, $guest, $isResponsible, $excessBedsInfo = null) {
        if (!$this->config) {
            error_log("EmailService: No hay configuración SMTP");
            return false;
        }

        $recipients = $this->getRecipients($reservation);
        
        if (empty($recipients)) {
            error_log("EmailService: No hay destinatarios para enviar notificación");
            return false;
        }

        $html = $this->buildGuestRegisteredHTML($reservation, $guest, $isResponsible, $excessBedsInfo);
        
        return $this->sendEmail($recipients, 
            "Nuevo huésped registrado - {$guest['first_name']} {$guest['last_name']}", 
            $html
        );
    }

    public function sendResponsibleWithContract($reservation, $guest, $clientEmail) {
        if (!$this->config) {
            error_log("EmailService: No hay configuración SMTP");
            return false;
        }

        if (empty($clientEmail)) {
            error_log("EmailService: No hay email del cliente");
            return false;
        }

        $html = $this->buildContractEmailHTML($reservation, $guest);
        
        return $this->sendEmail(
            [$clientEmail],
            "Confirmación de registro - Contrato de Hospedaje",
            $html
        );
    }

    private function getRecipients($reservation) {
        $recipients = [];
        
        if (!empty($reservation['host_email'])) {
            $recipients[] = $reservation['host_email'];
        }
        if (!empty($reservation['owner_email'])) {
            $recipients[] = $reservation['owner_email'];
        }
        if (!empty($reservation['super_host_email'])) {
            $recipients[] = $reservation['super_host_email'];
        }
        
        if (empty($recipients) && !empty($this->config['email'])) {
            $recipients[] = $this->config['email'];
            error_log("EmailService: Usando email por defecto: " . $this->config['email']);
        }
        
        return array_unique(array_filter($recipients));
    }

    private function buildGuestRegisteredHTML($reservation, $guest, $isResponsible, $excessBedsInfo = null) {
        $fullName = trim(($guest['first_name'] ?? '') . ' ' . ($guest['last_name'] ?? ''));
        $documento = ($guest['document_type'] ?? '') . ': ' . ($guest['document_number'] ?? '');
        $checkIn = !empty($reservation['check_in_date']) ? date('d/m/Y', strtotime($reservation['check_in_date'])) : 'N/D';
        $checkOut = !empty($reservation['check_out_date']) ? date('d/m/Y', strtotime($reservation['check_out_date'])) : 'N/D';
        $registrationDate = date('d/m/Y H:i');
        $responsibleBadge = $isResponsible ? '<span style="background:#22c55e;color:white;padding:4px 8px;border-radius:4px;font-size:12px;margin-left:8px;">RESPONSABLE</span>' : '';

        $excessBedsSection = '';
        if ($excessBedsInfo && !empty($excessBedsInfo['requested'])) {
            $excessBedsSection = '
            <tr>
                <td style="padding:10px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:8px;border:1px solid #f59e0b;">
                        <tr>
                            <td colspan="2" style="padding:15px;border-bottom:1px solid #f59e0b;">
                                <strong style="color:#92400e;">SOLICITUD DE CAMAS ADICIONALES</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:15px;width:140px;color:#92400e;">Camas solicitadas</td>
                            <td style="padding:15px;color:#1e293b;font-weight:bold;">' . $excessBedsInfo['requested'] . '</td>
                        </tr>
                        <tr>
                            <td style="padding:15px;color:#92400e;">Huéspedes</td>
                            <td style="padding:15px;color:#1e293b;">' . $excessBedsInfo['guests'] . '</td>
                        </tr>
                        <tr>
                            <td style="padding:15px;color:#92400e;">Diferencia</td>
                            <td style="padding:15px;color:#dc2626;font-weight:bold;">+' . $excessBedsInfo['difference'] . ' cama(s) adicional(es)</td>
                        </tr>
                        <tr>
                            <td style="padding:15px;color:#92400e;">Detalle</td>
                            <td style="padding:15px;color:#1e293b;">
                                Dobles: ' . ($excessBedsInfo['double_beds'] ?? 0) . ' | Individuales: ' . ($excessBedsInfo['single_beds'] ?? 0) . ' | Sofás: ' . ($excessBedsInfo['sofa_beds'] ?? 0) . '
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>';
        }

        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
                    <tr>
                        <td style="background:#1e293b;padding:30px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:24px;">VACANFLY</h1>
                            <p style="color:#94a3b8;margin:5px 0 0 0;font-size:14px;">Guest Application</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px 30px 10px 30px;">
                            <h2 style="color:#1e293b;margin:0;font-size:20px;">Nuevo huésped registrado</h2>
                            <p style="color:#64748b;margin:5px 0 0 0;">Se ha registrado un nuevo huésped en tu propiedad</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:10px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                                <tr>
                                    <td colspan="2" style="padding:15px;border-bottom:1px solid #e2e8f0;">
                                        <strong style="color:#1e293b;">DATOS DEL HUÉSPED</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;width:140px;color:#64748b;">Nombre completo</td>
                                    <td style="padding:15px;color:#1e293b;font-weight:bold;">' . $fullName . $responsibleBadge . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Documento</td>
                                    <td style="padding:15px;color:#1e293b;">' . $documento . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Email</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($guest['email'] ?? 'No disponible') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Teléfono</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($guest['phone'] ?? 'No disponible') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">País de residencia</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($guest['residence_country'] ?? 'No disponible') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Fecha de registro</td>
                                    <td style="padding:15px;color:#1e293b;">' . $registrationDate . '</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:10px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                                <tr>
                                    <td colspan="2" style="padding:15px;border-bottom:1px solid #e2e8f0;">
                                        <strong style="color:#1e293b;">DATOS DE LA RESERVA</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;width:140px;color:#64748b;">Código reserva</td>
                                    <td style="padding:15px;color:#1e293b;font-weight:bold;">' . ($reservation['reservation_code'] ?? 'N/D') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Alojamiento</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($reservation['accommodation_name'] ?? 'N/D') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Dirección</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($reservation['address'] ?? 'N/D') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Check-in</td>
                                    <td style="padding:15px;color:#1e293b;">' . $checkIn . ' a partir de ' . ($reservation['check_in_time'] ?? '16:00') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Check-out</td>
                                    <td style="padding:15px;color:#1e293b;">' . $checkOut . ' hasta las ' . ($reservation['check_out_time'] ?? '11:00') . '</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ' . $excessBedsSection . '
                    <tr>
                        <td style="padding:10px 30px 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
                                <tr>
                                    <td colspan="2" style="padding:15px;border-bottom:1px solid #bbf7d0;">
                                        <strong style="color:#166534;">CONTACTO DEL ANFITRIÓN</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;width:140px;color:#64748b;">Nombre</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($reservation['host_name'] ?? 'No disponible') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Teléfono</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($reservation['host_phone'] ?? 'No disponible') . '</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f1f5f9;padding:20px;text-align:center;">
                            <p style="color:#94a3b8;margin:0;font-size:12px;">Este email ha sido enviado automáticamente por el sistema VACANFLY</p>
                            <p style="color:#64748b;margin:10px 0 0 0;font-size:11px;">© ' . date('Y') . ' VACANFLY - Guest Application</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
    }

    private function buildContractEmailHTML($reservation, $guest) {
        $fullName = trim(($guest['first_name'] ?? '') . ' ' . ($guest['last_name'] ?? ''));
        $checkIn = !empty($reservation['check_in_date']) ? date('d/m/Y', strtotime($reservation['check_in_date'])) : 'N/D';
        $checkOut = !empty($reservation['check_out_date']) ? date('d/m/Y', strtotime($reservation['check_out_date'])) : 'N/D';
        $contractUrl = $reservation['contract_path'] ?? '';

        // Normalizar URL del contrato (convertir ruta local a URL pública)
        if (!empty($contractUrl) && strpos($contractUrl, 'http') !== 0) {
            $contractUrl = $this->normalizeContractUrl($contractUrl);
        }

        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
                    <tr>
                        <td style="background:#1e293b;padding:30px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:24px;">VACANFLY</h1>
                            <p style="color:#94a3b8;margin:5px 0 0 0;font-size:14px;">Guest Application</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px 30px 10px 30px;">
                            <h2 style="color:#1e293b;margin:0;font-size:20px;">Confirmación de registro</h2>
                            <p style="color:#64748b;margin:5px 0 0 0;">Tu registro como huésped responsable ha sido completado exitosamente</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:10px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                                <tr>
                                    <td colspan="2" style="padding:15px;border-bottom:1px solid #e2e8f0;">
                                        <strong style="color:#1e293b;">DATOS DEL HUÉSPED RESPONSABLE</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;width:140px;color:#64748b;">Nombre completo</td>
                                    <td style="padding:15px;color:#1e293b;font-weight:bold;">' . $fullName . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Documento</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($guest['document_type'] ?? '') . ': ' . ($guest['document_number'] ?? '') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Email</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($guest['email'] ?? 'N/D') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Teléfono</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($guest['phone'] ?? 'N/D') . '</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:10px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                                <tr>
                                    <td colspan="2" style="padding:15px;border-bottom:1px solid #e2e8f0;">
                                        <strong style="color:#1e293b;">DATOS DE LA RESERVA</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;width:140px;color:#64748b;">Código reserva</td>
                                    <td style="padding:15px;color:#1e293b;font-weight:bold;">' . ($reservation['reservation_code'] ?? 'N/D') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Alojamiento</td>
                                    <td style="padding:15px;color:#1e293b;">' . ($reservation['accommodation_name'] ?? 'N/D') . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Check-in</td>
                                    <td style="padding:15px;color:#1e293b;">' . $checkIn . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:15px;color:#64748b;">Check-out</td>
                                    <td style="padding:15px;color:#1e293b;">' . $checkOut . '</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 30px;background:#f0fdf4;text-align:center;">
                            <p style="color:#166534;margin:0 0 10px 0;font-size:14px;">
                                <strong>Contrato de Hospedaje</strong>
                            </p>
                            ' . (!empty($contractUrl) ? '
                            <a href="' . $contractUrl . '" style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                                Ver Contrato PDF
                            </a>
                            ' : '
                            <p style="color:#dc2626;margin:0;">El contrato no está disponible actualmente</p>
                            ') . '
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 30px;text-align:center;">
                            <p style="color:#64748b;margin:0;font-size:14px;">
                                Gracias por registrarte en VACANFLY. Si tienes alguna pregunta, contacta al anfitrión.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f1f5f9;padding:20px;text-align:center;">
                            <p style="color:#94a3b8;margin:0;font-size:12px;">Este email ha sido enviado automáticamente por el sistema VACANFLY</p>
                            <p style="color:#64748b;margin:10px 0 0 0;font-size:11px;">© ' . date('Y') . ' VACANFLY - Guest Application</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
    }

    private function sendEmail($recipients, $subject, $body) {
        $mail = new PHPMailer(true);
        
        try {
            $mail->SMTPDebug  = SMTP::DEBUG_OFF;
            $mail->isSMTP();
            $mail->Host       = $this->config['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->config['email'];
            $mail->Password   = $this->config['password'];
            $mail->SMTPSecure = $this->config['enc'] === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $this->config['port'];
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom($this->config['email'], 'VACANFLY');

            foreach ($recipients as $recipient) {
                $mail->addAddress($recipient);
            }

            if (!empty($this->config['emailcc'])) {
                $mail->addCC($this->config['emailcc']);
            }
            if (!empty($this->config['emailbcc'])) {
                $mail->addBCC($this->config['emailbcc']);
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->AltBody = strip_tags(str_replace('<br>', "\n", $body));

            $mail->send();
            error_log("EmailService: Email enviado exitosamente a: " . implode(', ', $recipients));
            return true;

        } catch (Exception $e) {
            error_log("EmailService Error: " . $mail->ErrorInfo);
            return false;
        }
    }

    private function normalizeContractUrl($path) {
        // Si ya es URL completa, retornarla
        if (strpos($path, 'http://') === 0 || strpos($path, 'https://') === 0) {
            return $path;
        }

        // Normalizar ruta: remover /srv/http/ y convertir a ruta relativa
        $path = str_replace('/srv/http/', '', $path);
        $path = str_replace('/srv/https/', '', $path);
        
        // Eliminar /api/services/../../ -> convertir a ruta correcta
        $path = str_replace('api/services/../../', '', $path);

        // Construir URL pública
        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        
        // Asegurar que tenga el formato correcto
        $urlPath = ltrim($path, '/');
        if (strpos($urlPath, 'app_huesped') !== 0) {
            $urlPath = 'app_huesped/' . $urlPath;
        }

        return $protocol . '://' . $host . '/' . $urlPath;
    }
}
