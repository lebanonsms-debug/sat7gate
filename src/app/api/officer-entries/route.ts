import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Mutating an entry log is an administrator action — officers may only read the log.
async function getAdmin(request: Request) {
  const { supabase } = createSupabaseServerClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'administrator') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  return { admin, user }
}

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
      admin.from('persons').select('id, full_name, person_category, company'),
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
        company_name: person?.company ? (companyMap.get(person.company)?.name || person.company) : '-',
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

export async function PATCH(request: Request) {
  try {
    const staff = await getAdmin(request)
    if (staff.error) return staff.error

    const { id, host_name, purpose, notes } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing entry id' }, { status: 400 })

    const { error } = await staff.admin
      .from('visitors')
      .update({ host_name: host_name ?? null, purpose: purpose ?? null, notes: notes ?? null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await staff.admin.from('audit_logs').insert({
      user_id: staff.user.id,
      action: 'update_entry_log',
      entity_type: 'visitor',
      entity_id: id,
      details: 'Updated entry log',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const staff = await getAdmin(request)
    if (staff.error) return staff.error

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing entry id' }, { status: 400 })

    // the linked gate movements reference the entry — remove them first
    await staff.admin.from('gate_movements').delete().eq('visitor_id', id)

    const { error } = await staff.admin.from('visitors').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await staff.admin.from('audit_logs').insert({
      user_id: staff.user.id,
      action: 'delete_entry_log',
      entity_type: 'visitor',
      entity_id: id,
      details: 'Deleted entry log',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
