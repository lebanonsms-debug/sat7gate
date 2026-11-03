import os

BASE = r"C:\Users\elielb\sat7-gate\src"

FILES = {}

# API Routes
FILES[f"{BASE}/app/api/auth/login/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
'''

FILES[f"{BASE}/app/api/companies/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('companies').select('*').order('name')
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { data } = await supabase.from('companies').insert(body).select().single()
  return NextResponse.json({ data })
}
'''

FILES[f"{BASE}/app/api/visitors/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('visitors').select('*, person:persons(*), company:companies(*), gate_movements(*)').order('created_at', { ascending: false })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { data } = await supabase.from('visitors').insert(body).select().single()
  return NextResponse.json({ data })
}
'''

FILES[f"{BASE}/app/api/gate-movements/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').order('entry_time', { ascending: false })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { data } = await supabase.from('gate_movements').insert(body).select().single()
  return NextResponse.json({ data })
}

export async function PATCH(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { id, ...updates } = body
  const { data } = await supabase.from('gate_movements').update(updates).eq('id', id).select().single()
  return NextResponse.json({ data })
}
'''

FILES[f"{BASE}/app/api/employees/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('persons').select('*').eq('person_category', 'employee').order('full_name')
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { data } = await supabase.from('persons').insert(body).select().single()
  return NextResponse.json({ data })
}
'''

FILES[f"{BASE}/app/api/vehicles/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('vehicles').select('*, person:persons(*)').order('created_at', { ascending: false })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { data } = await supabase.from('vehicles').insert(body).select().single()
  return NextResponse.json({ data })
}
'''

FILES[f"{BASE}/app/api/qr-passes/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('visitor_passes').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').order('created_at', { ascending: false })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await request.json()
  const { data } = await supabase.from('visitor_passes').insert(body).select().single()
  return NextResponse.json({ data })
}
'''

FILES[f"{BASE}/app/api/audit-logs/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('audit_logs').select('*, user:profiles(full_name)').order('created_at', { ascending: false }).limit(100)
  return NextResponse.json({ data })
}
'''

FILES[f"{BASE}/app/api/reports/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'daily'
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  if (type === 'daily') {
    const { data } = await supabase.from('gate_movements').select('*').gte('entry_time', new Date(new Date().setHours(0,0,0,0)).toISOString()).lte('entry_time', new Date().toISOString())
    return NextResponse.json({ data })
  }
  return NextResponse.json({ data: [] })
}
'''

# ──────────────────────────────────────────────
# Pages
FILES[f"{BASE}/app/(dashboard)/dashboard/page.tsx"] = r''''use client'

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
'''

FILES[f"{BASE}/app/(dashboard)/register-entry/page.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import type { PersonCategory, Company } from '@/lib/types'

const CATEGORIES: { value: PersonCategory; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'guest', label: 'Guest / Visitor' },
  { value: 'rental_company', label: 'Rental Company' },
  { value: 'delivery', label: 'Delivery Personnel' },
  { value: 'contractor', label: 'Contractor / Technician' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'other', label: 'Other' },
]

export default function RegisterEntryPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [form, setForm] = useState({ fullName: '', category: 'guest' as PersonCategory, companyId: '', hostName: '', purpose: '', notes: '', plateNumber: '', manufacturer: '', model: '', color: '', idNumber: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.from('companies').select('*').eq('active', true).then(({ data }) => setCompanies(data || []))
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert person
      let personId: string
      const { data: existingPerson } = await supabase.from('persons').select('id').eq('full_name', form.fullName).eq('person_category', form.category).maybeSingle()
      if (existingPerson) {
        personId = existingPerson.id
      } else {
        const { data: newPerson } = await supabase.from('persons').insert({ full_name: form.fullName, person_category: form.category, identification_number: form.idNumber }).select('id').single()
        if (!newPerson) throw new Error('Failed to create person')
        personId = newPerson.id
      }

      // Create vehicle if provided
      if (form.plateNumber) {
        await supabase.from('vehicles').insert({ person_id: personId, plate_number: form.plateNumber, manufacturer: form.manufacturer, model: form.model, color: form.color })
      }

      // Create visitor record
      const { data: visitor } = await supabase.from('visitors').insert({ person_id: personId, destination_company_id: form.companyId, host_name: form.hostName, purpose: form.purpose, notes: form.notes, created_by: user.id }).select('id').single()
      if (!visitor) throw new Error('Failed to create visitor')

      // Create gate movement (entry)
      const { error: movementError } = await supabase.from('gate_movements').insert({ visitor_id: visitor.id, entry_officer_id: user.id, status: 'inside' })
      if (movementError) throw movementError

      // Audit log
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'register_entry', entity_type: 'visitor', entity_id: visitor.id, details: `Registered ${form.fullName}` })

      setMessage('Entry registered successfully!')
      setForm({ fullName: '', category: 'guest', companyId: '', hostName: '', purpose: '', notes: '', plateNumber: '', manufacturer: '', model: '', color: '', idNumber: '' })
      setTimeout(() => router.push('/live-gate'), 1000)
    } catch (err: any) {
      setMessage(err.message || 'Error registering entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Register Entry</h1>
      <p className="text-slate-400 mb-6">Register a new person entering the building</p>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>Visitor Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                <Input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                <Select value={form.category} onChange={e => setForm({...form, category: e.target.value as PersonCategory})}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Destination Company *</label>
                <Select value={form.companyId} onChange={e => setForm({...form, companyId: e.target.value})}>
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Host / Contact</label>
                <Input value={form.hostName} onChange={e => setForm({...form, hostName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">ID Number</label>
                <Input value={form.idNumber} onChange={e => setForm({...form, idNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Purpose</label>
                <Input value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
              <textarea className="flex w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-medium text-white mb-4">Vehicle Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">License Plate</label>
                  <Input value={form.plateNumber} onChange={e => setForm({...form, plateNumber: e.target.value.toUpperCase()})} placeholder="e.g. 1234 ABC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Manufacturer</label>
                  <Input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Model</label>
                  <Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Color</label>
                  <Input value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
                </div>
              </div>
            </div>

            {message && <p className={`text-sm ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}

            <div className="flex gap-3">
              <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
                {loading ? 'Registering...' : 'Register Entry'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setForm({ fullName: '', category: 'guest', companyId: '', hostName: '', purpose: '', notes: '', plateNumber: '', manufacturer: '', model: '', color: '', idNumber: '' })}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
'''

print("Writing pages...")
for path, content in FILES.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  wrote {path}")

print("Done")
