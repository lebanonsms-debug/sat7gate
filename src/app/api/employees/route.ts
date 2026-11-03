import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('persons').select('*').eq('person_category', 'employee').order('full_name')
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { data } = await supabase.from('persons').insert(body).select().single()
  return NextResponse.json({ data })
}
