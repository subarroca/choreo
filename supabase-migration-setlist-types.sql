-- Migration: Setlist item types (text, indication)
-- Add type, body, and speakers fields to songs table

ALTER TABLE songs ADD COLUMN IF NOT EXISTS type text DEFAULT 'song';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS speakers text; -- JSON array of member IDs

-- Update existing rows to have explicit type
UPDATE songs SET type = 'song' WHERE type IS NULL;
