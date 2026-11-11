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
  { value: 'freelancer', label: 'Freelancer / Contractor' },
  { value: 'contractor', label: 'Contractor / Technician' },
  { value: 'guest', label: 'Guest / Visitor' },
  { value: 'delivery', label: 'Delivery Personnel' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'rental_company', label: 'Rental Company' },
  { value: 'other', label: 'Other' },
]

export default function RegisterEntryPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [persons, setPersons] = useState<{ id: string; full_name: string; identification_number: string; person_category: string; email?: string; phone?: string; company?: string; notes?: string }[]>([])
  const [vehicles, setVehicles] = useState<{ id: string; plate_number: string; manufacturer: string; model: string; color: string }[]>([])
  const [loadingPersons, setLoadingPersons] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; full_name: string; identification_number?: string; person_category: string; email?: string; phone?: string; notes?: string } | null>(null)
  const [form, setForm] = useState({ fullName: '', category: 'guest' as PersonCategory, companyId: '', notes: '', plateNumber: '', manufacturer: '', model: '', color: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [foundPerson, setFoundPerson] = useState<{ id: string; full_name: string; identification_number: string; person_category: string; email?: string; phone?: string; company?: string; notes?: string } | null>(null)
  const [loadingPerson, setLoadingPerson] = useState(false)
  const [message, setMessage] = useState('')
  const [newPersonFullname, setNewPersonFullname] = useState('')
  const [newPersonCategory, setNewPersonCategory] = useState<PersonCategory>('employee')
  const [newPersonCompany, setNewPersonCompany] = useState('')
  const [newPersonSuccess, setNewPersonSuccess] = useState('')
  const [newPersonError, setNewPersonError] = useState('')
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: '', manufacturer: '', model: '', color: '' })
  const router = useRouter()
  const supabase = createClientComponentClient()

  const fetchCompanies = useCallback(async () => {
    const { data } = await supabase.from('companies').select('*').eq('active', true)
    setCompanies(data || [])
  }, [supabase])

  const fetchPersons = useCallback(async () => {
    const { data } = await supabase.from('persons').select('id, full_name, identification_number, person_category, email, phone, company, notes').order('full_name')
    setPersons(data || [])
    setLoadingPersons(false)
  }, [supabase])

  const fetchVehicles = useCallback(async (personId: string) => {
    const { data } = await supabase.from('vehicles').select('*').eq('person_id', personId)
    setVehicles(data || [])
  }, [supabase])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchCompanies()
    fetchPersons()
  }, [fetchCompanies, fetchPersons])
  /* eslint-enable react-hooks/set-state-in-effect */

  // eslint-disable-next-line
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.fullName.trim().length < 2) {
        // eslint-disable-next-line
        setFoundPerson(null)
        // eslint-disable-next-line
        setVehicles([])
        return
      }
      setLoadingPerson(true)
      try {
        const { data, error } = await supabase
          .from('persons')
          .select('id, full_name, identification_number, person_category, email, phone, company, notes')
          .ilike('full_name', `%${form.fullName.trim()}%`)
          .limit(5)

        if (error) {
          console.error('Auto-search error:', error)
          setFoundPerson(null)
          setVehicles([])
        } else if (data && data.length > 0) {
          const found = data[0]
          setFoundPerson(found)
          await fetchVehicles(found.id)
          setForm(prev => ({
            ...prev,
            fullName: found.full_name,
            category: found.person_category as PersonCategory,
            email: found.email || '',
            phone: found.phone || '',
            notes: found.notes || '',
          }))
          const vehicle = vehicles[0]
          if (vehicle) {
            setVehicleForm({
              plateNumber: vehicle.plate_number || '',
              manufacturer: vehicle.manufacturer || '',
              model: vehicle.model || '',
              color: vehicle.color || '',
            })
          }
          setMessage('Person found - auto-filled')
        } else {
          setFoundPerson(null)
          setVehicles([])
          setMessage('')
        }
      } catch {
        setFoundPerson(null)
        setVehicles([])
        setMessage('')
      } finally {
        setLoadingPerson(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.fullName, supabase, fetchVehicles, vehicles])

  const handleCreateNewPerson = async () => {
    if (!newPersonFullname.trim()) return
    setNewPersonError('')
    setNewPersonSuccess('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: existing } = await supabase.from('persons').select('id').eq('full_name', newPersonFullname.trim()).eq('person_category', newPersonCategory).maybeSingle()
      if (existing) {
        setNewPersonError('Person with this name already exists')
        return
      }

      const { data: newPerson } = await supabase.from('persons').insert({
        full_name: newPersonFullname.trim(),
        person_category: newPersonCategory,
        company: newPersonCompany.trim() || null,
      }).select('id, full_name, person_category').single()

      if (!newPerson) {
        setNewPersonError('Failed to create person')
        return
      }

      setSelectedPerson({ id: newPerson.id, full_name: newPerson.full_name, person_category: newPerson.person_category })
      setForm(prev => ({
        ...prev,
        fullName: newPerson.full_name,
        category: newPerson.person_category,
      }))
      setNewPersonSuccess('Created ' + newPerson.full_name)
      setNewPersonFullname('')
      setNewPersonCategory('employee')
      setNewPersonCompany('')
      setMessage('Created new person - ' + newPerson.full_name)
    } catch (err) {
      setNewPersonError(err instanceof Error ? err.message : 'Error creating person')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let personId: string | undefined
      if (foundPerson) {
        personId = foundPerson.id
      } else if (selectedPerson) {
        personId = selectedPerson.id
      } else {
        const { data: existingPerson } = await supabase.from('persons').select('id').eq('full_name', form.fullName).eq('person_category', form.category).maybeSingle()
        if (existingPerson) {
          personId = existingPerson.id
        } else {
          const { data: newPerson } = await supabase.from('persons').insert({
            full_name: form.fullName,
            person_category: form.category,
            identification_number: null,
            email: form.email || null,
            phone: form.phone || null,
            company_id: form.companyId || null,
            notes: form.notes || null,
          }).select('id').single()
          if (!newPerson) throw new Error('Failed to create person')
          personId = newPerson.id
        }
      }

      if (!personId) throw new Error('No person selected')

      if (vehicleForm.plateNumber) {
        await supabase.from('vehicles').insert({
          person_id: personId,
          plate_number: vehicleForm.plateNumber,
          manufacturer: vehicleForm.manufacturer,
          model: vehicleForm.model,
          color: vehicleForm.color,
        })
      }

      const { data: visitor } = await supabase.from('visitors').insert({
        person_id: personId,
        destination_company_id: form.companyId,
        notes: form.notes,
        created_by: user.id,
      }).select('id').single()
      if (!visitor) throw new Error('Failed to create visitor')

      await supabase.from('gate_movements').insert({
        visitor_id: visitor.id,
        entry_officer_id: user.id,
        status: 'inside',
      })

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'register_entry',
        entity_type: 'visitor',
        entity_id: visitor.id,
        details: `Registered ${form.fullName} (${form.category})`,
      })

      setMessage('Entry registered successfully!')
      setForm({ fullName: '', category: 'guest', companyId: '', notes: '', plateNumber: '', manufacturer: '', model: '', color: '', email: '', phone: '' })
      setVehicleForm({ plateNumber: '', manufacturer: '', model: '', color: '' })
      setSelectedPerson(null)
      setVehicles([])
      setFoundPerson(null)
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
      <p className="text-slate-400 mb-6">Create a new gate entry record for employee, freelancer, contractor, guest, delivery, or rental company</p>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>Visitor Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                <VoiceInput onTranscript={(text) => setForm({ ...form, fullName: text })}>
                  <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Type person name" required />
                </VoiceInput>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Select Person or Search *</label>
                <Select
                  value={selectedPerson?.id || ''}
                  onChange={(e) => {
                    const person = persons.find(p => p.id === e.target.value)
                    if (person) {
                      setSelectedPerson(person)
                      setForm(prev => ({
                        ...prev,
                        fullName: person.full_name,
                        category: person.person_category as PersonCategory,
                        email: person.email || '',
                        phone: person.phone || '',
                        notes: person.notes || '',
                      }))
                      setMessage('Person selected')
                    }
                  }}
                  className="w-full"
                >
                  <option>Search people...</option>
                  {persons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.person_category}) - ID: {p.identification_number || 'No ID'}
                    </option>
                  ))}
                </Select>
                {loadingPersons && <div className="mt-1 text-xs text-slate-400">Loading people...</div>}
                {selectedPerson && !loadingPersons && (
                  <div className="mt-1 text-xs text-emerald-400">Person selected</div>
                )}
                {foundPerson && !selectedPerson && (
                  <div className="mt-1 text-xs text-emerald-400">Person found - auto-filled</div>
                )}
                {loadingPerson && !foundPerson && !selectedPerson && <div className="mt-1 text-xs text-slate-400">Searching...</div>}
              </div>
            </div>

            {foundPerson && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Person Information (from database)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-xs text-slate-500">Name:</span><p className="text-white font-medium">{foundPerson.full_name}</p></div>
                    <div><span className="text-xs text-slate-500">Category:</span><p className="text-white">{foundPerson.person_category.replace('_', ' ').replace(/\w/g, l => l.toUpperCase())}</p></div>
                    <div><span className="text-xs text-slate-500">ID Number:</span><p className="text-white">{foundPerson.identification_number || 'No ID'}</p></div>
                    {foundPerson.email && <div><span className="text-xs text-slate-500">Email:</span><p className="text-white">{foundPerson.email}</p></div>}
                    {foundPerson.phone && <div><span className="text-xs text-slate-500">Phone:</span><p className="text-white">{foundPerson.phone}</p></div>}
                    {foundPerson.company && <div><span className="text-xs text-slate-500">Company:</span><p className="text-white">{foundPerson.company}</p></div>}
                    {foundPerson.notes && <div><span className="text-xs text-slate-500">Notes:</span><p className="text-white text-xs">{foundPerson.notes}</p></div>}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
              <Select value={foundPerson?.person_category || form.category} onChange={e => setForm({ ...form, category: e.target.value as PersonCategory })}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Destination Company *</label>
              <Select value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}>
                <option value="">Select company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
              <VoiceInput onTranscript={(text) => setForm({ ...form, notes: form.notes ? form.notes + ' ' + text : text })}>
                <textarea className="flex w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </VoiceInput>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-medium text-white mb-4">Create New Person</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                  <Input value={newPersonFullname} onChange={e => setNewPersonFullname(e.target.value)} placeholder="Full name" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                  <Select value={newPersonCategory} onChange={e => setNewPersonCategory(e.target.value as PersonCategory)}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company (optional)</label>
                  <Input value={newPersonCompany} onChange={e => setNewPersonCompany(e.target.value)} placeholder="Company name (if applicable)" />
                </div>
                <div className="col-span-2 flex gap-3">
                  <Button type="button" className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={handleCreateNewPerson} disabled={!newPersonFullname}>
                    Create Person
                  </Button>
                  {newPersonError && <p className="text-sm text-red-400">{newPersonError}</p>}
                  {newPersonSuccess && <p className="text-sm text-emerald-400">{newPersonSuccess}</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-lg font-medium text-white mb-4">Vehicle Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">License Plate</label>
                  <Input value={vehicleForm.plateNumber} onChange={e => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })} placeholder="e.g. 1234 ABC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Manufacturer</label>
                  <Input value={vehicleForm.manufacturer} onChange={e => setVehicleForm({ ...vehicleForm, manufacturer: e.target.value })} placeholder="e.g. Toyota" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Model</label>
                  <Input value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} placeholder="e.g. Camry" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Color</label>
                  <Input value={vehicleForm.color} onChange={e => setVehicleForm({ ...vehicleForm, color: e.target.value })} placeholder="e.g. Blue" />
                </div>
              </div>
            </div>

            {vehicles.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <h4 className="text-sm font-medium text-cyan-400 mb-2">Existing Vehicles ({vehicles.length})</h4>
                <div className="space-y-2">
                  {vehicles.map(v => (
                    <div key={v.id} className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="font-medium">{String(v.plate_number || 'N/A').toUpperCase()}</span>
                      {v.manufacturer && <span className="text-slate-500">{v.manufacturer}</span>}
                      {v.model && <span className="text-slate-500">{v.model}</span>}
                      {v.color && <span className="text-slate-500">{v.color}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {message && <p className={`text-sm ${message.includes('✓') || message.includes('successfully') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}

            <div className="flex gap-3">
              <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
                {loading ? 'Registering...' : 'Register Entry'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setForm({ fullName: '', category: 'guest', companyId: '', notes: '', plateNumber: '', manufacturer: '', model: '', color: '', email: '', phone: '' })}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
