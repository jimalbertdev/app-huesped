-- Migración 011: Agregar campo bunk_beds (literas) a tabla preferences
-- Fecha: 2025-11-16
-- Descripción: Añade soporte para literas en las preferencias de estancia

USE vacanfly_app_huesped_prueba;

-- Agregar columna bunk_beds después de sofa_beds
ALTER TABLE preferences
ADD COLUMN bunk_beds INT DEFAULT 0 AFTER sofa_beds;

-- Verificar que se agregó correctamente
SELECT 'Columna bunk_beds agregada exitosamente a tabla preferences' as resultado;
