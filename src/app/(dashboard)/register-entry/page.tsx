'use client'

import { useCallback, useEffect, useState } from 'react'
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
  const [foundEmployee, setFoundEmployee] = useState<{ id: string; full_name: string; identification_number: string; person_category: string } | null>(null)
  const [loadingEmployee, setLoadingEmployee] = useState(false)
  const [message, setMessage] = useState('')
  const [searchingId, setSearchingId] = useState(false)  // ID number quick search
  const router = useRouter()
  const supabase = createClientComponentClient()

  const fetchCompanies = useCallback(async () => {
    const { data } = await supabase.from('companies').select('*').eq('active', true)
    setCompanies(data || [])
  }, [supabase])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  // Auto-search employee when name changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.fullName.trim().length < 2) {
        setFoundEmployee(null)
        return
      }
      setLoadingEmployee(true)
      try {
        const { data } = await supabase.from('persons').select('id, full_name, identification_number, person_category').eq('full_name', form.fullName.trim()).eq('person_category', 'employee').maybeSingle()
        if (data && typeof data !== 'undefined') {
          setFoundEmployee(data)
          setForm(prev => ({
            ...prev,
            category: (data.person_category || 'employee') as PersonCategory,
            idNumber: data.identification_number || '',
          }))
        } else {
          setFoundEmployee(null)
        }
      } catch {
        setFoundEmployee(null)
      } finally {
        setLoadingEmployee(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.fullName, supabase])

  // ID number quick select
  const handleIdNumberSearch = async (idNumber: string) => {
    if (!idNumber.trim()) return
    setSearchingId(true)
    try {
      const { data } = await supabase.from('persons').select('id, full_name, identification_number, person_category').eq('identification_number', idNumber.trim()).eq('person_category', 'employee').maybeSingle()
      if (data && typeof data !== 'undefined') {
        setFoundEmployee(data)
        setSearchingId(false)
        setForm(prev => ({
          ...prev,
          fullName: data.full_name,
          category: (data.person_category || 'employee') as PersonCategory,
          idNumber: data.identification_number || '',
        }))
      } else {
        setFoundEmployee(null)
        setSearchingId(false)
      }
    } catch {
      setFoundEmployee(null)
      setSearchingId(false)
    }
  }

  // Quick-select employee by ID number
  const quickSelectEmployee = async (idNumber: string) => {
    if (!idNumber.trim()) return
    await handleIdNumberSearch(idNumber)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert person
      // If auto-filled from database, use that employee's ID
      // Otherwise search by name and category
      let personId: string
      if (foundEmployee) {
        personId = foundEmployee.id
      } else {
        const { data: existingPerson } = await supabase.from('persons').select('id').eq('full_name', form.fullName).eq('person_category', form.category).maybeSingle()
        if (existingPerson) {
          personId = existingPerson.id
        } else {
          const { data: newPerson } = await supabase.from('persons').insert({ full_name: form.fullName, person_category: form.category, identification_number: form.idNumber }).select('id').single()
          if (!newPerson) throw new Error('Failed to create person')
          personId = newPerson.id
        }
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error registering entry'
      setMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">NEW ENTRY</h1>
      <p className="text-slate-400 mb-6">Create a new gate entry record</p>
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
                {foundEmployee && (
                  <div className="mt-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Employee found in database — auto-filled
                  </div>
                )}
                {loadingEmployee && !foundEmployee && (
                  <div className="mt-2 text-sm text-slate-400">Searching employee...</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                <Select value={foundEmployee?.person_category || form.category} onChange={e => setForm({...form, category: e.target.value as PersonCategory})} disabled={!!foundEmployee}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
                {foundEmployee && (
                  <div className="mt-1 text-xs text-slate-500">{foundEmployee.person_category.replace('_', ' ')} (from database)</div>
                )}
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
                <div className="relative">
                  <Input
                    value={searchingId ? form.idNumber : ''}
                    onChange={(e) => { if (!form.idNumber) { setForm({ ...form, idNumber: e.target.value }) } }}
                    placeholder="Type ID number and press Enter"
                    disabled={!!foundEmployee}
                    className="pe-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickSelectEmployee(searchingId ? form.idNumber : '')}
                    className="absolute right-0 top-0 h-full px-3"
                    disabled={!searchingId || searchingId}
                  >
                    {searchingId ? '🔍' : '🔎'}
                  </Button>
                </div>
                {foundEmployee && (
                  <div className="mt-1 text-xs text-slate-500">{foundEmployee.identification_number || 'No ID number on file'} (from database)</div>
                )}
                {loadingEmployee && !foundEmployee && (
                  <div className="mt-1 text-xs text-slate-400">Searching...</div>
                )}
                {searchingId && !searchingId && form.idNumber && !foundEmployee && (
                  <div className="mt-1 text-xs text-slate-500">No employee found with this ID number</div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Quick-Select Employees (by ID No)</label>
                <div className="flex flex-wrap gap-2">
                  {['10452', '10453', '10454'].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => quickSelectEmployee(id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50"
                      disabled={!!foundEmployee}
                      title={`Select employee with ID ${id}`}
                    >
                      ID #{id}
                    </button>
                  ))}
                </div>
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
