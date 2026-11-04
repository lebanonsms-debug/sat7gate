'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
        router.refresh()
      }
    }
    checkSession()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20" style={{background:'#0891b2', color:'white'}}>
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{color:'white'}}>SAT7 GATE</h1>
          <p className="text-slate-400 mt-2" style={{color:'#90a1b9'}}>Security Entrance Management</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm" style={{background:'#0f172a', border:'1px solid #314158', borderRadius:'16px', padding:'32px'}}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1" style={{color:'#cad5e2'}}>Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="security@sat7.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1" style={{color:'#cad5e2'}}>Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading} style={{background:'#0891b2', color:'white'}}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>
        <p className="text-center text-slate-500 text-sm mt-6" style={{color:'#62748e'}}>
          SAT7 GATE v1.0 — Secure Access Control
          <span className="ml-2 text-slate-600" style={{color:'#45556c'}}>build-20261104130000</span>
        </p>
      </div>
    </div>
  )
}
