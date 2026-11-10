-- Add shift column to profiles table
-- Shift can be 'day' or 'night' for security officers

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('security_officer', 'administrator', 'management', 'viewer')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shift TEXT DEFAULT 'day' CHECK (shift IN ('night', 'day'))
);

-- Add shift column to existing profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shift TEXT DEFAULT 'day' CHECK (shift IN ('night', 'day'));

-- Update RLS policies to include shift
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Security officers can read their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Admins can manage profiles (including shift)
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrator')
);

-- Security officers can manage security officers (including their own shift)
CREATE POLICY "Security officers can manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Seed existing users with default shift
INSERT INTO profiles (id, full_name, email, role, shift)
SELECT id, full_name, email, role, 'day'
FROM profiles
WHERE shift IS NULL;
