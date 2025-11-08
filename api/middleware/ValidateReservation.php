<?php
/**
 * Middleware de Validación de Reserva
 * Verifica que una reserva existe, está activa y dentro del período válido
 */

require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../includes/Logger.php';

class ValidateReservation {

    /**
     * Validar acceso a una reserva
     *
     * @param object $reservationModel Instancia del modelo Reservation
     * @param int $reservation_id ID de la reserva a validar
     * @param bool $check_dates Si debe verificar que está dentro del período de check-in/out
     * @return array Datos de la reserva si es válida
     */
    public static function validate($reservationModel, $reservation_id, $check_dates = true) {
        // Verificar que el ID es válido
        if (empty($reservation_id) || !is_numeric($reservation_id)) {
            Logger::warning("Intento de acceso con reservation_id inválido", [
                'reservation_id' => $reservation_id
            ]);
            Response::error("ID de reserva inválido", 400);
        }

        // Verificar que la reserva existe
        $reservation = $reservationModel->getById($reservation_id);

        if (!$reservation) {
            Logger::warning("Intento de acceso a reserva inexistente", [
                'reservation_id' => $reservation_id
            ]);
            Response::notFound("Reserva no encontrada");
        }

        // Verificar el estado de la reserva
        $valid_statuses = ['confirmed', 'active', 'checked_in'];
        if (!in_array($reservation['status'], $valid_statuses)) {
            Logger::security("Intento de acceso a reserva con estado inválido", [
                'reservation_id' => $reservation_id,
                'status' => $reservation['status']
            ]);
            Response::error("Esta reserva no está activa", 403);
        }

        // Verificar fechas si se solicita
        if ($check_dates) {
            self::validateDates($reservation);
        }

        return $reservation;
    }

    /**
     * Validar que estamos dentro del período de la reserva
     *
     * @param array $reservation Datos de la reserva
     */
    private static function validateDates($reservation) {
        $now = new DateTime();
        $check_in = new DateTime($reservation['check_in_date']);
        $check_out = new DateTime($reservation['check_out_date']);

        // Obtener margen de acceso anticipado (horas antes del check-in)
        $early_access_hours = intval($_ENV['CHECKIN_EARLY_ACCESS_HOURS'] ?? 4);

        // Permitir acceso X horas antes del check-in
        $check_in_with_margin = clone $check_in;
        $check_in_with_margin->modify("-{$early_access_hours} hours");

        // Verificar si es demasiado pronto
        if ($now < $check_in_with_margin) {
            $formatted_checkin = $check_in->format('d/m/Y H:i');
            Logger::info("Intento de acceso antes del check-in permitido", [
                'reservation_id' => $reservation['id'],
                'check_in_date' => $reservation['check_in_date'],
                'current_time' => $now->format('Y-m-d H:i:s')
            ]);
            Response::error(
                "No puedes acceder aún. El check-in es el {$formatted_checkin}. Podrás acceder {$early_access_hours} horas antes.",
                403
            );
        }

        // Verificar si ya pasó el check-out
        if ($now > $check_out) {
            Logger::info("Intento de acceso después del check-out", [
                'reservation_id' => $reservation['id'],
                'check_out_date' => $reservation['check_out_date'],
                'current_time' => $now->format('Y-m-d H:i:s')
            ]);
            Response::error(
                "Tu reserva ha finalizado. El check-out fue el " . $check_out->format('d/m/Y H:i'),
                403
            );
        }
    }

    /**
     * Validar que la reserva corresponde a un código específico
     *
     * @param object $reservationModel Instancia del modelo Reservation
     * @param string $reservation_code Código de la reserva
     * @return array Datos de la reserva si es válida
     */
    public static function validateByCode($reservationModel, $reservation_code) {
        if (empty($reservation_code)) {
            Response::error("Código de reserva requerido", 400);
        }

        $reservation = $reservationModel->getByCode($reservation_code);

        if (!$reservation) {
            Logger::warning("Intento de acceso con código de reserva inválido", [
                'reservation_code' => $reservation_code
            ]);
            Response::notFound("Código de reserva no encontrado");
        }

        // Validar estado
        $valid_statuses = ['confirmed', 'active', 'checked_in'];
        if (!in_array($reservation['status'], $valid_statuses)) {
            Response::error("Esta reserva no está activa", 403);
        }

        return $reservation;
    }
}
