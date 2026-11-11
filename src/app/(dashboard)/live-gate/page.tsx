'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LogOut } from 'lucide-react'

export default function LiveGatePage() {
  const [movements, setMovements] = useState<{ id: string; entry_time?: string; entry_officer_id?: string; visitor?: { person?: { full_name?: string; person_category?: string }; company?: { name?: string }; vehicles?: Array<{ manufacturer?: string; model?: string; plate_number?: string }> } }[]>([])
  const [officers, setOfficers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchMovements = useCallback(async () => {
    const { data } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').eq('status', 'inside').order('entry_time', { ascending: false })
    setMovements(data || [])
    setLoading(false)
  }, [supabase])

  const fetchOfficers = useCallback(async () => {
    const { data } = await supabase.from('officer_directory').select('id, full_name')
    setOfficers(data || [])
  }, [supabase])

  useEffect(() => {
    fetchMovements() // eslint-disable-line react-hooks/set-state-in-effect
    fetchOfficers() // eslint-disable-line react-hooks/set-state-in-effect
    const channel = supabase.channel('live-gate')
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'gate_movements' }, fetchMovements).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchMovements, fetchOfficers])

  const markExit = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('gate_movements').update({ exit_time: new Date().toISOString(), exit_officer_id: user.id, status: 'exited' }).eq('id', id)
    if (!error) {
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'mark_exit', entity_type: 'gate_movement', entity_id: id })
    }
    fetchMovements()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Live Gate</h1>
        <p className="text-slate-400 mt-1">Currently inside the building — {movements.length} active</p>
      </div>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Entry Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Officer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">No one currently inside</td></tr>
                ) : movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-white">{m.visitor?.person?.full_name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-300 capitalize hidden sm:table-cell">{m.visitor?.person?.person_category?.replace('_', ' ')}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-300 hidden md:table-cell">{m.visitor?.company?.name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-300 hidden lg:table-cell">{m.visitor?.vehicles?.[0] ? `${m.visitor.vehicles[0].manufacturer} ${m.visitor.vehicles[0].model}` : '-'}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-300 font-mono">{m.visitor?.vehicles?.[0]?.plate_number || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-300 hidden sm:table-cell">{m.entry_time ? new Date(m.entry_time).toLocaleString() : '-'}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-300 hidden md:table-cell">{officers.find(o => o.id === m.entry_officer_id)?.full_name || (m.entry_officer_id || '').slice(0, 8) + '...'}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <Button size="sm" variant="destructive" onClick={() => markExit(m.id)} className="gap-1 min-h-[36px] min-w-[36px]">
                        <LogOut className="w-3 h-3" /> Exit
                      </Button>
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
