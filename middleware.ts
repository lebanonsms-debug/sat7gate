import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = request.nextUrl.pathname === '/login'
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/register-entry') || request.nextUrl.pathname.startsWith('/live-gate') || request.nextUrl.pathname.startsWith('/live-occupancy') || request.nextUrl.pathname.startsWith('/visitor-history') || request.nextUrl.pathname.startsWith('/employees') || request.nextUrl.pathname.startsWith('/vehicles') || request.nextUrl.pathname.startsWith('/companies') || request.nextUrl.pathname.startsWith('/qr-passes') || request.nextUrl.pathname.startsWith('/reports') || request.nextUrl.pathname.startsWith('/security-officers') || request.nextUrl.pathname.startsWith('/audit-logs') || request.nextUrl.pathname.startsWith('/settings')

  if (isDashboard && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif)).*)'],
}
