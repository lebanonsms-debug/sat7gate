import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import * as cookie from 'cookie'

function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) return []
  const parsed = cookie.parse(cookieHeader)
  return Object.entries(parsed)
    .filter(([name]) => !['Path', 'Domain', 'Expires', 'Max-Age', 'Secure', 'HttpOnly', 'SameSite'].includes(name))
    .map(([name, value]) => ({ name, value }))
}

export function createSupabaseServerClient(request: Request) {
  const response = NextResponse.json({})
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return parseCookies(request.headers.get('Cookie'))
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      } as any,
    }
  )
  return { supabase, response }
}
