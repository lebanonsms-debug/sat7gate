'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { VoiceInput } from '@/components/ui/voice-input'
import { Plus, Trash2 } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ full_name: '', person_category: 'employee' as any, identification_number: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  const fetch = async () => {
    const { data } = await supabase.from('persons').select('*').eq('person_category', 'employee').order('full_name')
    setEmployees(data || [])
  }
  useEffect(() => { fetch() }, [supabase])

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('persons').insert({ ...form, updated_at: new Date().toISOString() }).select().single()
      if (error) throw error

      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'create_employee', entity_type: 'person', entity_id: data.id, details: `Created employee ${form.full_name}` })

      setForm({ full_name: '', person_category: 'employee', identification_number: '' })
      setMessage('Employee added successfully')
      fetch()
    } catch (err: any) {
      setMessage(err.message || 'Error adding employee')
    } finally {
      setLoading(false)
    }
  }

  const deleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Delete employee "${name}"?`)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('persons').delete().eq('id', id)
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'delete_employee', entity_type: 'person', entity_id: id, details: `Deleted employee ${name}` })
    fetch()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Employees</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>Add Employee</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addEmployee} className="flex gap-4 flex-wrap items-end">
            <VoiceInput onTranscript={(text) => setForm({...form, full_name: text})}>
              <Input placeholder="Full name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required className="flex-1" />
            </VoiceInput>
            <VoiceInput onTranscript={(text) => setForm({...form, identification_number: text})}>
              <Input placeholder="ID Number" value={form.identification_number} onChange={e => setForm({...form, identification_number: e.target.value})} />
            </VoiceInput>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />{loading ? 'Adding...' : 'Add'}
            </Button>
          </form>
          {message && <p className={`text-sm mt-2 ${message.includes('success') || message.includes('added') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}
        </CardContent>
      </Card>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No employees found</p>
              <p className="text-slate-500 text-sm mt-1">Add your first employee using the form above</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID Number</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {employees.map(e => (
                  <tr key={e.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 text-sm text-white font-medium">{e.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{e.identification_number || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{new Date(e.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => deleteEmployee(e.id, e.full_name)} className="text-red-400 hover:text-red-300 p-1" title="Delete employee">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
