'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { VoiceInput } from '@/components/ui/voice-input'
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
                <VoiceInput onTranscript={(text) => setForm({...form, fullName: text})}>
                  <Input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
                </VoiceInput>
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
                <VoiceInput onTranscript={(text) => setForm({...form, idNumber: text})}>
                  <Input value={form.idNumber} onChange={e => setForm({...form, idNumber: e.target.value})} />
                </VoiceInput>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Purpose</label>
                <VoiceInput onTranscript={(text) => setForm({...form, purpose: text})}>
                  <Input value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
                </VoiceInput>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
              <VoiceInput onTranscript={(text) => setForm({...form, notes: form.notes ? form.notes + ' ' + text : text})}>
                <textarea className="flex w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </VoiceInput>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-medium text-white mb-4">Vehicle Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">License Plate</label>
                  <VoiceInput onTranscript={(text) => setForm({...form, plateNumber: text.toUpperCase()})}>
                    <Input value={form.plateNumber} onChange={e => setForm({...form, plateNumber: e.target.value.toUpperCase()})} placeholder="e.g. 1234 ABC" />
                  </VoiceInput>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Manufacturer</label>
                  <VoiceInput onTranscript={(text) => setForm({...form, manufacturer: text})}>
                    <Input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} />
                  </VoiceInput>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Model</label>
                  <VoiceInput onTranscript={(text) => setForm({...form, model: text})}>
                    <Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
                  </VoiceInput>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Color</label>
                  <VoiceInput onTranscript={(text) => setForm({...form, color: text})}>
                    <Input value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
                  </VoiceInput>
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
