
-- SAT7 GATE Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('security_officer', 'administrator', 'management', 'viewer')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  identifier TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#22d3ee',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Persons (employees, guests, etc.)
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  person_category TEXT NOT NULL CHECK (person_category IN ('employee', 'guest', 'rental_company', 'delivery', 'contractor', 'supplier', 'other')),
  identification_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  manufacturer TEXT,
  model TEXT,
  color TEXT,
  plate_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitors
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  destination_company_id UUID NOT NULL REFERENCES companies(id),
  host_name TEXT,
  purpose TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate Movements
CREATE TABLE IF NOT EXISTS gate_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  entry_officer_id UUID NOT NULL REFERENCES auth.users(id),
  exit_officer_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'inside' CHECK (status IN ('inside', 'exited', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitor Passes (QR)
CREATE TABLE IF NOT EXISTS visitor_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LPR Events
CREATE TABLE IF NOT EXISTS lpr_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_number TEXT,
  confidence_score NUMERIC,
  image_path TEXT,
  recognition_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_persons_category ON persons(person_category);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_gate_movements_status ON gate_movements(status);
CREATE INDEX IF NOT EXISTS idx_gate_movements_entry_time ON gate_movements(entry_time);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_token ON visitor_passes(token_hash);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lpr_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: authenticated users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrator')
);

-- Companies: all authenticated can read, admins can write
CREATE POLICY "Authenticated can read companies" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage companies" ON companies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrator')
);

-- Persons: authenticated can read, security officers+ can write
CREATE POLICY "Authenticated can read persons" ON persons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage persons" ON persons FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Visitors: authenticated can read, staff can write
CREATE POLICY "Authenticated can read visitors" ON visitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage visitors" ON visitors FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Gate movements: authenticated can read, staff can write
CREATE POLICY "Authenticated can read movements" ON gate_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage movements" ON gate_movements FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);
CREATE POLICY "Staff can update movements" ON gate_movements FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Vehicles
CREATE POLICY "Authenticated can read vehicles" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Visitor passes
CREATE POLICY "Authenticated can read passes" ON visitor_passes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage passes" ON visitor_passes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Audit logs
CREATE POLICY "Admins can read logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrator')
);
CREATE POLICY "System can insert logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- LPR events
CREATE POLICY "Authenticated can read lpr" ON lpr_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert lpr" ON lpr_events FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator', 'security_officer'))
);

-- Seed initial companies
INSERT INTO companies (name, identifier, color) VALUES
  ('SAT-7', 'SAT7', '#22d3ee'),
  ('Blue Sun', 'BLUE_SUN', '#3b82f6'),
  ('Different Production', 'DIFF_PROD', '#8b5cf6'),
  ('NBC', 'NBC', '#ec4899')
ON CONFLICT (identifier) DO NOTHING;
