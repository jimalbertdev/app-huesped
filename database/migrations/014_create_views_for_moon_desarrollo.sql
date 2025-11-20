-- =====================================================
-- Migración 014: Crear vistas para moon_desarrollo
-- =====================================================
-- Fecha: 2025-11-17
-- Descripción: Crea las vistas SQL necesarias usando:
--              - reserva
--              - alojamiento
--              - alojamiento_caracteristica
--              - viajeros
--              - checkin
-- NOTA: Esta migración NO usa "USE database_name"
--       para ser agnóstica a la base de datos
-- =====================================================

-- =====================================================
-- 1. Vista v_reservations_full
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
    -- Campos del anfitrión (desde alojamiento_caracteristica)
    ac.nombre_anfitrion AS host_name,
    ac.email_anfitrion AS host_email,
    ac.tel_anfitrion AS host_phone,
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
LEFT JOIN checkin c ON r.id = c.reserva_id
LEFT JOIN viajeros v ON c.viajero_id = v.id AND v.responsable = 1;

-- =====================================================
-- 2. Vista v_reservations_with_host
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
    ac.nombre_anfitrion AS host_name,
    ac.email_anfitrion AS host_email,
    ac.tel_anfitrion AS host_phone
FROM reserva r
LEFT JOIN alojamiento a ON r.alojamiento_id = a.idalojamiento
LEFT JOIN alojamiento_caracteristica ac ON a.idalojamiento = ac.idalojamiento;

-- =====================================================
-- 3. Vista v_guests_with_reservation
-- =====================================================
DROP VIEW IF EXISTS v_guests_with_reservation;

CREATE VIEW v_guests_with_reservation AS
SELECT
    v.id,
    c.reserva_id AS reservation_id,
    v.tipo_documento AS document_type,
    v.nvm3r0_d0cvm3nt0 AS document_number,
    v.nacionalidad AS nationality,
    v.n0mbr3s AS first_name,
    v.p3ll1d01 AS last_name,
    v.f3ch4_n4c1m13nt0 AS birth_date,
    v.sexo AS sex,
    v.nvm3r0_t3l3f0n0 AS phone,
    v.m41l AS email,
    v.responsable AS is_responsible,
    1 AS is_registered,
    'web' AS registration_method,
    NULL AS document_image_path,
    1 AS accepted_terms,
    NULL AS accepted_terms_date,
    NULL AS ip_address,
    NULL AS user_agent,
    NULL AS registration_completed_at,
    NULL AS created_at,
    NULL AS updated_at,
    r.localizador_canal AS reservation_code,
    DATE(r.fecha_inicio) AS check_in_date,
    DATE(r.fecha_fin) AS check_out_date,
    a.nombre AS accommodation_name
FROM viajeros v
INNER JOIN checkin c ON v.id = c.viajero_id
INNER JOIN reserva r ON c.reserva_id = r.id
INNER JOIN alojamiento a ON r.alojamiento_id = a.idalojamiento;

-- =====================================================
-- Fin de migración 014
-- =====================================================
