import os

BASE = r"C:\Users\elielb\sat7-gate\src"

FILES = {}

FILES[f"{BASE}/app/api/auth/login/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
'''

FILES[f"{BASE}/app/(auth)/login/page.tsx"] = r''''use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SAT7 GATE</h1>
          <p className="text-slate-400 mt-2">Security Entrance Management</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="security@sat7.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>
        <p className="text-center text-slate-500 text-sm mt-6">
          SAT7 GATE v1.0 — Secure Access Control
        </p>
      </div>
    </div>
  )
}
'''

FILES[f"{BASE}/app/(dashboard)/layout.tsx"] = r''''use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, role, loading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login')
    }
  }, [loading, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      <Sidebar role={role || ''} onLogout={async () => { await signOut(); router.push('/login'); }} />
      <div className="flex-1 ml-64">
        <TopNav profile={profile} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
'''

print("Writing auth/layout files...")
for path, content in FILES.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  wrote {path}")

print("Done")
