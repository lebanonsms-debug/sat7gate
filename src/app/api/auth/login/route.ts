import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function getCookies(request: Request) {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return []
  return cookieHeader.split(';').map((c) => {
    const [name, value] = c.trim().split('=')
    return { name, value: decodeURIComponent(value) }
  })
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const response = NextResponse.json({})
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return getCookies(request)
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
      await supabase.auth.getSession()
    }
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
