'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, X } from 'lucide-react'
import type { Person } from '@/lib/types'

interface Vehicle {
  id: string
  plate_number?: string
  manufacturer?: string
  model?: string
  color?: string
  person_id?: string
  person?: { full_name?: string }
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [persons, setPersons] = useState<Person[]>([])
  const [editing, setEditing] = useState<{ id: string; plate_number?: string; manufacturer?: string; model?: string; color?: string; person_id?: string } | null>(null)
  const [form, setForm] = useState({ plate_number: '', manufacturer: '', model: '', color: '', person_id: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  const fetch = useCallback(async () => {
    const [{ data: v }, { data: p }] = await Promise.all([
      supabase.from('vehicles').select('*, person:persons(*)').order('plate_number'),
      supabase.from('persons').select('id, full_name, person_category').order('full_name')
    ])
    setVehicles(v || [])
    setPersons((p as Person[]) || [])
  }, [supabase])

  useEffect(() => { fetch() }, [fetch]) // eslint-disable-line react-hooks/set-state-in-effect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editing) {
        await supabase.from('vehicles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
        await supabase.from('audit_logs').insert({ user_id: user.id, action: 'update_vehicle', entity_type: 'vehicle', entity_id: editing.id, details: `Updated vehicle ${form.plate_number}` })
        setMessage('Vehicle updated')
      } else {
        await supabase.from('vehicles').insert(form)
        await supabase.from('audit_logs').insert({ user_id: user.id, action: 'create_vehicle', entity_type: 'vehicle', details: `Created vehicle ${form.plate_number}` })
        setMessage('Vehicle added')
      }
      setForm({ plate_number: '', manufacturer: '', model: '', color: '', person_id: '' })
      setEditing(null)
      fetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving vehicle'
      setMessage(message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (v: { id: string; plate_number?: string; manufacturer?: string; model?: string; color?: string; person_id?: string }) => {
    setEditing(v)
    setForm({ plate_number: v.plate_number || '', manufacturer: v.manufacturer || '', model: v.model || '', color: v.color || '', person_id: v.person_id || '' })
  }

  const deleteVehicle = async (id: string, plate?: string) => {
    const label = plate || 'this vehicle'
    if (!confirm(`Delete vehicle "${label}"?`)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('vehicles').delete().eq('id', id)
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'delete_vehicle', entity_type: 'vehicle', entity_id: id, details: `Deleted vehicle ${plate}` })
    if (editing?.id === id) { setEditing(null); setForm({ plate_number: '', manufacturer: '', model: '', color: '', person_id: '' }) }
    fetch()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Vehicles</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1">License Plate</label><Input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value.toUpperCase()})} required /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Person</label><select className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100" value={form.person_id} onChange={e => setForm({...form, person_id: e.target.value})} required><option value="">Select person</option>{persons.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.person_category})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Manufacturer</label><Input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Model</label><Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Color</label><Input value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={loading}>{editing ? 'Update' : 'Add'}</Button>
              {editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm({ plate_number: '', manufacturer: '', model: '', color: '', person_id: '' }) }}><X className="w-4 h-4 mr-2" />Cancel</Button>}
            </div>
            {message && <p className={`text-sm ${message.includes('updated') || message.includes('added') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}
          </form>
        </CardContent>
      </Card>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plate</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Person</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Make/Model</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Color</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 text-sm font-mono text-white">{v.plate_number}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{v.person?.full_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{v.manufacturer} {v.model}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{v.color}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => startEdit(v)} className="text-cyan-400 hover:text-cyan-300 p-1" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteVehicle(v.id, v.plate_number)} className="text-red-400 hover:text-red-300 p-1" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
