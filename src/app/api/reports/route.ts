import { NextResponse } from 'next/server'
import { getServerUser, isAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { supabase, profile, response } = await getServerUser(request)
    if (response) return response
    if (!isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'
    
    if (type === 'daily') {
      const { data } = await supabase.from('gate_movements').select('*').gte('entry_time', new Date(new Date().setHours(0,0,0,0)).toISOString()).lte('entry_time', new Date().toISOString())
      return NextResponse.json({ data })
    }
    return NextResponse.json({ data: [] })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
