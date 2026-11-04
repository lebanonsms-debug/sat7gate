'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { VoiceInput } from '@/components/ui/voice-input'
import { ShieldCheck, UserPlus, Trash2 } from 'lucide-react'
import type { Profile } from '@/lib/types'

const ROLES = [
  { value: 'administrator', label: 'Administrator', color: 'bg-red-500/20 text-red-400' },
  { value: 'security_officer', label: 'Security Officer', color: 'bg-cyan-500/20 text-cyan-400' },
  { value: 'management', label: 'Management', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'viewer', label: 'Viewer', color: 'bg-slate-500/20 text-slate-400' },
]

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'security_officer' as Profile['role'] })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setUsers(data || [])
  }

  useEffect(() => { fetchUsers() }, [supabase])

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, full_name: form.full_name, role: form.role }),
      })
      const result = await res.json()
      if (!res.ok) {
        setMessage(result.error || 'Failed to create user')
      } else {
        setForm({ email: '', password: '', full_name: '', role: 'security_officer' })
        setMessage('User created successfully!')
        fetchUsers()
      }
    } catch (err: any) {
      setMessage(err.message || 'Error creating user')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    await supabase.auth.admin.deleteUser(id)
    await supabase.from('profiles').delete().eq('id', id)
    fetchUsers()
  }

  const toggleActive = async (user: Profile) => {
    await supabase.from('profiles').update({ active: !user.active }).eq('id', user.id)
    fetchUsers()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users & Roles</h1>
          <p className="text-slate-400 mt-1">Manage administrators, security officers, and other roles</p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-cyan-500" />
          <span className="text-sm text-slate-400">{users.length} users</span>
        </div>
      </div>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>Create New User</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                <VoiceInput onTranscript={(text) => setForm({...form, full_name: text})}>
                  <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
                </VoiceInput>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                <VoiceInput onTranscript={(text) => setForm({...form, email: text})}>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </VoiceInput>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password *</label>
                <VoiceInput onTranscript={(text) => setForm({...form, password: text})}>
                  <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                </VoiceInput>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role *</label>
                <select 
                  className="flex h-10 w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100"
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value as Profile['role']})}
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            {message && <p className={`text-sm ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map(user => {
                  const roleInfo = ROLES.find(r => r.value === user.role) || ROLES[1]
                  return (
                    <tr key={user.id} className="hover:bg-slate-700/20">
                      <td className="px-6 py-4 text-sm text-white font-medium">{user.full_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button 
                          onClick={() => toggleActive(user)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.active 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {user.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button 
                          onClick={() => deleteUser(user.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
