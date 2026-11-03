'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Search, Filter } from 'lucide-react'

export default function VisitorHistoryPage() {
  const [records, setRecords] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').order('entry_time', { ascending: false }).limit(100)
      setRecords(data || [])
      setLoading(false)
    }
    fetch()
  }, [supabase])

  const filtered = records.filter((m: any) => {
    if (!search) return true
    const name = m.visitor?.person?.full_name?.toLowerCase() || ''
    const plate = m.visitor?.vehicles?.[0]?.plate_number?.toLowerCase() || ''
    return name.includes(search.toLowerCase()) || plate.includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Visitor History</h1>
        <p className="text-slate-400 mt-1">Complete entrance and exit history</p>
      </div>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-10" placeholder="Search by name or license plate..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Entry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Exit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">No records found</td></tr>
                ) : filtered.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 text-sm font-medium text-white">{m.visitor?.person?.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 capitalize">{m.visitor?.person?.person_category?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{m.visitor?.company?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{new Date(m.entry_time).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{m.exit_time ? new Date(m.exit_time).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${m.status === 'inside' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>{m.status}</span></td>
                    <td className="px-6 py-4 text-sm text-slate-300">{m.entry_officer_id.slice(0, 8)}...</td>
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
