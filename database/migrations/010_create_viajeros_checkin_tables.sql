-- ============================================
-- Migración 010: Tablas viajeros y checkin
-- Fecha: 2025-11-15
-- Propósito: Crear nuevas tablas para gestión de huéspedes
--            con campos ofuscados y relación con reservas
-- ============================================

-- NOTA: La base de datos se selecciona automáticamente desde .env
-- DB_NAME=vacanfly_app_huesped_prueba

-- ============================================
-- 1. CREAR TABLA VIAJEROS
-- ============================================
CREATE TABLE IF NOT EXISTS viajeros (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Datos de contacto
    nvm3r0_t3l3f0n0 VARCHAR(20) NULL COMMENT 'Número de teléfono',
    country_code VARCHAR(10) NULL COMMENT 'Código de país del teléfono (ej: +34)',
    m41l VARCHAR(255) NULL COMMENT 'Correo electrónico',

    -- Datos personales
    n0mbr3s VARCHAR(100) NOT NULL COMMENT 'Nombres',
    p3ll1d01 VARCHAR(100) NOT NULL COMMENT 'Primer apellido',
    p3ll1d02 VARCHAR(100) NULL COMMENT 'Segundo apellido (obligatorio para DNI/NIE)',
    f3ch4_n4c1m13nt0 DATE NOT NULL COMMENT 'Fecha de nacimiento',
    edad INT NULL COMMENT 'Edad calculada automáticamente',
    sexo ENUM('m', 'f', 'other', 'prefer-not') NOT NULL COMMENT 'Sexo',
    tipo ENUM('niño', 'adolescente', 'adulto') NULL COMMENT 'Tipo calculado según edad',
    nacionalidad VARCHAR(3) NOT NULL COMMENT 'Código ISO del país de nacionalidad',

    -- Documento de identidad
    tipo_documento ENUM('DNI', 'NIE', 'PAS', 'OTRO') NOT NULL COMMENT 'Tipo de documento',
    nvm3r0_d0cvm3nt0 VARCHAR(20) NOT NULL COMMENT 'Número de documento',
    n_soporte VARCHAR(20) NULL COMMENT 'Número de soporte del DNI/NIE',
    f3ch4_3xp3d1c10n DATE NULL COMMENT 'Fecha de expedición del documento',
    f3ch4_v3nc1m13nt0 DATE NULL COMMENT 'Fecha de vencimiento del documento',

    -- Parentesco y responsabilidad
    parentesco ENUM('AB', 'BA', 'BN', 'CD', 'CY', 'HJ', 'HR', 'NI', 'OT', 'PM', 'SB', 'SG', 'TI', 'TU', 'YN') NULL
        COMMENT 'Parentesco con responsable (obligatorio si edad < 18)',
    responsable TINYINT(1) DEFAULT 0 COMMENT '¿Es el responsable principal de la reserva?',

    -- Dirección de residencia
    d1r_p41s VARCHAR(3) NULL COMMENT 'Código ISO del país de residencia',
    cod_municipio_esp VARCHAR(10) NULL COMMENT 'Código INE del municipio español',
    cod_municipio_otro VARCHAR(150) NULL COMMENT 'Nombre del municipio/ciudad (países no españoles)',
    c0d_p0st4l VARCHAR(10) NULL COMMENT 'Código postal',
    d1r3cc10n TEXT NULL COMMENT 'Dirección completa de residencia',

    -- Estado y control interno
    estatus VARCHAR(50) DEFAULT 'Registrado' COMMENT 'Estado del registro (gestionado por otro departamento)',
    observacion TEXT NULL COMMENT 'Observaciones de anfitriones (uso interno)',

    -- Documentos y firma
    firma TEXT NULL COMMENT 'Ruta de la imagen de firma digital',
    contract_path TEXT NULL COMMENT 'Ruta del contrato generado (temporal, se moverá a tabla reservas)',

    -- Metadatos de registro
    registration_method ENUM('scan', 'manual') DEFAULT 'manual' COMMENT 'Método de registro',
    accepted_terms TINYINT(1) DEFAULT 1 COMMENT 'Aceptación de términos y condiciones',
    accepted_terms_date DATETIME NULL COMMENT 'Fecha y hora de aceptación de términos',
    ip_address VARCHAR(45) NULL COMMENT 'Dirección IP del registro',
    user_agent TEXT NULL COMMENT 'User agent del navegador',
    registration_completed_at DATETIME NULL COMMENT 'Fecha y hora de registro completado',
    is_registered TINYINT(1) DEFAULT 1 COMMENT 'Flag de registro completado',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',

    -- Índices para mejorar rendimiento
    INDEX idx_documento (tipo_documento, nvm3r0_d0cvm3nt0),
    INDEX idx_email (m41l),
    INDEX idx_edad (edad),
    INDEX idx_tipo (tipo),
    INDEX idx_estatus (estatus),
    INDEX idx_nacionalidad (nacionalidad),
    INDEX idx_pais_residencia (d1r_p41s),
    INDEX idx_responsable (responsable),
    INDEX idx_fecha_nacimiento (f3ch4_n4c1m13nt0),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de viajeros/huéspedes con campos ofuscados para seguridad';

-- ============================================
-- 2. CREAR TABLA CHECKIN
-- ============================================
CREATE TABLE IF NOT EXISTS checkin (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    reserva_id INT NOT NULL COMMENT 'ID de la reserva',
    viajero_id INT NOT NULL COMMENT 'ID del viajero/huésped',

    -- Control de orden
    orden INT NOT NULL DEFAULT 1 COMMENT 'Orden de registro del huésped (1, 2, 3...)',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del checkin',

    -- Foreign Keys
    FOREIGN KEY (reserva_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (viajero_id) REFERENCES viajeros(id) ON DELETE CASCADE,

    -- Índices
    INDEX idx_reserva (reserva_id),
    INDEX idx_viajero (viajero_id),
    INDEX idx_orden (reserva_id, orden),

    -- Constraint único: un viajero no puede estar dos veces en la misma reserva
    UNIQUE KEY unique_viajero_reserva (reserva_id, viajero_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de relación entre reservas y viajeros (checkin)';

-- ============================================
-- 3. MIGRAR DATOS EXISTENTES (OPCIONAL)
-- ============================================
-- Si quieres migrar datos de la tabla guests a viajeros, descomenta:

/*
INSERT INTO viajeros (
    nvm3r0_t3l3f0n0, country_code, m41l, n0mbr3s, p3ll1d01, p3ll1d02,
    f3ch4_n4c1m13nt0, edad, sexo, tipo, nacionalidad,
    tipo_documento, nvm3r0_d0cvm3nt0, n_soporte,
    f3ch4_3xp3d1c10n, f3ch4_v3nc1m13nt0,
    parentesco, responsable,
    d1r_p41s, cod_municipio_esp, cod_municipio_otro,
    c0d_p0st4l, d1r3cc10n,
    estatus, firma, contract_path,
    registration_method, accepted_terms, accepted_terms_date,
    ip_address, user_agent, registration_completed_at,
    is_registered, created_at
)
SELECT
    phone,
    phone_country_code,
    email,
    first_name,
    last_name,
    second_last_name,
    birth_date,
    age,
    sex,
    CASE
        WHEN age < 12 THEN 'niño'
        WHEN age < 18 THEN 'adolescente'
        ELSE 'adulto'
    END as tipo,
    nationality,
    document_type,
    document_number,
    support_number,
    issue_date,
    expiry_date,
    relationship,
    is_responsible,
    residence_country,
    CASE WHEN residence_country = 'ES' THEN residence_municipality_code ELSE NULL END,
    CASE WHEN residence_country != 'ES' THEN residence_municipality_name ELSE NULL END,
    residence_postal_code,
    residence_address,
    'Registrado' as estatus,
    signature_path,
    contract_path,
    registration_method,
    accepted_terms,
    accepted_terms_date,
    ip_address,
    user_agent,
    registration_completed_at,
    is_registered,
    created_at
FROM guests
WHERE is_registered = 1;

-- Crear registros de checkin para los viajeros migrados
INSERT INTO checkin (reserva_id, viajero_id, orden)
SELECT
    g.reservation_id,
    v.id,
    ROW_NUMBER() OVER (PARTITION BY g.reservation_id ORDER BY g.is_responsible DESC, g.created_at ASC) as orden
FROM guests g
INNER JOIN viajeros v ON v.nvm3r0_d0cvm3nt0 = g.document_number
WHERE g.is_registered = 1;
*/

-- ============================================
-- 4. CREAR VISTA PARA COMPATIBILIDAD
-- ============================================
-- Vista que simula la estructura antigua para reportes legacy

CREATE OR replace VIEW v_guests_formatted AS
SELECT
    v.id,
    c.reserva_id as reservation_id,
    v.nvm3r0_t3l3f0n0 as phone,
    v.country_code as phone_country_code,
    v.m41l as email,
    v.n0mbr3s as first_name,
    v.p3ll1d01 as last_name,
    v.p3ll1d02 as second_last_name,
    v.f3ch4_n4c1m13nt0 as birth_date,
    v.edad as age,
    v.sexo as sex,
    v.tipo,
    v.nacionalidad as nationality,
    v.tipo_documento as document_type,
    v.nvm3r0_d0cvm3nt0 as document_number,
    v.n_soporte as support_number,
    v.f3ch4_3xp3d1c10n as issue_date,
    v.f3ch4_v3nc1m13nt0 as expiry_date,
    v.parentesco as relationship,
    v.responsable as is_responsible,
    v.d1r_p41s as residence_country,
    v.cod_municipio_esp as residence_municipality_code,
    v.cod_municipio_otro as residence_municipality_name,
    v.c0d_p0st4l as residence_postal_code,
    v.d1r3cc10n as residence_address,
    v.estatus,
    v.observacion,
    v.firma as signature_path,
    v.contract_path,
    v.registration_method,
    v.accepted_terms,
    v.accepted_terms_date,
    v.ip_address,
    v.user_agent,
    v.registration_completed_at,
    v.is_registered,
    v.created_at,
    v.updated_at,
    c.orden
FROM viajeros v
LEFT JOIN checkin c ON v.id = c.viajero_id
ORDER BY c.reserva_id, c.orden;

-- ============================================
-- 5. TRIGGERS PARA CÁLCULOS AUTOMÁTICOS
-- ============================================

-- Trigger: Calcular edad y tipo antes de insertar
DELIMITER $$

CREATE TRIGGER before_viajero_insert
BEFORE INSERT ON viajeros
FOR EACH ROW
BEGIN
    -- Calcular edad
    IF NEW.f3ch4_n4c1m13nt0 IS NOT NULL THEN
        SET NEW.edad = TIMESTAMPDIFF(YEAR, NEW.f3ch4_n4c1m13nt0, CURDATE());

        -- Calcular tipo según edad
        IF NEW.edad < 12 THEN
            SET NEW.tipo = 'niño';
        ELSEIF NEW.edad < 18 THEN
            SET NEW.tipo = 'adolescente';
        ELSE
            SET NEW.tipo = 'adulto';
        END IF;
    END IF;

    -- Asegurar estatus por defecto
    IF NEW.estatus IS NULL OR NEW.estatus = '' THEN
        SET NEW.estatus = 'Registrado';
    END IF;
END$$

-- Trigger: Recalcular edad y tipo antes de actualizar
CREATE TRIGGER before_viajero_update
BEFORE UPDATE ON viajeros
FOR EACH ROW
BEGIN
    -- Recalcular edad si cambió la fecha de nacimiento
    IF NEW.f3ch4_n4c1m13nt0 != OLD.f3ch4_n4c1m13nt0 OR NEW.f3ch4_n4c1m13nt0 IS NOT NULL THEN
        SET NEW.edad = TIMESTAMPDIFF(YEAR, NEW.f3ch4_n4c1m13nt0, CURDATE());

        -- Recalcular tipo según edad
        IF NEW.edad < 12 THEN
            SET NEW.tipo = 'niño';
        ELSEIF NEW.edad < 18 THEN
            SET NEW.tipo = 'adolescente';
        ELSE
            SET NEW.tipo = 'adulto';
        END IF;
    END IF;
END$$

DELIMITER ;

-- ============================================
-- 6. VERIFICACIÓN DE LA MIGRACIÓN
-- ============================================
SELECT
    'Migración 010 completada exitosamente' as status,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = 'moon_desarrollo' AND TABLE_NAME = 'viajeros') as tabla_viajeros_creada,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = 'moon_desarrollo' AND TABLE_NAME = 'checkin') as tabla_checkin_creada,
    (SELECT COUNT(*) FROM viajeros) as total_viajeros,
    (SELECT COUNT(*) FROM checkin) as total_checkins;
