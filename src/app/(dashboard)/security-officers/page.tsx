'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { VoiceInput } from '@/components/ui/voice-input'
import { ShieldCheck, Pencil, Trash2, X } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function SecurityOfficersPage() {
  const [officers, setOfficers] = useState<Profile[]>([])
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'security_officer' as Profile['role'], shift: 'day' as Profile['shift'] })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  const fetchOfficers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').in('role', ['security_officer', 'administrator']).order('full_name')
    setOfficers(data || [])
  }, [supabase])

  useEffect(() => { fetchOfficers() }, [fetchOfficers]) // eslint-disable-line react-hooks/set-state-in-effect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      if (editing) {
        const res = await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, full_name: form.full_name, role: form.role }),
        })
        const result = await res.json()
        if (!res.ok) {
          setMessage(result.error || 'Failed to update user')
        } else {
          setMessage('User updated successfully!')
          setEditing(null)
          setForm({ email: '', password: '', full_name: '', role: 'security_officer', shift: 'day' })
          fetchOfficers()
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password, full_name: form.full_name, role: form.role, shift: form.shift }),
        })
        const result = await res.json()
        if (!res.ok) {
          setMessage(result.error || 'Failed to create user')
        } else {
          setForm({ email: '', password: '', full_name: '', role: 'security_officer', shift: 'day' })
          setMessage('User created successfully!')
          fetchOfficers()
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving user'
      setMessage(message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (officer: Profile) => {
    setEditing(officer)
    setForm({ email: '', password: '', full_name: officer.full_name, role: officer.role })
  }

  const deleteOfficer = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (!res.ok) {
      setMessage(result.error || 'Failed to delete user')
    } else {
      setMessage('User deleted successfully!')
      if (editing?.id === id) {
        setEditing(null)
        setForm({ email: '', password: '', full_name: '', role: 'security_officer', shift: 'day' })
      }
      fetchOfficers()
    }
  }

  const cancelEdit = () => {
    setEditing(null)
    setForm({ email: '', password: '', full_name: '', role: 'security_officer', shift: 'day' })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Security Officers</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>{editing ? 'Edit Officer' : 'Create Officer'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4 flex-wrap items-end">
            <VoiceInput onTranscript={(text) => setForm({...form, full_name: text})}>
              <Input placeholder="Full name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required className="flex-1" />
            </VoiceInput>
            {!editing && (
              <>
                <VoiceInput onTranscript={(text) => setForm({...form, email: text})}>
                  <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="flex-1" />
                </VoiceInput>
                <VoiceInput onTranscript={(text) => setForm({...form, password: text})}>
                  <Input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                </VoiceInput>
              </>
            )}
            <select className="flex h-10 rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100" value={form.role} onChange={e => setForm({...form, role: e.target.value as Profile['role']})}>
              <option value="security_officer">Security Officer</option>
              <option value="administrator">Administrator</option>
            </select>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
              <ShieldCheck className="w-4 h-4 mr-2" />{loading ? 'Saving...' : (editing ? 'Update' : 'Create')}
            </Button>
            {editing && <Button type="button" variant="outline" onClick={cancelEdit}><X className="w-4 h-4 mr-2" />Cancel</Button>}
          </form>
          {message && <p className={`text-sm mt-2 ${message.includes('success') || message.includes('updated') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}
        </CardContent>
      </Card>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {officers.map(o => (
                  <tr key={o.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 text-sm text-white font-medium">{o.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{o.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 capitalize">{o.role.replace('_', ' ')}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => startEdit(o)} className="text-cyan-400 hover:text-cyan-300 p-1" title="Edit officer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteOfficer(o.id, o.full_name)} className="text-red-400 hover:text-red-300 p-1" title="Delete officer">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
