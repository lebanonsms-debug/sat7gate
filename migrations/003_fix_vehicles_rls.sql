-- Fix RLS policies for vehicles table
-- Current: only INSERT policy exists, missing UPDATE and DELETE

-- Drop existing incomplete policy if it exists
DROP POLICY IF EXISTS "Staff can manage vehicles" ON vehicles;

-- Staff can insert vehicles
CREATE POLICY "Staff can insert vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Staff can update vehicles
CREATE POLICY "Staff can update vehicles" ON vehicles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Staff can delete vehicles
CREATE POLICY "Staff can delete vehicles" ON vehicles FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);
