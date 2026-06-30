-- Migration 0044: Hash magic link tokens
-- Rename `token` column to `tokenHash` and resize to 64 chars (SHA-256 hex)
-- The raw token is no longer stored; only the SHA-256 hex hash is persisted.
-- This was applied directly via SQL (ALTER TABLE) due to drizzle-kit TTY requirement.
-- This file records the change for journal completeness.

ALTER TABLE `magic_links` RENAME COLUMN `token` TO `tokenHash`;
ALTER TABLE `magic_links` MODIFY COLUMN `tokenHash` VARCHAR(64) NOT NULL;
