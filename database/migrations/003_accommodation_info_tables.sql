-- =====================================================
-- Migración: Tablas para información de alojamiento
-- Fecha: 2025-11-09
-- Descripción: Tablas para almacenar información del alojamiento,
--              videos de bienvenida y guía local
-- =====================================================

-- Tabla: accommodation_info
-- Almacena información general del alojamiento
CREATE TABLE IF NOT EXISTS accommodation_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accommodation_id INT NOT NULL,

    -- Cómo llegar
    how_to_arrive_airport TEXT NULL COMMENT 'Indicaciones desde el aeropuerto',
    how_to_arrive_car TEXT NULL COMMENT 'Indicaciones en coche',
    building_access_code VARCHAR(50) NULL COMMENT 'Código de acceso al edificio',

    -- Amenidades
    amenities TEXT NULL COMMENT 'Lista de amenidades disponibles (separadas por coma)',

    -- Cómo funciona
    wifi_network VARCHAR(100) NULL COMMENT 'Nombre de red WiFi',
    wifi_password VARCHAR(100) NULL COMMENT 'Contraseña WiFi',
    heating_info TEXT NULL COMMENT 'Información sobre la calefacción',
    tv_info TEXT NULL COMMENT 'Información sobre la TV',
    other_instructions TEXT NULL COMMENT 'Otras instrucciones',

    -- Normas
    check_in_time VARCHAR(20) NULL DEFAULT '15:00' COMMENT 'Hora de check-in',
    check_out_time VARCHAR(20) NULL DEFAULT '11:00' COMMENT 'Hora de check-out',
    rules TEXT NULL COMMENT 'Normas del alojamiento (JSON array)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_accommodation (accommodation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: accommodation_videos
-- Almacena videos de bienvenida del alojamiento
CREATE TABLE IF NOT EXISTS accommodation_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accommodation_id INT NOT NULL,
    title VARCHAR(200) NOT NULL COMMENT 'Título del video',
    description TEXT NULL COMMENT 'Descripción del video',
    video_url VARCHAR(500) NOT NULL COMMENT 'URL del video (YouTube, Vimeo, etc)',
    video_type ENUM('youtube', 'vimeo', 'other') DEFAULT 'youtube',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Orden de visualización',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=activo, 0=inactivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
    INDEX idx_accommodation_order (accommodation_id, display_order),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: accommodation_guide_categories
-- Categorías de la guía local (restaurantes, cafés, etc)
CREATE TABLE IF NOT EXISTS accommodation_guide_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_key VARCHAR(50) NOT NULL COMMENT 'Clave única de la categoría (restaurants, cafes, etc)',
    title_es VARCHAR(100) NOT NULL COMMENT 'Título en español',
    title_en VARCHAR(100) NOT NULL COMMENT 'Título en inglés',
    title_fr VARCHAR(100) NOT NULL COMMENT 'Título en francés',
    icon VARCHAR(50) NULL COMMENT 'Icono emoji o clase',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Orden de visualización',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=activo, 0=inactivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_category_key (category_key),
    INDEX idx_order (display_order),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: accommodation_guide_items
-- Items específicos de la guía local por alojamiento
CREATE TABLE IF NOT EXISTS accommodation_guide_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accommodation_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL COMMENT 'Nombre del lugar',
    description TEXT NULL COMMENT 'Descripción del lugar',
    distance VARCHAR(50) NULL COMMENT 'Distancia desde el alojamiento',
    rating VARCHAR(20) NULL COMMENT 'Calificación (ej: 4.5⭐)',
    address TEXT NULL COMMENT 'Dirección completa',
    phone VARCHAR(50) NULL COMMENT 'Teléfono de contacto',
    website VARCHAR(300) NULL COMMENT 'Sitio web',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Orden de visualización',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=activo, 0=inactivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES accommodation_guide_categories(id) ON DELETE CASCADE,
    INDEX idx_accommodation_category (accommodation_id, category_id),
    INDEX idx_order (display_order),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insertar categorías predeterminadas de la guía local
-- =====================================================
INSERT INTO accommodation_guide_categories (category_key, title_es, title_en, title_fr, icon, display_order) VALUES
('restaurants', '🍽️ Restaurantes', '🍽️ Restaurants', '🍽️ Restaurants', '🍽️', 1),
('cafes', '☕ Cafeterías', '☕ Cafés', '☕ Cafés', '☕', 2),
('supermarkets', '🛒 Supermercados', '🛒 Supermarkets', '🛒 Supermarchés', '🛒', 3),
('transport', '🚇 Transporte', '🚇 Transport', '🚇 Transports', '🚇', 4),
('tourist', '🏛️ Lugares Turísticos', '🏛️ Tourist Attractions', '🏛️ Attractions Touristiques', '🏛️', 5),
('emergency', '🚑 Emergencias', '🚑 Emergency Services', '🚑 Services d\'urgence', '🚑', 6),
('entertainment', '🎭 Entretenimiento', '🎭 Entertainment', '🎭 Divertissement', '🎭', 7)
ON DUPLICATE KEY UPDATE
    title_es = VALUES(title_es),
    title_en = VALUES(title_en),
    title_fr = VALUES(title_fr),
    icon = VALUES(icon),
    display_order = VALUES(display_order);

-- =====================================================
-- Datos de ejemplo para el alojamiento ID 1
-- =====================================================

-- Información del alojamiento
INSERT INTO accommodation_info (
    accommodation_id,
    how_to_arrive_airport,
    how_to_arrive_car,
    building_access_code,
    amenities,
    wifi_network,
    wifi_password,
    heating_info,
    tv_info,
    other_instructions,
    check_in_time,
    check_out_time,
    rules
) VALUES (
    1,
    'Desde el aeropuerto: Toma el metro línea 3 hasta la estación Central (30 min)',
    'En coche: Parking disponible en calle lateral',
    '1234#',
    'WiFi, Cocina completa, TV Smart, Aire acondicionado, Calefacción, Secador, Plancha, Lavadora',
    'CasaVH',
    'hermosa2024',
    'Panel táctil en salón, temperatura recomendada 21°C',
    'Netflix y Prime Video ya configurados',
    NULL,
    '15:00',
    '11:00',
    '["No fumar en el interior", "No fiestas ni eventos", "Respetar el silencio 22:00-08:00"]'
) ON DUPLICATE KEY UPDATE
    how_to_arrive_airport = VALUES(how_to_arrive_airport),
    how_to_arrive_car = VALUES(how_to_arrive_car),
    building_access_code = VALUES(building_access_code),
    amenities = VALUES(amenities),
    wifi_network = VALUES(wifi_network),
    wifi_password = VALUES(wifi_password),
    heating_info = VALUES(heating_info),
    tv_info = VALUES(tv_info),
    check_in_time = VALUES(check_in_time),
    check_out_time = VALUES(check_out_time),
    rules = VALUES(rules);

-- Videos de bienvenida
INSERT INTO accommodation_videos (accommodation_id, title, description, video_url, video_type, display_order) VALUES
(1, 'Tour Virtual del Alojamiento', 'Conoce cada rincón de tu alojamiento antes de llegar', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 1),
(1, 'Cómo Usar las Amenidades', 'Guía paso a paso para usar todos los servicios disponibles', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 2),
(1, 'Guía de la Zona y Lugares de Interés', 'Descubre los mejores lugares cerca de tu alojamiento', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 3)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    video_url = VALUES(video_url),
    display_order = VALUES(display_order);

-- Items de la guía local
-- Restaurantes
INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'La Terraza del Mar', 'Cocina mediterránea con vistas al mar', '500m', '4.8⭐', 1
FROM accommodation_guide_categories WHERE category_key = 'restaurants';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'El Rincón Tradicional', 'Tapas y platos típicos españoles', '300m', '4.6⭐', 2
FROM accommodation_guide_categories WHERE category_key = 'restaurants';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Pizzería Bella Napoli', 'Auténtica pizza italiana', '700m', '4.7⭐', 3
FROM accommodation_guide_categories WHERE category_key = 'restaurants';

-- Cafeterías
INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Café Central', 'Café de especialidad y repostería', '200m', '4.5⭐', 1
FROM accommodation_guide_categories WHERE category_key = 'cafes';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'La Bohème', 'Ambiente acogedor, wifi gratis', '400m', '4.4⭐', 2
FROM accommodation_guide_categories WHERE category_key = 'cafes';

-- Supermercados
INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Mercadona', 'Supermercado de confianza', '600m', '4.2⭐', 1
FROM accommodation_guide_categories WHERE category_key = 'supermarkets';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Carrefour Express', 'Abierto hasta las 22:00', '350m', '4.0⭐', 2
FROM accommodation_guide_categories WHERE category_key = 'supermarkets';

-- Transporte
INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Estación de Metro L3', 'Acceso directo al centro', '800m', '', 1
FROM accommodation_guide_categories WHERE category_key = 'transport';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Parada de Bus 24/7', 'Líneas 15, 42, 87', '150m', '', 2
FROM accommodation_guide_categories WHERE category_key = 'transport';

-- Lugares turísticos
INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Mirador Vista Hermosa', 'Vistas panorámicas de la ciudad', '1.2km', '4.9⭐', 1
FROM accommodation_guide_categories WHERE category_key = 'tourist';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Museo de Arte Moderno', 'Exposiciones contemporáneas', '2km', '4.7⭐', 2
FROM accommodation_guide_categories WHERE category_key = 'tourist';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Playa del Sol', 'Arena dorada y aguas cristalinas', '3km', '4.8⭐', 3
FROM accommodation_guide_categories WHERE category_key = 'tourist';

-- Emergencias
INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Hospital General', 'Urgencias 24h: +34 112', '2.5km', '', 1
FROM accommodation_guide_categories WHERE category_key = 'emergency';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Farmacia 24h', 'Servicio nocturno disponible', '400m', '', 2
FROM accommodation_guide_categories WHERE category_key = 'emergency';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Policía Local', 'Emergencias: 112', '1km', '', 3
FROM accommodation_guide_categories WHERE category_key = 'emergency';

-- Entretenimiento
INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Cinema Multiplex', 'Últimos estrenos', '1.5km', '4.3⭐', 1
FROM accommodation_guide_categories WHERE category_key = 'entertainment';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Teatro Municipal', 'Espectáculos en vivo', '2.2km', '4.6⭐', 2
FROM accommodation_guide_categories WHERE category_key = 'entertainment';

INSERT INTO accommodation_guide_items (accommodation_id, category_id, name, description, distance, rating, display_order)
SELECT 1, id, 'Club Nocturno Luna', 'Música en vivo los fines de semana', '1.8km', '4.4⭐', 3
FROM accommodation_guide_categories WHERE category_key = 'entertainment';
