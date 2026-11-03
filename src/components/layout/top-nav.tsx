'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export function TopNav({ profile }: { profile: Profile | null }) {
  const [time, setTime] = useState(new Date())
  const supabase = createClientComponentClient()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-slate-300">
          {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>
        <span className="text-cyan-400 font-mono text-sm">{time.toLocaleTimeString()}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
          <p className="text-xs text-slate-400 capitalize">{profile?.role?.replace('_', ' ') || ''}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
