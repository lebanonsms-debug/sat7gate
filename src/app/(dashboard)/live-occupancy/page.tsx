'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, Car, Building2, TrendingUp } from 'lucide-react'

export default function LiveOccupancyPage() {
  const [stats, setStats] = useState({ total: 0, employees: 0, guests: 0, vehicles: 0, companies: {} as Record<string, number> })
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      const { data: movements } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').eq('status', 'inside')
      const list = movements || []
      const byCompany: Record<string, number> = {}
      list.forEach((m: any) => {
        const name = m.visitor?.company?.name || 'Unknown'
        byCompany[name] = (byCompany[name] || 0) + 1
      })
      setStats({
        total: list.length,
        employees: list.filter((m: any) => m.visitor?.person?.person_category === 'employee').length,
        guests: list.filter((m: any) => m.visitor?.person?.person_category !== 'employee').length,
        vehicles: list.filter((m: any) => m.visitor?.vehicles?.length > 0).length,
        companies: byCompany,
      })
    }
    fetchStats()
    const channel = supabase.channel('occupancy')
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'gate_movements' }, fetchStats).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Live Occupancy</h1>
        <p className="text-slate-400 mt-1">Real-time building occupancy overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-800/50"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Total Inside</p><p className="text-3xl font-bold text-white">{stats.total}</p></div><Users className="w-8 h-8 text-cyan-400" /></div></CardContent></Card>
        <Card className="border-slate-700 bg-slate-800/50"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Employees</p><p className="text-3xl font-bold text-white">{stats.employees}</p></div><TrendingUp className="w-8 h-8 text-emerald-400" /></div></CardContent></Card>
        <Card className="border-slate-700 bg-slate-800/50"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Guests</p><p className="text-3xl font-bold text-white">{stats.guests}</p></div><Users className="w-8 h-8 text-purple-400" /></div></CardContent></Card>
        <Card className="border-slate-700 bg-slate-800/50"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Vehicles</p><p className="text-3xl font-bold text-white">{stats.vehicles}</p></div><Car className="w-8 h-8 text-blue-400" /></div></CardContent></Card>
      </div>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>By Company</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.companies).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-white">{name}</span>
                </div>
                <span className="text-lg font-bold text-white">{count}</span>
              </div>
            ))}
            {Object.keys(stats.companies).length === 0 && <p className="text-slate-500 text-sm">No occupancy data</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
