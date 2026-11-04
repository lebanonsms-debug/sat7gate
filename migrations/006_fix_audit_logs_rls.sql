-- Fix audit_logs RLS policy
-- Ensure authenticated users can insert logs

-- Drop existing policy
DROP POLICY IF EXISTS "System can insert logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Anon can insert audit logs" ON audit_logs;

-- Allow any authenticated user to insert audit logs
CREATE POLICY "Authenticated can insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
