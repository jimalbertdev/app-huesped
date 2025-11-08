-- Migration: Create view v_reservations_with_host
-- Date: 2025-11-08
-- Description: Create view to map reservation fields for contract generation

CREATE OR REPLACE VIEW v_reservations_with_host AS
SELECT
    r.id,
    r.reservation_code,
    r.check_in_date AS check_in,
    r.check_out_date AS check_out,
    r.total_guests AS num_guests,
    a.name AS property_name,
    a.address AS property_address,
    h.name AS host_name,
    h.email AS host_email,
    h.phone AS host_phone
FROM reservations r
LEFT JOIN accommodations a ON r.accommodation_id = a.id
LEFT JOIN hosts h ON a.host_id = h.id;
