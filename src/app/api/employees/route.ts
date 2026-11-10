import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { supabase } = createSupabaseServerClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const fullName = searchParams.get('full_name')
    let query = supabase.from('persons').select('*').eq('person_category', 'employee').order('full_name')
    if (fullName) {
      query = query.ilike('full_name', `%${fullName}%`)
    }
    const { data } = await query
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = createSupabaseServerClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { data } = await supabase.from('persons').insert(body).select().single()
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
