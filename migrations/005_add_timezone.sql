-- Add timezone setting to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Beirut';

-- No RLS changes needed; profiles already has admin policy for updates.
