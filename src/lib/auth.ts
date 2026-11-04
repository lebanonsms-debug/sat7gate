import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Profile, Role } from '@/lib/types'

export type { Profile, Role }

export async function getServerUser(request: Request) {
  const { supabase } = createSupabaseServerClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, supabase, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return { user, profile: profile as Profile | null, supabase, response: null }
}

export function hasRole(profile: Profile | null, allowedRoles: Role[]) {
  if (!profile) return false
  return allowedRoles.includes(profile.role)
}

export function isAdmin(profile: Profile | null) {
  return hasRole(profile, ['administrator'])
}

export function isStaff(profile: Profile | null) {
  return hasRole(profile, ['administrator', 'security_officer'])
}
