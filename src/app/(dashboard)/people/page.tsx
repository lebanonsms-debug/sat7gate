'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { VoiceInput } from '@/components/ui/voice-input'
import { Plus, Trash2, Pencil, X, Users } from 'lucide-react'
import type { Person } from '@/lib/types'

const CATEGORIES = [
  { value: 'employee', label: 'Employee' },
  { value: 'rental_company', label: 'Rental Company' },
  { value: 'guest', label: 'Guest' },
  { value: 'delivery', label: 'Delivery' },
] as const

export default function PeoplePage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [editing, setEditing] = useState<Person | null>(null)
  const [form, setForm] = useState({
    given_name: '',
    family_name: '',
    person_category: 'guest' as Person['person_category'],
    company: '',
    notes: '',
  })
  const [vehicles, setVehicles] = useState<{ plate_number: string; manufacturer: string; model: string; color: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [newVehicle, setNewVehicle] = useState({ plate_number: '', manufacturer: '', model: '', color: '' })
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const supabase = createClientComponentClient()

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('persons').select('*').order('given_name, family_name')
    setPersons((data as Person[]) || [])
  }, [supabase])

  const fetchCompanies = useCallback(async () => {
    const { data } = await supabase.from('companies').select('id, name').eq('active', true)
    setCompanies(data || [])
    setLoadingCompanies(false)
  }, [supabase])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { fetchCompanies() }, [fetchCompanies]) // eslint-disable-line react-hooks/set-state-in-effect

  const fetchVehicles = useCallback(async (personId: string) => {
    const { data } = await supabase.from('vehicles').select('*').eq('person_id', personId)
    setVehicles((data as { plate_number: string; manufacturer: string; model: string; color: string }[]) || [])
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editing) {
        await supabase.from('persons').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
        await supabase.from('audit_logs').insert({ user_id: user.id, action: 'update_person', entity_type: 'person', entity_id: editing.id, details: `Updated person ${form.given_name || ""} ${form.family_name || ""} (${form.person_category})` })
        setMessage('Person updated')
      } else {
        const { data, error } = await supabase.from('persons').insert({ ...form, updated_at: new Date().toISOString() }).select().single()
        if (error) throw error
        await supabase.from('audit_logs').insert({ user_id: user.id, action: 'create_person', entity_type: 'person', entity_id: data.id, details: `Created person ${form.given_name || ""} ${form.family_name || ""} (${form.person_category})` })

        if (newVehicle.plate_number) {
          const vehicle_data = {
            person_id: data.id,
            plate_number: newVehicle.plate_number,
            manufacturer: newVehicle.manufacturer,
            model: newVehicle.model,
            color: newVehicle.color,
          }
          const { error: vError } = await supabase.from('vehicles').insert(vehicle_data)
          if (vError) { console.error('Vehicle insert error:', vError) }
          await fetchVehicles(data.id)
        }

        setMessage('Person added')
      }
      setForm({ given_name: '', family_name: '', person_category: 'guest', company: '', notes: '' })
      setNewVehicle({ plate_number: '', manufacturer: '', model: '', color: '' })
      setVehicles([])
      setEditing(null)
      fetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving person'
      setMessage(message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (person: Person) => {
    setEditing(person)
    setForm({
      given_name: person.given_name || '',
      family_name: person.family_name || '',
      person_category: person.person_category,
      company: person.company || '',
      notes: person.notes || '',
    })
    fetchVehicles(person.id)
  }

  const deletePerson = async (id: string, person: Person, category: string) => {
    const displayName = person.given_name && person.family_name
      ? `${person.given_name} ${person.family_name}`
      : person.given_name || person.family_name || 'Unknown'
    if (!user) return
    await supabase.from('vehicles').delete().eq('person_id', id)
    await supabase.from('persons').delete().eq('id', id)
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'delete_person', entity_type: 'person', entity_id: id, details: `Deleted ${category} ${person.given_name || person.family_name || 'Unknown'}` })
    setVehicles([])
    fetch()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">People</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>{editing ? 'Edit Person' : 'Add Person'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap items-stretch sm:items-end">
            <div className='flex flex-row gap-3 sm:gap-4 flex-1 min-w-0'>
              <Input placeholder='Create Name (Given Name)' value={form.given_name || ''} onChange={e => setForm({...form, given_name: e.target.value})} className='w-1/2 text-base' />
              <Input placeholder='Family Name (Surname)' value={form.family_name || ''} onChange={e => setForm({...form, family_name: e.target.value})} className='w-1/2 text-base' />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Type *</label>
              <select
                value={form.person_category}
                onChange={e => setForm({ ...form, person_category: e.target.value as Person['person_category'] })}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <select
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
              className="flex-1 rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 w-full min-w-[200px]"
              disabled={loadingCompanies}
            >
              <option value=''>Select company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>



            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-slate-300 mb-1">Vehicle (optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Plate" value={newVehicle.plate_number} onChange={e => setNewVehicle({...newVehicle, plate_number: e.target.value})} className="text-base" />
                <Input placeholder="Manufacturer" value={newVehicle.manufacturer} onChange={e => setNewVehicle({...newVehicle, manufacturer: e.target.value})} className="text-base" />
                <Input placeholder="Model" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} className="text-base" />
                <Input placeholder="Color" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} className="text-base" />
              </div>
            </div>

            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 h-10 sm:h-auto" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />{loading ? 'Saving...' : (editing ? 'Update' : 'Add')}
            </Button>
            {editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm({ given_name: '', family_name: '', person_category: 'guest', company: '', notes: '' }); setVehicles([]) }} className="h-10 sm:h-auto"><X className="w-4 h-4 mr-2" />Cancel</Button>}
          </form>
          {message && <p className={`text-sm mt-2 ${message.includes('success') || message.includes('added') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}

          {vehicles.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <h4 className="text-sm font-medium text-cyan-400 mb-2">Vehicles ({vehicles.length})</h4>
              <div className="text-xs text-slate-300">
                {vehicles.map(v => <div key={v.plate_number} className="mb-1">{v.plate_number} - {v.manufacturer} {v.model} ({v.color})</div>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          {persons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No people found</p>
              <p className="text-slate-500 text-sm mt-1">Add your first person using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {persons.map(p => (
                    <tr key={p.id} className="hover:bg-slate-700/20">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-white font-medium">{p.given_name || p.family_name || '-'}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-300">{p.person_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                      
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-300 hidden sm:table-cell">{p.company || '-'}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-300 hidden sm:table-cell">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(p)} className="text-cyan-400 hover:text-cyan-300 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-700/50" title="Edit person">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deletePerson(p.id, p, p.person_category)} className="text-red-400 hover:text-red-300 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-700/50" title="Delete person">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
