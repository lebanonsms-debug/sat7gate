'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, Car, Building2 } from 'lucide-react'

const OCCUPANCY_TYPES = [
  { key: 'employees', label: 'Employees', iconColor: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { key: 'rental', label: 'Rental Company', iconColor: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'guests', label: 'Guests', iconColor: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'delivery', label: 'Delivery', iconColor: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'walksIn', label: 'Walks In', iconColor: 'text-rose-400', bg: 'bg-rose-500/10' },
  { key: 'other', label: 'Other', iconColor: 'text-slate-400', bg: 'bg-slate-500/10' },
] as const

export default function LiveOccupancyPage() {
  const [stats, setStats] = useState({ total: 0, employees: 0, rental: 0, guests: 0, delivery: 0, walksIn: 0, other: 0, vehicles: 0, companies: {} as Record<string, number> })
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      const [{ data: movements }, { data: companies }] = await Promise.all([
        supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*, vehicles:vehicles(*)), company:companies(*))').eq('status', 'inside'),
        supabase.from('companies').select('id, name'),
      ])
      const companyName: Record<string, string> = {}
      ;(companies || []).forEach(c => { companyName[c.id] = c.name })
      const list = movements || []
      const byCompany: Record<string, number> = {}
      const categoryOf = (m: { visitor?: { person?: { person_category?: string } } }) => m.visitor?.person?.person_category || 'other'
      list.forEach((m) => {
        const raw = (m as { visitor?: { person?: { company?: string } } }).visitor?.person?.company
        const name = raw ? (companyName[raw] || raw) : 'No company'
        byCompany[name] = (byCompany[name] || 0) + 1
      })
      const employees = list.filter((m) => categoryOf(m) === 'employee').length
      const rental = list.filter((m) => categoryOf(m) === 'rental_company').length
      const guests = list.filter((m) => categoryOf(m) === 'guest').length
      const delivery = list.filter((m) => categoryOf(m) === 'delivery').length
      const walksIn = list.filter((m) => categoryOf(m) === 'walks_in').length
      setStats({
        total: list.length,
        employees,
        rental,
        guests,
        delivery,
        walksIn,
        other: list.length - employees - rental - guests - delivery - walksIn,
        vehicles: list.filter((m) => (m as { visitor?: { person?: { vehicles?: unknown[] } } }).visitor?.person?.vehicles?.length).length,
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
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Live Occupancy</h1>
        <p className="text-slate-400 mt-1">Real-time building occupancy overview</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className=""><CardContent className="p-4 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Total Inside</p><p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats.total}</p></div><Users className="w-8 h-8 text-cyan-400" /></div></CardContent></Card>
        {OCCUPANCY_TYPES.map(t => (
          <Card key={t.key} className="">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-slate-400 truncate">{t.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats[t.key]}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${t.bg} flex items-center justify-center shrink-0`}>
                  <Users className={`w-5 h-5 ${t.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className=""><CardContent className="p-4 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Vehicles</p><p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats.vehicles}</p></div><Car className="w-8 h-8 text-blue-400" /></div></CardContent></Card>
      </div>
      <Card className="">
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
