-- ============================================
-- Migración 009: Campos extendidos de huéspedes
-- Fecha: 2025-11-14
-- Propósito: Agregar campos para cumplir normativa policial española
-- ============================================

USE moon_desarrollo;

-- 1. Modificar ENUM de document_type para incluir más tipos
ALTER TABLE guests
MODIFY COLUMN document_type ENUM('DNI', 'NIE', 'NIF', 'CIF', 'PAS', 'OTRO') NOT NULL
COMMENT 'Tipo de documento de identidad';

-- 2. Agregar campos de documento
ALTER TABLE guests
ADD COLUMN second_last_name VARCHAR(100) NULL
    COMMENT 'Segundo apellido (obligatorio para DNI/NIE)',
ADD COLUMN support_number VARCHAR(20) NULL
    COMMENT 'Número de soporte del DNI/NIE',
ADD COLUMN issue_date DATE NULL
    COMMENT 'Fecha de expedición del documento',
ADD COLUMN expiry_date DATE NULL
    COMMENT 'Fecha de vencimiento del documento';

-- 3. Agregar campos de edad y parentesco
ALTER TABLE guests
ADD COLUMN age INT NULL
    COMMENT 'Edad calculada automáticamente desde birth_date',
ADD COLUMN relationship ENUM('AB', 'BA', 'BN', 'CD', 'CY', 'HJ', 'HR', 'NI', 'OT', 'PM', 'SB', 'SG', 'TI', 'TU', 'YN') NULL
    COMMENT 'Parentesco con responsable (obligatorio si edad < 18)';

-- 4. Agregar campos de residencia
ALTER TABLE guests
ADD COLUMN residence_country VARCHAR(3) NULL
    COMMENT 'Código del país de residencia (FK a paises.codiso)',
ADD COLUMN residence_municipality_code VARCHAR(10) NULL
    COMMENT 'Código INE del municipio español (FK a municipios_ine_esp.Ine)',
ADD COLUMN residence_municipality_name VARCHAR(150) NULL
    COMMENT 'Nombre del municipio/ciudad',
ADD COLUMN residence_postal_code VARCHAR(10) NULL
    COMMENT 'Código postal de residencia',
ADD COLUMN residence_address TEXT NULL
    COMMENT 'Dirección completa de residencia';

-- 5. Separar código de país del teléfono
ALTER TABLE guests
ADD COLUMN phone_country_code VARCHAR(10) NULL
    COMMENT 'Código de país del teléfono (ej: +34) - FK a paises.telephone_prefix',
MODIFY COLUMN phone VARCHAR(20) NULL
    COMMENT 'Número de teléfono sin código de país';

-- 6. Crear índices para mejorar rendimiento de búsquedas
ALTER TABLE guests
ADD INDEX idx_residence_country (residence_country),
ADD INDEX idx_residence_municipality (residence_municipality_code),
ADD INDEX idx_age (age),
ADD INDEX idx_expiry_date (expiry_date),
ADD INDEX idx_relationship (relationship);

-- 7. Asegurar índices en tablas relacionadas
-- Agregar PRIMARY KEY a municipios_ine_esp si no existe
ALTER TABLE municipios_ine_esp
ADD PRIMARY KEY (Ine);

-- Agregar índice FULLTEXT para búsqueda rápida de municipios
ALTER TABLE municipios_ine_esp
ADD FULLTEXT INDEX ft_descripcion (Descripcion);

-- Asegurar índice único en paises.codiso si no existe
-- (Solo si no existe ya)
ALTER TABLE paises
ADD UNIQUE INDEX idx_codiso (codiso);

-- 8. Actualizar comentario de tabla guests
ALTER TABLE guests
COMMENT = 'Huéspedes con campos extendidos para normativa policial española';

-- 9. Verificación de la migración
SELECT
    'Migración 009 completada exitosamente' as status,
    (SELECT COUNT(*) FROM municipios_ine_esp) as total_municipios,
    (SELECT COUNT(*) FROM paises) as total_paises,
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'guests'
     AND TABLE_SCHEMA = 'moon_desarrollo') as total_campos_guests;
