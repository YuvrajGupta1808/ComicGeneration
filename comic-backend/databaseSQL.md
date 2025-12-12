<!-- paste this SQL script directly into MySQL Workbench/ MongoDB: -->

-- Create database (optional)
CREATE DATABASE IF NOT EXISTS comic_generation
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE comic_generation;

-- Main comic request (prompt + high-level info)
CREATE TABLE comics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- Prompt and options
  prompt_text TEXT NOT NULL,
  art_style VARCHAR(50) NULL,
  reference_image_count TINYINT UNSIGNED DEFAULT 0,

  -- Simple status tracking
  status ENUM('pending','generating','completed','failed') DEFAULT 'pending',

  -- Optional flexible metadata (remove if you don't want it)
  metadata JSON NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Every generated image (panels, pages, characters, etc.)
CREATE TABLE comic_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  comic_id BIGINT UNSIGNED NOT NULL,

  -- What this image represents
  image_role ENUM('panel','page','character','cover','preview') NOT NULL,
  panel_id VARCHAR(32) NULL,       -- e.g. 'panel1', 'panel2'
  page_number INT UNSIGNED NULL,   -- for final pages

  -- Storage info
  image_url VARCHAR(512) NOT NULL, -- Cloudinary or other URL
  provider VARCHAR(50) DEFAULT 'cloudinary',
  provider_id VARCHAR(128) NULL,   -- e.g. Cloudinary public_id

  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,

  -- Optional extra info (tool responses, etc.)
  metadata JSON NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_comic_images_comic
    FOREIGN KEY (comic_id)
    REFERENCES comics(id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Optional: simple log of steps for a comic (you can skip this table if not needed)
CREATE TABLE comic_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  comic_id BIGINT UNSIGNED NOT NULL,
  step VARCHAR(64) NOT NULL,   -- e.g. 'generate_panels', 'compose_pages'
  message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_comic_logs_comic
    FOREIGN KEY (comic_id)
    REFERENCES comics(id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Helpful indexes
CREATE INDEX idx_comic_images_comic ON comic_images (comic_id);
CREATE INDEX idx_comic_logs_comic ON comic_logs (comic_id);




<!-- ----------------------------------------------------------------------------------- -->

<!-- To See full stored JSON (prompt + AI response + URLs) -->

USE comic_generation;

SELECT
  id,
  prompt_text,
  JSON_PRETTY(metadata) AS metadata
FROM comics
ORDER BY id DESC
LIMIT 5;
<!-- ------------------------------------------------------------------------------------ -->
