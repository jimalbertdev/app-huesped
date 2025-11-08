-- ============================================
-- VACANFLY - ESQUEMA DE BASE DE DATOS
-- Base de datos: moon_desarrollo
-- ============================================

-- Tabla de anfitriones/propietarios
CREATE TABLE IF NOT EXISTS hosts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    available_24_7 BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de alojamientos
CREATE TABLE IF NOT EXISTS accommodations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    host_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'España',
    building_code VARCHAR(20) COMMENT 'Código de acceso al edificio',
    wifi_name VARCHAR(100),
    wifi_password VARCHAR(100),
    check_in_time TIME DEFAULT '15:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    max_guests INT DEFAULT 4,
    total_beds INT DEFAULT 2,
    amenities TEXT COMMENT 'JSON con amenidades disponibles',
    house_rules TEXT COMMENT 'Normas de la casa',
    how_to_arrive TEXT COMMENT 'Instrucciones de llegada',
    how_things_work TEXT COMMENT 'Cómo funcionan las cosas',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE,
    INDEX idx_host (host_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accommodation_id INT NOT NULL,
    reservation_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Ej: RES-2024-001',
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    check_in_time TIME DEFAULT '15:00:00',
    total_guests INT NOT NULL,
    registered_guests INT DEFAULT 0,
    responsible_guest_id INT NULL COMMENT 'ID del huésped responsable',
    status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
    all_guests_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
    INDEX idx_accommodation (accommodation_id),
    INDEX idx_code (reservation_code),
    INDEX idx_dates (check_in_date, check_out_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de huéspedes
CREATE TABLE IF NOT EXISTS guests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,

    -- Datos del documento
    document_type ENUM('dni', 'nie', 'passport', 'other') NOT NULL,
    document_number VARCHAR(50) NOT NULL,
    nationality VARCHAR(50) NOT NULL,

    -- Datos personales
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    sex ENUM('m', 'f', 'other', 'prefer-not') NOT NULL,

    -- Datos de contacto
    phone VARCHAR(20),
    email VARCHAR(100),

    -- Indicadores
    is_responsible BOOLEAN DEFAULT FALSE,
    is_registered BOOLEAN DEFAULT TRUE,
    registration_method ENUM('scan', 'manual') DEFAULT 'manual',
    document_image_path VARCHAR(255) COMMENT 'Ruta de la imagen del documento',

    -- Consentimientos
    accepted_terms BOOLEAN DEFAULT FALSE,
    accepted_terms_date TIMESTAMP NULL,

    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    registration_completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    INDEX idx_reservation (reservation_id),
    INDEX idx_document (document_number),
    INDEX idx_responsible (is_responsible),
    UNIQUE KEY unique_guest_reservation (reservation_id, document_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Actualizar la FK de responsible_guest_id en reservations
ALTER TABLE reservations
ADD CONSTRAINT fk_responsible_guest
FOREIGN KEY (responsible_guest_id) REFERENCES guests(id) ON DELETE SET NULL;

-- Tabla de preferencias de estancia
CREATE TABLE IF NOT EXISTS preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL UNIQUE,

    -- Configuración de camas
    needs_crib BOOLEAN DEFAULT FALSE,
    double_beds INT DEFAULT 0,
    single_beds INT DEFAULT 0,
    sofa_beds INT DEFAULT 0,

    -- Hora de llegada
    estimated_arrival_time TIME NULL,

    -- Información adicional
    additional_info TEXT,
    allergies TEXT,
    special_requests TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    INDEX idx_reservation (reservation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de apertura de puertas
CREATE TABLE IF NOT EXISTS door_unlocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    guest_id INT NULL,

    door_type ENUM('portal', 'accommodation') NOT NULL,
    success BOOLEAN NOT NULL,
    unlock_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Detalles técnicos
    ip_address VARCHAR(45),
    device_info TEXT,
    error_message TEXT NULL COMMENT 'Si falló, mensaje de error',

    INDEX idx_reservation (reservation_id),
    INDEX idx_guest (guest_id),
    INDEX idx_date (unlock_time),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de incidencias/sugerencias/quejas
CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    guest_id INT NULL,

    incident_type ENUM('complaint', 'suggestion', 'maintenance', 'emergency') NOT NULL,
    title VARCHAR(200),
    description TEXT NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',

    -- Respuesta
    response TEXT NULL,
    resolved_by INT NULL COMMENT 'ID del host que resolvió',
    resolved_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL,
    INDEX idx_reservation (reservation_id),
    INDEX idx_status (status),
    INDEX idx_type (incident_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de videos de bienvenida
CREATE TABLE IF NOT EXISTS welcome_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accommodation_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,
    description TEXT,
    video_url VARCHAR(255) NOT NULL,
    video_type ENUM('youtube', 'vimeo', 'local') DEFAULT 'youtube',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
    INDEX idx_accommodation (accommodation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de guía local
CREATE TABLE IF NOT EXISTS local_guide_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accommodation_id INT NOT NULL,

    category ENUM('restaurants', 'cafes', 'supermarkets', 'transport', 'tourist', 'emergency', 'entertainment') NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    distance VARCHAR(20) COMMENT 'Ej: 500m, 2km',
    rating DECIMAL(2,1) COMMENT 'Ej: 4.8',
    address VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    maps_url VARCHAR(500),

    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
    INDEX idx_accommodation (accommodation_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de idiomas preferidos por reserva
CREATE TABLE IF NOT EXISTS reservation_languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL UNIQUE,
    language_code VARCHAR(5) DEFAULT 'es' COMMENT 'es, en, ca, fr, de, nl',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS DE EJEMPLO / SEED DATA
-- ============================================

-- Insertar un anfitrión de ejemplo
INSERT INTO hosts (name, email, phone, available_24_7) VALUES
('María García', 'maria@casavistahermosa.com', '+34 612 345 678', TRUE);

-- Insertar un alojamiento de ejemplo
INSERT INTO accommodations (
    host_id, name, address, city, postal_code, building_code,
    wifi_name, wifi_password, check_in_time, check_out_time,
    max_guests, total_beds, house_rules, how_to_arrive, how_things_work
) VALUES (
    1,
    'Casa Vista Hermosa',
    'Calle Principal 123',
    'Barcelona',
    '08001',
    '1234#',
    'CasaVH',
    'hermosa2024',
    '15:00:00',
    '11:00:00',
    6,
    4,
    'Check-in: 15:00 - Check-out: 11:00\nNo fumar en el interior\nNo fiestas ni eventos\nRespetar el silencio 22:00-08:00',
    'Desde el aeropuerto: Toma el metro línea 3 hasta la estación Central (30 min)\nEn coche: Parking disponible en calle lateral\nCódigo de acceso al edificio: 1234#',
    'WiFi: Red CasaVH | Contraseña: hermosa2024\nCalefacción: Panel táctil en salón, temperatura recomendada 21°C\nTV: Netflix y Prime Video ya configurados'
);

-- Insertar una reserva de ejemplo
INSERT INTO reservations (
    accommodation_id, reservation_code, check_in_date, check_out_date,
    total_guests, registered_guests, status
) VALUES (
    1,
    'RES-2024-001',
    '2024-11-15',
    '2024-11-18',
    3,
    0,
    'confirmed'
);

-- Insertar videos de bienvenida de ejemplo
INSERT INTO welcome_videos (accommodation_id, title, description, video_url, order_index) VALUES
(1, 'Tour Virtual del Alojamiento', 'Recorrido completo por Casa Vista Hermosa', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1),
(1, 'Cómo Usar las Amenidades', 'Guía de uso de electrodomésticos y servicios', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2),
(1, 'Guía de la Zona y Lugares de Interés', 'Descubre los mejores lugares cercanos', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 3);

-- Insertar items de guía local de ejemplo
INSERT INTO local_guide_items (accommodation_id, category, name, description, distance, rating, order_index) VALUES
-- Restaurantes
(1, 'restaurants', 'La Terraza del Mar', 'Cocina mediterránea con vistas al mar', '500m', 4.8, 1),
(1, 'restaurants', 'El Rincón Tradicional', 'Tapas y platos típicos españoles', '300m', 4.6, 2),
(1, 'restaurants', 'Pizzería Bella Napoli', 'Auténtica pizza italiana', '700m', 4.7, 3),

-- Cafeterías
(1, 'cafes', 'Café Central', 'Café de especialidad y repostería', '200m', 4.5, 1),
(1, 'cafes', 'La Bohème', 'Ambiente acogedor, wifi gratis', '400m', 4.4, 2),

-- Supermercados
(1, 'supermarkets', 'Mercadona', 'Supermercado de confianza', '600m', 4.2, 1),
(1, 'supermarkets', 'Carrefour Express', 'Abierto hasta las 22:00', '350m', 4.0, 2),

-- Transporte
(1, 'transport', 'Estación de Metro L3', 'Acceso directo al centro', '800m', NULL, 1),
(1, 'transport', 'Parada de Bus 24/7', 'Líneas 15, 42, 87', '150m', NULL, 2),

-- Lugares turísticos
(1, 'tourist', 'Mirador Vista Hermosa', 'Vistas panorámicas de la ciudad', '1.2km', 4.9, 1),
(1, 'tourist', 'Museo de Arte Moderno', 'Exposiciones contemporáneas', '2km', 4.7, 2),
(1, 'tourist', 'Playa del Sol', 'Arena dorada y aguas cristalinas', '3km', 4.8, 3),

-- Emergencias
(1, 'emergency', 'Hospital General', 'Urgencias 24h: +34 112', '2.5km', NULL, 1),
(1, 'emergency', 'Farmacia 24h', 'Servicio nocturno disponible', '400m', NULL, 2),
(1, 'emergency', 'Policía Local', 'Emergencias: 112', '1km', NULL, 3),

-- Entretenimiento
(1, 'entertainment', 'Cinema Multiplex', 'Últimos estrenos', '1.5km', 4.3, 1),
(1, 'entertainment', 'Teatro Municipal', 'Espectáculos en vivo', '2.2km', 4.6, 2),
(1, 'entertainment', 'Club Nocturno Luna', 'Música en vivo los fines de semana', '1.8km', 4.4, 3);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de reservas con información completa
CREATE OR REPLACE VIEW v_reservations_full AS
SELECT
    r.*,
    a.name as accommodation_name,
    a.address,
    a.city,
    h.name as host_name,
    h.email as host_email,
    h.phone as host_phone,
    g.first_name as responsible_first_name,
    g.last_name as responsible_last_name,
    g.email as responsible_email
FROM reservations r
JOIN accommodations a ON r.accommodation_id = a.id
JOIN hosts h ON a.host_id = h.id
LEFT JOIN guests g ON r.responsible_guest_id = g.id;

-- Vista de huéspedes con información de reserva
CREATE OR REPLACE VIEW v_guests_with_reservation AS
SELECT
    g.*,
    r.reservation_code,
    r.check_in_date,
    r.check_out_date,
    a.name as accommodation_name
FROM guests g
JOIN reservations r ON g.reservation_id = r.id
JOIN accommodations a ON r.accommodation_id = a.id;
