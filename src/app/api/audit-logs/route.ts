import { NextResponse } from 'next/server'
import { getServerUser, isAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { supabase, profile, response } = await getServerUser(request)
    if (response) return response
    if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { data } = await supabase.from('audit_logs').select('*, user:profiles(full_name)').order('created_at', { ascending: false }).limit(100)
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
