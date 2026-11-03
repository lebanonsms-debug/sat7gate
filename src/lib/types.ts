export type Role = 'security_officer' | 'administrator' | 'management' | 'viewer'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  active: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  identifier: string
  color: string
  active: boolean
  created_at: string
}

export type PersonCategory = 'employee' | 'guest' | 'rental_company' | 'delivery' | 'contractor' | 'supplier' | 'other'

export interface Person {
  id: string
  full_name: string
  person_category: PersonCategory
  identification_number?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  person_id: string
  manufacturer?: string
  model?: string
  color?: string
  plate_number?: string
  created_at: string
}

export interface Visitor {
  id: string
  person_id: string
  destination_company_id: string
  host_name?: string
  purpose?: string
  notes?: string
  created_by: string
  created_at: string
}

export type MovementStatus = 'inside' | 'exited' | 'pending'

export interface GateMovement {
  id: string
  visitor_id: string
  entry_time: string
  exit_time?: string
  entry_officer_id: string
  exit_officer_id?: string
  status: MovementStatus
  created_at: string
}

export interface VisitorPass {
  id: string
  visitor_id: string
  token_hash: string
  expires_at: string
  revoked_at?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  details?: string
  created_at: string
}

export interface LprEvent {
  id: string
  plate_number?: string
  confidence_score?: number
  image_path?: string
  recognition_status: string
  created_at: string
}
