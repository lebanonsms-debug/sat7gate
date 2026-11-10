
-- Add company column to persons table
ALTER TABLE persons ADD COLUMN IF NOT EXISTS company TEXT;
