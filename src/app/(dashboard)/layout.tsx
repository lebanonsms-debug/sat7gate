'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = useMemo(() => createClientComponentClient(), [])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      await fetchProfile()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Security Operations Center...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg" style={{color:'#ff6568'}}>Failed to load profile</p>
          <p className="text-slate-400 mt-2" style={{color:'#90a1b9'}}>Please try logging in again</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">SAT7 GATE</h1>
              <p className="text-xs text-slate-400">Control Center</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white px-2">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100%-64px)]">
          <Sidebar profile={profile} onLogout={handleLogout} onNavigate={() => setSidebarOpen(false)} />
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 z-40">
        <Sidebar profile={profile} onLogout={handleLogout} />
      </div>

      {/* Main content area */}
      <div className="lg:ml-64 pt-14">
        <TopNav profile={profile} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
