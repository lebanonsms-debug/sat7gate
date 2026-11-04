-- Fix RLS policies for persons table
-- Add missing UPDATE and DELETE policies for staff

-- Staff can update persons
CREATE POLICY "Staff can update persons" ON persons FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Staff can delete persons
CREATE POLICY "Staff can delete persons" ON persons FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);
