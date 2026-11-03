import os

BASE = r"C:\Users\elielb\sat7-gate\src"

FILES = {}

# ──────────────────────────────────────────────
FILES[f"{BASE}/app/(dashboard)/live-gate/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Activity, LogOut, Car } from 'lucide-react'

export default function LiveGatePage() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchMovements = async () => {
    const { data } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').eq('status', 'inside').order('entry_time', { ascending: false })
    setMovements(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMovements()
    const channel = supabase.channel('live-gate')
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'gate_movements' }, fetchMovements).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const markExit = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('gate_movements').update({ exit_time: new Date().toISOString(), exit_officer_id: user.id, status: 'exited' }).eq('id', id)
    if (!error) {
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'mark_exit', entity_type: 'gate_movement', entity_id: id })
    }
    fetchMovements()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Live Gate</h1>
        <p className="text-slate-400 mt-1">Currently inside the building — {movements.length} active</p>
      </div>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Entry Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Officer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">No one currently inside</td></tr>
                ) : movements.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{m.visitor?.person?.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 capitalize">{m.visitor?.person?.person_category?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{m.visitor?.company?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{m.visitor?.vehicles?.[0] ? `${m.visitor.vehicles[0].manufacturer} ${m.visitor.vehicles[0].model}` : '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">{m.visitor?.vehicles?.[0]?.plate_number || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{new Date(m.entry_time).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{m.entry_officer_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="destructive" onClick={() => markExit(m.id)} className="gap-1">
                        <LogOut className="w-3 h-3" /> Exit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'''

# ──────────────────────────────────────────────
FILES[f"{BASE}/app/(dashboard)/live-occupancy/page.tsx"] = r''''use client'

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
'''

# ──────────────────────────────────────────────
FILES[f"{BASE}/app/(dashboard)/visitor-history/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Search, Filter } from 'lucide-react'

export default function VisitorHistoryPage() {
  const [records, setRecords] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').order('entry_time', { ascending: false }).limit(100)
      setRecords(data || [])
      setLoading(false)
    }
    fetch()
  }, [supabase])

  const filtered = records.filter((m: any) => {
    if (!search) return true
    const name = m.visitor?.person?.full_name?.toLowerCase() || ''
    const plate = m.visitor?.vehicles?.[0]?.plate_number?.toLowerCase() || ''
    return name.includes(search.toLowerCase()) || plate.includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Visitor History</h1>
        <p className="text-slate-400 mt-1">Complete entrance and exit history</p>
      </div>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-10" placeholder="Search by name or license plate..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Entry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Exit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">No records found</td></tr>
                ) : filtered.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 text-sm font-medium text-white">{m.visitor?.person?.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 capitalize">{m.visitor?.person?.person_category?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{m.visitor?.company?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{new Date(m.entry_time).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{m.exit_time ? new Date(m.exit_time).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${m.status === 'inside' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>{m.status}</span></td>
                    <td className="px-6 py-4 text-sm text-slate-300">{m.entry_officer_id.slice(0, 8)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'''

# ──────────────────────────────────────────────
FILES[f"{BASE}/app/(dashboard)/companies/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, Pencil } from 'lucide-react'
import type { Company } from '@/lib/types'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState({ name: '', identifier: '', color: '#22d3ee', active: true })
  const supabase = createClientComponentClient()

  const fetch = async () => {
    const { data } = await supabase.from('companies').select('*').order('name')
    setCompanies(data || [])
  }
  useEffect(() => { fetch() }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await supabase.from('companies').update(form).eq('id', editing.id)
    } else {
      await supabase.from('companies').insert(form)
    }
    setForm({ name: '', identifier: '', color: '#22d3ee', active: true })
    setEditing(null)
    fetch()
  }

  const startEdit = (c: Company) => { setEditing(c); setForm({ name: c.name, identifier: c.identifier, color: c.color, active: c.active }) }
  const toggleActive = async (c: Company) => { await supabase.from('companies').update({ active: !c.active }).eq('id', c.id); fetch() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Companies</h1>
          <p className="text-slate-400 mt-1">Manage building tenants and visitor destinations</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-700 bg-slate-800/50 lg:col-span-1">
          <CardHeader><CardTitle>{editing ? 'Edit Company' : 'Add Company'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Name</label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Identifier</label><Input value={form.identifier} onChange={e => setForm({...form, identifier: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Color</label><Input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} /><label className="text-sm text-slate-300">Active</label></div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">{editing ? 'Update' : 'Add'}</Button>
                {editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm({ name: '', identifier: '', color: '#22d3ee', active: true }) }}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50 lg:col-span-2">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Identifier</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Color</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {companies.map(c => (
                    <tr key={c.id} className="hover:bg-slate-700/20">
                      <td className="px-6 py-4 text-sm font-medium text-white">{c.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{c.identifier}</td>
                      <td className="px-6 py-4"><div className="w-6 h-6 rounded-full border border-slate-500" style={{ backgroundColor: c.color }} /></td>
                      <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${c.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-6 py-4 flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(c)}>{c.active ? 'Disable' : 'Enable'}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
'''

FILES[f"{BASE}/app/(dashboard)/employees/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ full_name: '', person_category: 'employee', identification_number: '' })
  const supabase = createClientComponentClient()

  const fetch = async () => {
    const { data } = await supabase.from('persons').select('*').eq('person_category', 'employee').order('full_name')
    setEmployees(data || [])
  }
  useEffect(() => { fetch() }, [supabase])

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('persons').insert(form)
    setForm({ full_name: '', person_category: 'employee', identification_number: '' })
    fetch()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Employees</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>Add Employee</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addEmployee} className="flex gap-4">
            <Input placeholder="Full name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required className="flex-1" />
            <Input placeholder="ID Number" value={form.identification_number} onChange={e => setForm({...form, identification_number: e.target.value})} />
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4" /></Button>
          </form>
        </CardContent>
      </Card>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID Number</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {employees.map(e => (
                <tr key={e.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4 text-sm text-white">{e.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{e.identification_number || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
'''

FILES[f"{BASE}/app/(dashboard)/vehicles/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const supabase = createClientComponentClient()
  useEffect(() => {
    supabase.from('vehicles').select('*, person:persons(*)').then(({ data }) => setVehicles(data || []))
  }, [supabase])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Vehicles</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plate</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Person</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Make/Model</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Color</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4 text-sm font-mono text-white">{v.plate_number}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.person?.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.manufacturer} {v.model}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.color}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
'''

print("Writing remaining pages...")
for path, content in FILES.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  wrote {path}")

print("Done")
