'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { VoiceInput } from '@/components/ui/voice-input'
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
            <VoiceInput onTranscript={(text) => setForm({...form, full_name: text})}>
              <Input placeholder="Full name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
            </VoiceInput>
            <VoiceInput onTranscript={(text) => setForm({...form, email: text})}>
              <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </VoiceInput>
            <VoiceInput onTranscript={(text) => setForm({...form, password: text})}>
              <Input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </VoiceInput>
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
