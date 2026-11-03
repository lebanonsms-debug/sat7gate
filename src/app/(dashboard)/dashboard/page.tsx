'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Activity, Users, Car, UserPlus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface KPIs {
  totalEntriesToday: number
  currentlyInside: number
  totalExitsToday: number
  vehiclesInside: number
  visitorsInside: number
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs>({ totalEntriesToday: 0, currentlyInside: 0, totalExitsToday: 0, vehiclesInside: 0, visitorsInside: 0 })
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data: movements } = await supabase.from('gate_movements').select('*')
      const { data: visitors } = await supabase.from('visitors').select('*, persons(*)')
      
      const allMovements = movements || []
      const todayMovements = allMovements.filter((m: any) => m.entry_time?.startsWith(today))
      const inside = allMovements.filter((m: any) => m.status === 'inside')
      
      setKpis({
        totalEntriesToday: todayMovements.length,
        currentlyInside: inside.length,
        totalExitsToday: todayMovements.filter((m: any) => m.status === 'exited').length,
        vehiclesInside: inside.filter((m: any) => m.visitor?.vehicles?.length > 0).length,
        visitorsInside: inside.filter((m: any) => m.visitor?.person?.person_category !== 'employee').length,
      })
      setRecent((allMovements as any).slice(0, 10))
      setLoading(false)
    }
    fetchData()

    const channel = supabase.channel('dashboard-realtime')
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'gate_movements' }, fetchData).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const kpiCards = [
    { title: 'Total Entries Today', value: kpis.totalEntriesToday, icon: Activity, color: 'text-cyan-400' },
    { title: 'Currently Inside', value: kpis.currentlyInside, icon: Users, color: 'text-emerald-400' },
    { title: 'Total Exits Today', value: kpis.totalExitsToday, icon: TrendingUp, color: 'text-amber-400' },
    { title: 'Vehicles Inside', value: kpis.vehiclesInside, icon: Car, color: 'text-blue-400' },
    { title: 'Visitors Inside', value: kpis.visitorsInside, icon: Users, color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Security Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time building access overview</p>
        </div>
        <Link href="/register-entry">
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700">
            <UserPlus className="w-4 h-4" />
            New Entry
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{kpi.title}</p>
                  <p className="text-3xl font-bold text-white mt-1">{loading ? '...' : kpi.value}</p>
                </div>
                <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recent.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${m.status === 'inside' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{m.visitor?.person?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{m.visitor?.company?.name || 'Unknown company'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{new Date(m.entry_time).toLocaleTimeString()}</p>
                  <p className="text-xs text-cyan-400 capitalize">{m.status}</p>
                </div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-slate-500 text-sm">No recent activity</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
