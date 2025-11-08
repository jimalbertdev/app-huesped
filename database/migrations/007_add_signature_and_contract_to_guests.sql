-- Migration: Add signature_path and contract_path to guests table
-- Date: 2025-11-08
-- Description: Add fields to store signature images and contract PDFs

ALTER TABLE `guests`
ADD COLUMN `signature_path` VARCHAR(255) NULL COMMENT 'Path to signature image file' AFTER `accepted_terms`,
ADD COLUMN `contract_path` VARCHAR(255) NULL COMMENT 'Path to contract PDF (only for responsible guest)' AFTER `signature_path`;

-- Add indexes for better performance
CREATE INDEX `idx_guests_signature` ON `guests` (`signature_path`);
CREATE INDEX `idx_guests_contract` ON `guests` (`contract_path`);
