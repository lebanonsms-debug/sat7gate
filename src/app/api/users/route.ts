import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

function getCookies(request: Request) {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return []
  return cookieHeader.split(';').map((c) => {
    const [name, value] = c.trim().split('=')
    return { name, value: decodeURIComponent(value) }
  })
}

export async function GET(request: Request) {
  try {
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: users } = await supabase.from('profiles').select('*').order('full_name')
    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, full_name, role } = await request.json()

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name,
        email,
        role,
        active: true,
      })

      if (profileError) {
        await adminClient.auth.admin.deleteUser(data.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
