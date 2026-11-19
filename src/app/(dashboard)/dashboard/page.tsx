'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Activity, Users, UserPlus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatInTimezone } from '@/lib/utils/timezone'
import { useTimezone } from '@/hooks/use-timezone'

interface KPIs {
  totalEntriesToday: number
  currentlyInside: number
  totalExitsToday: number
  vehiclesInside: number
  visitorsInside: number
  staffInside: number
  guestsInside: number
  employeesInside: number
  rentalInside: number
  deliveryInside: number
  walkIn: number
  otherInside: number
  avgDuration: string
  peakHour: string
  peakExitHour: string
  trend: string
}

const INSIDE_TYPES = [
  { key: 'employeesInside', category: 'employee', label: 'Employees', iconColor: 'text-cyan-400', bg: 'bg-cyan-500/10', bar: '#22d3ee' },
  { key: 'rentalInside', category: 'rental_company', label: 'Rental Company', iconColor: 'text-blue-400', bg: 'bg-blue-500/10', bar: '#60a5fa' },
  { key: 'guestsInside', category: 'guest', label: 'Guests', iconColor: 'text-purple-400', bg: 'bg-purple-500/10', bar: '#c084fc' },
  { key: 'deliveryInside', category: 'delivery', label: 'Delivery', iconColor: 'text-amber-400', bg: 'bg-amber-500/10', bar: '#fbbf24' },
  { key: 'walkIn', category: 'walk_in', label: 'WALK-INS', iconColor: 'text-rose-400', bg: 'bg-rose-500/10', bar: '#fb7185' },
  { key: 'otherInside', category: 'other', label: 'Other', iconColor: 'text-slate-400', bg: 'bg-slate-500/10', bar: '#94a3b8' },
] as const

const KNOWN_CATEGORIES = ['employee', 'rental_company', 'guest', 'delivery', 'walk_in']
const HOURS = Array.from({ length: 10 }, (_, i) => i + 7)

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Sparkline({ data, color, height = 46 }: { data: number[]; color: string; height?: number }) {
  const id = useId()
  const w = 100
  const h = height
  const max = Math.max(...data, 1)
  const step = data.length > 1 ? w / (data.length - 1) : w
  const pts = data.map((v, i) => [i * step, h - 3 - (v / max) * (h - 8)] as const)
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full block" style={{ height }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {last && <circle cx={last[0]} cy={last[1]} r="1.8" fill={color} />}
    </svg>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { timezone } = useTimezone()
  const [kpis, setKpis] = useState<KPIs>({ totalEntriesToday: 0, currentlyInside: 0, totalExitsToday: 0, vehiclesInside: 0, visitorsInside: 0, staffInside: 0, guestsInside: 0, employeesInside: 0, rentalInside: 0, deliveryInside: 0, walkIn: 0, otherInside: 0, avgDuration: '0m', peakHour: '--:--', peakExitHour: '--:--', trend: '+0%' })
  const [recent, setRecent] = useState<{ id: string; status?: string; entry_time?: string; visitor?: { person?: { full_name?: string; company?: string } } }[]>([])
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({})
  const [hourly, setHourly] = useState<{ hour: string; entries: number; exits: number; inside: number }[]>([])
  const [typeStats, setTypeStats] = useState<Record<string, { people: number; vehicles: number }>>({})
  const [companyData, setCompanyData] = useState<{ name: string; people: number; vehicles: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClientComponentClient(), [])

  const fetchData = useMemo(() => async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [{ data: movements }, { data: companyRows }] = await Promise.all([
        supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*, vehicles:vehicles(*)), company:companies(*))'),
        supabase.from('companies').select('id, name'),
      ])
      const companyName: Record<string, string> = {}
      ;(companyRows || []).forEach(c => { companyName[c.id] = c.name })
      const allMovements = movements || []
      const todayMovements = allMovements.filter((m: { entry_time?: string }) => m.entry_time?.startsWith(today))
      const exitsToday = allMovements.filter((m: { exit_time?: string }) => m.exit_time?.startsWith(today))
      const inside = allMovements.filter((m: { status?: string }) => m.status === 'inside')
      const exited = allMovements.filter((m: { status?: string }) => m.status === 'exited')

      // Hourly entry / exit series + running occupancy
      const entriesByHour: Record<number, number> = {}
      todayMovements.forEach((m: { entry_time?: string }) => {
        const h = m.entry_time ? new Date(m.entry_time).getHours() : 0
        entriesByHour[h] = (entriesByHour[h] || 0) + 1
      })
      const exitsByHour: Record<number, number> = {}
      exitsToday.forEach((m: { exit_time?: string }) => {
        const h = m.exit_time ? new Date(m.exit_time).getHours() : 0
        exitsByHour[h] = (exitsByHour[h] || 0) + 1
      })
      let running = 0
      const hourlySeries = HOURS.map(h => {
        running += (entriesByHour[h] || 0) - (exitsByHour[h] || 0)
        return { hour: `${h}:00`, entries: entriesByHour[h] || 0, exits: exitsByHour[h] || 0, inside: Math.max(running, 0) }
      })
      setHourly(hourlySeries)

      // Average duration
      let totalDuration = 0
      exited.forEach((m: { exit_time?: string; entry_time?: string }) => {
        if (m.exit_time && m.entry_time) {
          totalDuration += (new Date(m.exit_time).getTime() - new Date(m.entry_time).getTime())
        }
      })
      const avgMs = exited.length > 0 ? totalDuration / exited.length : 0
      const avgMins = Math.round(avgMs / 60000)

      // Peak hours
      const peakHourEntry = Object.entries(entriesByHour).sort((a, b) => b[1] - a[1])[0]
      const peakHour = peakHourEntry ? `${peakHourEntry[0].padStart(2, '0')}:00` : '--:--'
      const peakExitEntry = Object.entries(exitsByHour).sort((a, b) => b[1] - a[1])[0]
      const peakExitHour = peakExitEntry ? `${peakExitEntry[0].padStart(2, '0')}:00` : '--:--'

      // Trend
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const yesterdayMovements = allMovements.filter((m: { entry_time?: string }) => m.entry_time?.startsWith(yesterday))
      const trend = yesterdayMovements.length > 0 ? `${Math.round(((todayMovements.length - yesterdayMovements.length) / yesterdayMovements.length) * 100)}%` : '+0%'

      // Company breakdown
      const companies: Record<string, { name: string; people: number; vehicles: number; color: string }> = {}
      inside.forEach((m: { visitor?: { company?: { name?: string }; person?: { company?: string; vehicles?: unknown[] } } }) => {
        const raw = m.visitor?.person?.company
        const name = raw ? (companyName[raw] || raw) : 'No company'
        if (!companies[name]) companies[name] = { name, people: 0, vehicles: 0, color: '#22d3ee' }
        companies[name].people += 1
        if (m.visitor?.person?.vehicles?.length) companies[name].vehicles += 1
      })
      setCompanyData(Object.values(companies))

      const categoryOf = (m: { visitor?: { person?: { person_category?: string } } }) => m.visitor?.person?.person_category || 'other'
      const staff = inside.filter((m) => categoryOf(m) === 'employee').length
      const guests = inside.filter((m) => categoryOf(m) !== 'employee').length
      const vehicles = inside.filter((m: { visitor?: { person?: { vehicles?: unknown[] } } }) => m.visitor?.person?.vehicles?.length).length
      const employeesInside = inside.filter((m) => categoryOf(m) === 'employee').length
      const rentalInside = inside.filter((m) => categoryOf(m) === 'rental_company').length
      const guestsInside = inside.filter((m) => categoryOf(m) === 'guest').length
      const deliveryInside = inside.filter((m) => categoryOf(m) === 'delivery').length
      const walkIn = inside.filter((m) => categoryOf(m) === 'walk_in').length
      const otherInside = inside.length - employeesInside - rentalInside - guestsInside - deliveryInside - walkIn

      // Per-type people + vehicles
      const typeMap: Record<string, { people: number; vehicles: number }> = {}
      inside.forEach((m) => {
        const raw = categoryOf(m)
        const c = KNOWN_CATEGORIES.includes(raw) ? raw : 'other'
        if (!typeMap[c]) typeMap[c] = { people: 0, vehicles: 0 }
        typeMap[c].people += 1
        if (m.visitor?.person?.vehicles?.length) typeMap[c].vehicles += 1
      })
      setTypeStats(typeMap)

      setKpis({
        totalEntriesToday: todayMovements.length,
        currentlyInside: inside.length,
        totalExitsToday: exited.length,
        vehiclesInside: vehicles,
        visitorsInside: guests,
        staffInside: staff,
        guestsInside,
        employeesInside,
        rentalInside,
        deliveryInside,
        walkIn,
        otherInside,
        avgDuration: `${avgMins}m`,
        peakHour,
        peakExitHour,
        trend: trend.startsWith('-') ? trend : `+${Math.abs(parseInt(trend))}%`
      })
      setRecent(allMovements.slice(0, 10))
      setCompanyNames(companyName)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      fetchData()
    }
    const channel = supabase.channel('dashboard-realtime')
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'gate_movements' }, fetchData).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Security Operations Center...</p>
        </div>
      </div>
    )
  }

  const chartData = hourly.map(h => ({ hour: h.hour, count: h.entries }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Security Operations Center</h1>
          <p className="text-slate-400 mt-1">Real-time access oversight for SAT-7</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          All systems operational
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Link href="/register-entry"><Button className="bg-cyan-600 hover:bg-cyan-700 gap-2 text-sm"><UserPlus className="w-4 h-4" />New Gate Entry</Button></Link>
        <Link href="/live-gate"><Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 gap-2 text-sm"><Activity className="w-4 h-4" />Live Gate Monitor</Button></Link>
      </div>

      {/* KPI Cards — diagram + grid inside each */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="relative overflow-hidden animate-fade-up stagger-1">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardContent className="p-4 sm:p-6 relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Currently Inside</p>
                <p className="text-2xl sm:text-4xl font-bold text-white mt-1">{loading ? '...' : kpis.currentlyInside}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <Sparkline data={hourly.map(h => h.inside)} color="#22d3ee" />
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>07:00</span><span>11:00</span><span>16:00</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Vehicles" value={kpis.vehiclesInside} />
              <MiniStat label="Walk-ins" value={Math.max(kpis.currentlyInside - kpis.vehiclesInside, 0)} />
              <MiniStat label="Employees" value={kpis.employeesInside} />
              <MiniStat label="Other types" value={kpis.currentlyInside - kpis.employeesInside} />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-fade-up stagger-2">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardContent className="p-4 sm:p-6 relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Entries Today</p>
                <p className="text-2xl sm:text-4xl font-bold text-white mt-1">{loading ? '...' : kpis.totalEntriesToday}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <Sparkline data={hourly.map(h => h.entries)} color="#34d399" />
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>07:00</span><span>11:00</span><span>16:00</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Peak hour" value={kpis.peakHour} />
              <MiniStat label="vs avg" value={kpis.trend} />
              <MiniStat label="Avg duration" value={kpis.avgDuration} />
              <MiniStat label="Companies" value={companyData.length} />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-fade-up stagger-3">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardContent className="p-4 sm:p-6 relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Exits Cleared</p>
                <p className="text-2xl sm:text-4xl font-bold text-white mt-1">{loading ? '...' : kpis.totalExitsToday}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <Sparkline data={hourly.map(h => h.exits)} color="#fbbf24" />
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>07:00</span><span>11:00</span><span>16:00</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Avg duration" value={kpis.avgDuration} />
              <MiniStat label="Peak exit" value={kpis.peakExitHour} />
              <MiniStat label="Still inside" value={kpis.currentlyInside} />
              <MiniStat label="Vehicles" value={kpis.vehiclesInside} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inside by Type — diagram + grid inside each small box */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {INSIDE_TYPES.map((t, i) => {
          const stats = typeStats[t.category] || { people: 0, vehicles: 0 }
          const max = Math.max(...INSIDE_TYPES.map(x => typeStats[x.category]?.people || 0), 1)
          const pct = Math.round((stats.people / max) * 100)
          return (
            <Card key={t.key} className={`lift animate-fade-up stagger-${Math.min(i + 1, 6)}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center shrink-0`}>
                    <Users className={`w-4 h-4 ${t.iconColor}`} />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white">{loading ? '...' : kpis[t.key]}</p>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{t.label}</p>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: t.bar }} />
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                  <div className="rounded-md bg-white/[0.03] border border-white/[0.05] px-2 py-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">People</p>
                    <p className="text-xs font-semibold text-white mt-0.5">{stats.people}</p>
                  </div>
                  <div className="rounded-md bg-white/[0.03] border border-white/[0.05] px-2 py-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">Vehicles</p>
                    <p className="text-xs font-semibold text-white mt-0.5">{stats.vehicles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Peak Hours Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Peak Entrance Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2b42" />
                  <XAxis dataKey="hour" stroke="#55637a" fontSize={11} />
                  <YAxis stroke="#55637a" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0e1626', border: '1px solid #1f2b42', borderRadius: '12px' }}
                    labelStyle={{ color: '#e6edf7' }}
                  />
                  <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 mt-2">Vehicle &amp; pedestrian intake volume per hour</p>
          </CardContent>
        </Card>

        {/* Company Occupancy */}
        <Card className="">
          <CardHeader>
            <CardTitle>Tenant Company Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companyData.map((company) => {
                const total = company.people + company.vehicles
                const max = Math.max(...companyData.map((c) => c.people + c.vehicles), 1)
                const width = (total / max) * 100
                return (
                  <div key={company.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{company.name}</span>
                      <span className="text-white font-medium">{company.people} people / {company.vehicles} vehicles</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
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
      <Card className="">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recent.map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] gap-2 sm:gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${m.status === 'inside' ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-slate-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{m.visitor?.person?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{m.visitor?.person?.company ? (companyNames[m.visitor.person.company] || m.visitor.person.company) : 'No company'}</p>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:text-right pl-5 sm:pl-0">
                  <p className="text-xs text-slate-400">{formatInTimezone(m.entry_time, timezone, { timeStyle: 'short' })}</p>
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
