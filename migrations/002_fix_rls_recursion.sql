-- Fix infinite recursion in profiles RLS policies
-- Drop recursive policies
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Create security definer functions to check roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'administrator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policy using the function
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (public.is_admin());
