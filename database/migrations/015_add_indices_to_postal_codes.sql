-- Migration: Add indices to codigos_postales_municipios for performance
-- This migration adds indices to optimize postal code queries by municipality

-- Add indices for fast lookups
ALTER TABLE codigos_postales_municipios
ADD INDEX idx_municipio_id (municipio_id),
ADD INDEX idx_codigo_postal (codigo_postal),
ADD INDEX idx_municipio_cp (municipio_id, codigo_postal);

-- Add unique constraint to prevent duplicates
ALTER TABLE codigos_postales_municipios
ADD UNIQUE KEY unique_municipio_cp (municipio_id, codigo_postal);

-- Verify indices were created
SHOW INDEX FROM codigos_postales_municipios;
