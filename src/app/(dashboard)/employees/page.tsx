'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ full_name: '', person_category: 'employee', identification_number: '' })
  const supabase = createClientComponentClient()

  const fetch = async () => {
    const { data } = await supabase.from('persons').select('*').eq('person_category', 'employee').order('full_name')
    setEmployees(data || [])
  }
  useEffect(() => { fetch() }, [supabase])

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('persons').insert(form)
    setForm({ full_name: '', person_category: 'employee', identification_number: '' })
    fetch()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Employees</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>Add Employee</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addEmployee} className="flex gap-4">
            <Input placeholder="Full name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required className="flex-1" />
            <Input placeholder="ID Number" value={form.identification_number} onChange={e => setForm({...form, identification_number: e.target.value})} />
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4" /></Button>
          </form>
        </CardContent>
      </Card>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID Number</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {employees.map(e => (
                <tr key={e.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4 text-sm text-white">{e.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{e.identification_number || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
