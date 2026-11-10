-- Add given_name and family_name columns to persons table
ALTER TABLE persons ADD COLUMN IF NOT EXISTS given_name TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS family_name TEXT;

-- Update RLS policies if needed
-- No changes needed, existing SELECT/INSERT policies apply
