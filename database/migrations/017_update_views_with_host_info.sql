-- =====================================================
-- Migración 017: Actualizar vistas con nueva información de anfitrión
-- =====================================================
-- Fecha: 2025-11-28
-- Descripción: Actualiza las vistas para obtener información del anfitrión desde:
--              - personal_interno (foto)
--              - personal_interno_anfitrion (telefono, correo)
--              Relacionadas via alojamiento_caracteristica.id_personal_interno_anfitrion
-- NOTA: Esta migración NO usa "USE database_name"
--       para ser agnóstica a la base de datos
-- =====================================================

-- =====================================================
-- 1. Actualizar vista v_reservations_full
-- =====================================================
DROP VIEW IF EXISTS v_reservations_full;

CREATE VIEW v_reservations_full AS
SELECT
    r.id,
    r.alojamiento_id AS accommodation_id,
    r.localizador_canal AS reservation_code,
    DATE(r.fecha_inicio) AS check_in_date,
    DATE(r.fecha_fin) AS check_out_date,
    r.hora_entrada AS check_in_time,
    ac.hora_salida AS check_out_time,
    r.total_huespedes AS total_guests,
    r.cliente_id,
    r.created_at,
    r.updated_at,
    -- Campos del alojamiento
    a.nombre AS accommodation_name,
    a.direccion AS address,
    CONCAT(a.direccion, ', ', a.codpostal) AS full_address,
    a.codpostal AS postal_code,
    -- Campos del anfitrión (prioridad: personal_interno, fallback: alojamiento_caracteristica)
    pi.identificador as host_document,
    COALESCE(CONCAT(pi.nombres, ' ', pi.apellidos), ac.nombre_anfitrion) AS host_name,
    COALESCE(pia.correo, ac.email_anfitrion) AS host_email,
    COALESCE(pia.telefono, ac.tel_anfitrion) AS host_phone,
    pi.foto AS host_photo,
    -- WiFi
    ac.redwifi AS wifi_ssid,
    ac.clavewifi AS wifi_password,
    -- Datos del huésped responsable (desde viajeros)
    v.n0mbr3s AS responsible_first_name,
    v.p3ll1d01 AS responsible_last_name,
    v.m41l AS responsible_email,
    -- Calcular huéspedes registrados
    (SELECT COUNT(*)
     FROM checkin c
     INNER JOIN viajeros v2 ON c.viajero_id = v2.id
     WHERE c.reserva_id = r.id) AS registered_guests,
    -- Determinar si todos los huéspedes están registrados
    ((SELECT COUNT(*)
      FROM checkin c
      INNER JOIN viajeros v2 ON c.viajero_id = v2.id
      WHERE c.reserva_id = r.id) >= r.total_huespedes) AS all_guests_registered,
    -- ID del huésped responsable
    (SELECT c.viajero_id
     FROM checkin c
     INNER JOIN viajeros v3 ON c.viajero_id = v3.id
     WHERE c.reserva_id = r.id AND v3.responsable = 1
     LIMIT 1) AS responsible_guest_id
FROM reserva r
LEFT JOIN alojamiento a ON r.alojamiento_id = a.idalojamiento
LEFT JOIN alojamiento_caracteristica ac ON a.idalojamiento = ac.idalojamiento
LEFT JOIN personal_interno pi ON ac.id_personal_interno_anfitrion = pi.id
LEFT JOIN personal_interno_anfitrion pia ON pi.id = pia.personal_interno_id
LEFT JOIN checkin c ON r.id = c.reserva_id
LEFT JOIN viajeros v ON c.viajero_id = v.id AND v.responsable = 1;

-- =====================================================
-- 2. Actualizar vista v_reservations_with_host
-- =====================================================
DROP VIEW IF EXISTS v_reservations_with_host;

CREATE VIEW v_reservations_with_host AS
SELECT
    r.id,
    r.localizador_canal AS reservation_code,
    DATE(r.fecha_inicio) AS check_in,
    DATE(r.fecha_fin) AS check_out,
    r.total_huespedes AS num_guests,
    a.nombre AS property_name,
    a.direccion AS property_address,
    pi.identificador as host_document,
    COALESCE(CONCAT(pi.nombres, ' ', pi.apellidos), ac.nombre_anfitrion) AS host_name,
    COALESCE(pia.correo, ac.email_anfitrion) AS host_email,
    COALESCE(pia.telefono, ac.tel_anfitrion) AS host_phone,
    pi.foto AS host_photo
FROM reserva r
LEFT JOIN alojamiento a ON r.alojamiento_id = a.idalojamiento
LEFT JOIN alojamiento_caracteristica ac ON a.idalojamiento = ac.idalojamiento
LEFT JOIN personal_interno pi ON ac.id_personal_interno_anfitrion = pi.id
LEFT JOIN personal_interno_anfitrion pia ON pi.id = pia.personal_interno_id;

-- =====================================================
-- Fin de migración 017
-- =====================================================
