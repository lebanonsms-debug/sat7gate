import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'daily'
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  if (type === 'daily') {
    const { data } = await supabase.from('gate_movements').select('*').gte('entry_time', new Date(new Date().setHours(0,0,0,0)).toISOString()).lte('entry_time', new Date().toISOString())
    return NextResponse.json({ data })
  }
  return NextResponse.json({ data: [] })
}
