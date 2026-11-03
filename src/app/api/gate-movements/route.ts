import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').order('entry_time', { ascending: false })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { data } = await supabase.from('gate_movements').insert(body).select().single()
  return NextResponse.json({ data })
}

export async function PATCH(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { id, ...updates } = body
  const { data } = await supabase.from('gate_movements').update(updates).eq('id', id).select().single()
  return NextResponse.json({ data })
}
