-- ============================================
-- Migración 011: Actualizar vista v_reservations_full
-- Descripción: Actualizar la vista para usar las nuevas tablas viajeros + checkin
-- Autor: Sistema
-- Fecha: 2024-11-16
-- ============================================

-- Eliminar vista anterior
DROP VIEW IF EXISTS v_reservations_full;

-- Crear vista actualizada usando viajeros + checkin
CREATE OR REPLACE VIEW v_reservations_full AS
SELECT
    r.*,
    a.name as accommodation_name,
    a.address,
    a.city,
    h.name as host_name,
    h.email as host_email,
    h.phone as host_phone,
    v.n0mbr3s as responsible_first_name,
    v.p3ll1d01 as responsible_last_name,
    v.m41l as responsible_email
FROM reservations r
JOIN accommodations a ON r.accommodation_id = a.id
JOIN hosts h ON a.host_id = h.id
LEFT JOIN checkin c ON c.reserva_id = r.id
LEFT JOIN viajeros v ON v.id = c.viajero_id AND v.responsable = 1;

-- Nota: La vista ahora usa la tabla viajeros y checkin en lugar de guests
-- El campo responsable en viajeros indica quién es el huésped responsable
