import os

BASE = r"C:\Users\elielb\sat7-gate\src"

FILES = {}

# ──────────────────────────────────────────────
FILES[f"{BASE}/app/(dashboard)/reports/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FileText } from 'lucide-react'

const COLORS = ['#22d3ee', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

export default function ReportsPage() {
  const [daily, setDaily] = useState<any[]>([])
  const [byCompany, setByCompany] = useState<any[]>([])
  const [byCategory, setByCategory] = useState<any[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchReports = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data: movements } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').gte('entry_time', today)
      const list = movements || []
      
      // Hourly distribution
      const hours: Record<number, number> = {}
      list.forEach((m: any) => { const h = new Date(m.entry_time).getHours(); hours[h] = (hours[h] || 0) + 1 })
      const hourly = Object.entries(hours).map(([hour, count]) => ({ hour: `${hour}:00`, count })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
      setDaily(hourly)

      // By company
      const companies: Record<string, number> = {}
      list.forEach((m: any) => { const name = m.visitor?.company?.name || 'Unknown'; companies[name] = (companies[name] || 0) + 1 })
      setByCompany(Object.entries(companies).map(([name, count]) => ({ name, count })))

      // By category
      const categories: Record<string, number> = {}
      list.forEach((m: any) => { const cat = m.visitor?.person?.person_category?.replace('_', ' ') || 'unknown'; categories[cat] = (categories[cat] || 0) + 1 })
      setByCategory(Object.entries(categories).map(([name, count]) => ({ name, count })))
    }
    fetchReports()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
        <p className="text-slate-400 mt-1">Daily activity overview</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader><CardTitle>Hourly Entries Today</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader><CardTitle>By Company</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={byCompany} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="count">
                  {byCompany.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
'''

# ──────────────────────────────────────────────
FILES[f"{BASE}/app/(dashboard)/qr-passes/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Download } from 'lucide-react'

export default function QrPassesPage() {
  const [passes, setPasses] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.from('visitor_passes').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').then(({ data }) => setPasses(data || []))
  }, [supabase])

  const generatePass = async (visitorId: string) => {
    const token = crypto.randomUUID()
    const { data } = await supabase.from('visitor_passes').insert({ visitor_id: visitorId, token_hash: token, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }).select().single()
    if (data) setPasses([data, ...passes])
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">QR Visitor Passes</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader><CardTitle>Generated Passes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {passes.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-white">{p.visitor?.person?.full_name}</p>
                    <p className="text-xs text-slate-400">Expires: {new Date(p.expires_at).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" onClick={() => setSelected(p)} className="bg-cyan-600 hover:bg-cyan-700">View QR</Button>
                </div>
              ))}
              {passes.length === 0 && <p className="text-slate-500 text-sm">No passes generated yet</p>}
            </div>
          </CardContent>
        </Card>
        {selected && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle>QR Pass</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={selected.token_hash} size={200} />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">{selected.visitor?.person?.full_name}</p>
                <p className="text-slate-400 text-sm">{selected.visitor?.company?.name}</p>
                <p className="text-slate-500 text-xs mt-1">Expires: {new Date(selected.expires_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Download className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
'''

# ──────────────────────────────────────────────
FILES[f"{BASE}/app/(dashboard)/audit-logs/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const supabase = createClientComponentClient()
  useEffect(() => {
    supabase.from('audit_logs').select('*, user:profiles(full_name)').order('created_at', { ascending: false }).limit(200).then(({ data }) => setLogs(data || []))
  }, [supabase])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Entity</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 text-sm text-white">{l.action}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{l.entity_type} {l.entity_id?.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{l.user?.full_name || 'System'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{new Date(l.created_at).toLocaleString()}</td>
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

FILES[f"{BASE}/app/(dashboard)/settings/page.tsx"] = r''''use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [timezone, setTimezone] = useState('Africa/Brazzaville')
  const supabase = createClientComponentClient()

  const saveSettings = async () => {
    setSaving(true)
    await supabase.from('audit_logs').insert({ action: 'update_settings', entity_type: 'settings', details: `Timezone: ${timezone}` })
    setSaving(false)
    alert('Settings saved')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>System Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Timezone</label>
            <Input value={timezone} onChange={e => setTimezone(e.target.value)} />
          </div>
          <Button onClick={saveSettings} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">{saving ? 'Saving...' : 'Save Settings'}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
'''

FILES[f"{BASE}/app/(dashboard)/security-officers/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function SecurityOfficersPage() {
  const [officers, setOfficers] = useState<Profile[]>([])
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'security_officer' as Profile['role'] })
  const supabase = createClientComponentClient()

  const fetch = async () => {
    const { data } = await supabase.from('profiles').select('*').in('role', ['security_officer', 'administrator']).order('full_name')
    setOfficers(data || [])
  }
  useEffect(() => { fetch() }, [supabase])

  const createOfficer = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.admin.createUser({ email: form.email, password: form.password, email_confirm: true })
    if (!error && data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, full_name: form.full_name, email: form.email, role: form.role, active: true })
      setForm({ email: '', password: '', full_name: '', role: 'security_officer' })
      fetch()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Security Officers</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>Create Officer</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createOfficer} className="flex gap-4 flex-wrap">
            <Input placeholder="Full name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
            <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            <Input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            <select className="flex h-10 rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100" value={form.role} onChange={e => setForm({...form, role: e.target.value as Profile['role']})}>
              <option value="security_officer">Security Officer</option>
              <option value="administrator">Administrator</option>
            </select>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700"><ShieldCheck className="w-4 h-4 mr-2" />Create</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {officers.map(o => (
                <tr key={o.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4 text-sm text-white">{o.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{o.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-300 capitalize">{o.role.replace('_', ' ')}</td>
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

print("Writing final pages...")
for path, content in FILES.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  wrote {path}")

print("Done")
