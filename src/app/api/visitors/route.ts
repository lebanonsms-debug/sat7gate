import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('visitors').select('*, person:persons(*), company:companies(*), gate_movements(*)').order('created_at', { ascending: false })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { data } = await supabase.from('visitors').insert(body).select().single()
  return NextResponse.json({ data })
}
