-- ============================================
-- Migración 018: Agregar campos de contrato a tabla reserva
-- ============================================
-- Descripción: Agrega los campos 'contrato' y 'fecha_contrato' a la tabla reserva
--              para almacenar la ruta del contrato PDF generado y su fecha de creación
-- Fecha: 2025-11-29
-- ============================================

-- Agregar campo para la ruta del contrato PDF
ALTER TABLE reserva 
ADD COLUMN contrato VARCHAR(255) NULL COMMENT 'Ruta del contrato PDF generado' AFTER localizador_canal;

-- Agregar campo para la fecha de generación del contrato
ALTER TABLE reserva 
ADD COLUMN fecha_contrato DATETIME NULL COMMENT 'Fecha y hora de generación del contrato' AFTER contrato;

-- Agregar índice para búsquedas por contrato
ALTER TABLE reserva 
ADD INDEX idx_contrato (contrato);

-- Comentario de finalización
-- Esta migración permite almacenar el contrato directamente en la reserva
-- en lugar de en la tabla de viajeros (guests/viajeros)
