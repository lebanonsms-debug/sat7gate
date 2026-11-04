'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editing) {
      await supabase.from('companies').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'update_company', entity_type: 'company', entity_id: editing.id, details: `Updated company ${form.name}` })
    } else {
      const { data } = await supabase.from('companies').insert(form).select('id').single()
      if (data) await supabase.from('audit_logs').insert({ user_id: user.id, action: 'create_company', entity_type: 'company', entity_id: data.id, details: `Created company ${form.name}` })
    }
    setForm({ name: '', identifier: '', color: '#22d3ee', active: true })
    setEditing(null)
    fetch()
  }

  const startEdit = (c: Company) => { setEditing(c); setForm({ name: c.name, identifier: c.identifier, color: c.color, active: c.active }) }
  const deleteCompany = async (id: string, name: string) => {
    if (!confirm(`Delete company "${name}"? This cannot be undone.`)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('companies').delete().eq('id', id)
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'delete_company', entity_type: 'company', entity_id: id, details: `Deleted company ${name}` })
    if (editing?.id === id) { setEditing(null); setForm({ name: '', identifier: '', color: '#22d3ee', active: true }) }
    fetch()
  }
  const toggleActive = async (c: Company) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('companies').update({ active: !c.active }).eq('id', c.id)
    await supabase.from('audit_logs').insert({ user_id: user.id, action: !c.active ? 'enable_company' : 'disable_company', entity_type: 'company', entity_id: c.id, details: `${!c.active ? 'Enabled' : 'Disabled'} company ${c.name}` })
    fetch()
  }

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
                        <Button size="sm" variant="ghost" onClick={() => deleteCompany(c.id, c.name)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>
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
