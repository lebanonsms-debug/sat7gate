import { NextResponse } from 'next/server'
import { getServerUser, isStaff } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { supabase, profile, response } = await getServerUser(request)
    if (response) return response
    if (!isStaff(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { data } = await supabase.from('visitors').select('*, person:persons(*), company:companies(*), gate_movements(*)').order('created_at', { ascending: false })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, profile, response } = await getServerUser(request)
    if (response) return response
    if (!isStaff(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const { data } = await supabase.from('visitors').insert(body).select().single()
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
