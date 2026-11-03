'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export function TopNav({ profile }: { profile: Profile | null }) {
  const [time, setTime] = useState(new Date())
  const supabase = createClientComponentClient()
  const [occupancy, setOccupancy] = useState({ people: 0, vehicles: 0, lanes: 0 })

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchOccupancy = async () => {
      const { data } = await supabase.from('gate_movements').select('status').eq('status', 'inside')
      const list = data || []
      setOccupancy({
        people: list.length,
        vehicles: 0,
        lanes: Math.min(list.length, 2)
      })
    }
    fetchOccupancy()
    const channel = supabase.channel('topnav-occupancy')
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'gate_movements' }, fetchOccupancy).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-sm font-medium text-white">
            {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <p className="text-xs text-slate-400">Security Operations Center</p>
        </div>
        <div className="h-8 w-px bg-slate-800" />
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-medium">Barrier Online</span>
          </div>
          <div className="text-slate-400">
            Lanes: <span className="text-white font-medium">{occupancy.lanes} Active</span>
          </div>
          <div className="text-slate-400">
            Inside: <span className="text-white font-medium">{occupancy.people} People / {occupancy.vehicles} Vehicles</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{profile?.full_name || 'Officer'}</p>
          <p className="text-xs text-slate-400">ID: SG-104</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {profile?.full_name?.charAt(0).toUpperCase() || 'O'}
        </div>
      </div>
    </header>
  )
}
