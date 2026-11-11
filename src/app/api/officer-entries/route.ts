import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { supabase } = createSupabaseServerClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const shiftFilter = url.searchParams.get('shift')

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [{ data: visitors }, { data: persons }, { data: companies }, { data: officers }] = await Promise.all([
      admin
        .from('visitors')
        .select('id, created_at, host_name, purpose, notes, created_by, person_id, destination_company_id')
        .order('created_at', { ascending: false })
        .limit(500),
      admin.from('persons').select('id, full_name, person_category'),
      admin.from('companies').select('id, name'),
      admin.from('profiles').select('id, full_name, shift'),
    ])

    const personMap = new Map((persons || []).map(p => [p.id, p]))
    const companyMap = new Map((companies || []).map(c => [c.id, c]))
    const officerMap = new Map((officers || []).map(o => [o.id, o]))

    let rows = (visitors || []).map(v => {
      const person = personMap.get(v.person_id)
      const officer = officerMap.get(v.created_by)
      return {
        id: v.id,
        created_at: v.created_at,
        host_name: v.host_name,
        purpose: v.purpose,
        notes: v.notes,
        person_name: person?.full_name || 'Unknown',
        person_category: person?.person_category || 'other',
        company_name: companyMap.get(v.destination_company_id)?.name || '-',
        officer_name: officer?.full_name || 'Unknown',
        officer_shift: (officer?.shift || 'day') as 'day' | 'night',
      }
    })

    if (shiftFilter === 'day' || shiftFilter === 'night') {
      rows = rows.filter(r => r.officer_shift === shiftFilter)
    }

    return NextResponse.json({ entries: rows })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
