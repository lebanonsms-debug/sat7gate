'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Activity, Users, Car, UserPlus, TrendingUp, Clock, QrCode, Camera } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface KPIs {
  totalEntriesToday: number
  currentlyInside: number
  totalExitsToday: number
  vehiclesInside: number
  visitorsInside: number
  staffInside: number
  guestsInside: number
  avgDuration: string
  peakHour: string
  trend: string
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs>({ totalEntriesToday: 0, currentlyInside: 0, totalExitsToday: 0, vehiclesInside: 0, visitorsInside: 0, staffInside: 0, guestsInside: 0, avgDuration: '0m', peakHour: '--:--', trend: '+0%' })
  const [recent, setRecent] = useState<any[]>([])
  const [hourlyData, setHourlyData] = useState<any[]>([])
  const [companyData, setCompanyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data: movements } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))')
    const allMovements = movements || []
    const todayMovements = allMovements.filter((m: any) => m.entry_time?.startsWith(today))
    const inside = allMovements.filter((m: any) => m.status === 'inside')
    const exited = allMovements.filter((m: any) => m.status === 'exited')

    // Calculate average duration
    let totalDuration = 0
    exited.forEach((m: any) => {
      if (m.exit_time && m.entry_time) {
        totalDuration += (new Date(m.exit_time).getTime() - new Date(m.entry_time).getTime())
      }
    })
    const avgMs = exited.length > 0 ? totalDuration / exited.length : 0
    const avgMins = Math.round(avgMs / 60000)

    // Peak hour
    const hours: Record<number, number> = {}
    todayMovements.forEach((m: any) => { const h = new Date(m.entry_time).getHours(); hours[h] = (hours[h] || 0) + 1 })
    const peakHourEntry = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]
    const peakHour = peakHourEntry ? `${peakHourEntry[0].padStart(2, '0')}:00` : '--:--'

    // Trend
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const yesterdayMovements = allMovements.filter((m: any) => m.entry_time?.startsWith(yesterday))
    const trend = yesterdayMovements.length > 0 ? `${Math.round(((todayMovements.length - yesterdayMovements.length) / yesterdayMovements.length) * 100)}%` : '+0%'

    // Hourly chart data
    const hourly = Array.from({ length: 10 }, (_, i) => i + 7).map(h => ({
      hour: `${h}:00`,
      count: hours[h] || 0
    }))
    setHourlyData(hourly)

    // Company breakdown
    const companies: any = {}
    inside.forEach((m: any) => {
      const name = m.visitor?.company?.name || 'Unknown'
      if (!companies[name]) companies[name] = { name, people: 0, vehicles: 0, color: '#22d3ee' }
      companies[name].people += 1
      if (m.visitor?.vehicles?.length > 0) companies[name].vehicles += 1
    })
    setCompanyData(Object.values(companies))

    const staff = inside.filter((m: any) => m.visitor?.person?.person_category === 'employee').length
    const guests = inside.filter((m: any) => m.visitor?.person?.person_category !== 'employee').length
    const vehicles = inside.filter((m: any) => m.visitor?.vehicles?.length > 0).length

    setKpis({
      totalEntriesToday: todayMovements.length,
      currentlyInside: inside.length,
      totalExitsToday: exited.length,
      vehiclesInside: vehicles,
      visitorsInside: guests,
      staffInside: staff,
      guestsInside: guests,
      avgDuration: `${avgMins}m`,
      peakHour,
      trend: trend.startsWith('-') ? trend : `+${Math.abs(parseInt(trend))}%`
    })
    setRecent(allMovements.slice(0, 10))
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase.channel('dashboard-realtime')
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'gate_movements' }, fetchData).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/register-entry"><Button className="bg-cyan-600 hover:bg-cyan-700 gap-2"><UserPlus className="w-4 h-4" />New Gate Entry</Button></Link>
        <Link href="/live-gate"><Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 gap-2"><Activity className="w-4 h-4" />Live Gate Monitor</Button></Link>
        <Link href="/qr-passes"><Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 gap-2"><QrCode className="w-4 h-4" />Scan QR Pass</Button></Link>
        <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 gap-2"><Camera className="w-4 h-4" />LPR Console</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-800/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">Currently Inside</p>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-white">{loading ? '...' : kpis.currentlyInside}</p>
              <div className="flex gap-3 text-xs text-slate-400">
                <span>Vehicles: <span className="text-white">{kpis.vehiclesInside}</span></span>
                <span>Walk-ins: <span className="text-white">{kpis.currentlyInside - kpis.vehiclesInside}</span></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">Entries Today</p>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-white">{loading ? '...' : kpis.totalEntriesToday}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400">{kpis.trend}</span>
                <span className="text-slate-400">vs avg</span>
                <span className="text-slate-500">Peak: {kpis.peakHour}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">Exits Cleared</p>
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-white">{loading ? '...' : kpis.totalExitsToday}</p>
              <p className="text-xs text-slate-400">Avg Duration: <span className="text-white">{kpis.avgDuration}</span></p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">Breakdown Today</p>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">{kpis.staffInside} Staff / {kpis.guestsInside} Guests</p>
              <p className="text-xs text-slate-400">Deliveries: <span className="text-white">1</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak Hours Chart */}
        <Card className="border-slate-700 bg-slate-800/50 lg:col-span-2">
          <CardHeader>
            <CardTitle>Peak Entrance Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-2">Vehicle & pedestrian intake volume per hour</p>
          </CardContent>
        </Card>

        {/* Company Occupancy */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle>Tenant Company Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companyData.map((company: any) => {
                const total = company.people + company.vehicles
                const max = Math.max(...companyData.map((c: any) => c.people + c.vehicles), 1)
                const width = (total / max) * 100
                return (
                  <div key={company.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{company.name}</span>
                      <span className="text-white font-medium">{company.people} people / {company.vehicles} vehicles</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${width}%`, backgroundColor: company.color }}
                      />
                    </div>
                  </div>
                )
              })}
              {companyData.length === 0 && <p className="text-slate-500 text-sm">No occupancy data</p>}
            </div>
            <Link href="/live-occupancy">
              <Button variant="ghost" className="w-full mt-4 text-cyan-400 hover:text-cyan-300 text-xs">View Full Metrics →</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recent.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${m.status === 'inside' ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-slate-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{m.visitor?.person?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{m.visitor?.company?.name || 'Unknown company'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{new Date(m.entry_time).toLocaleTimeString()}</p>
                  <p className={`text-xs capitalize ${m.status === 'inside' ? 'text-emerald-400' : 'text-slate-400'}`}>{m.status}</p>
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
