'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatInTimezone } from '@/lib/utils/timezone'
import { useTimezone } from '@/hooks/use-timezone'
import { ClipboardList } from 'lucide-react'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { timezone } = useTimezone()
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.from('audit_logs').select('*, user:profiles(full_name)').order('created_at', { ascending: false }).limit(200).then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [supabase])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Audit Logs</h1>
          <p className="text-slate-400 mt-1">System activity and change history</p>
        </div>
      </div>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Entity</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Details</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No audit logs found</td></tr>
                ) : logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 text-sm text-white font-medium">{l.action}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 capitalize">{l.entity_type} {l.entity_id?.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{l.details || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{l.user?.full_name || 'System'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{formatInTimezone(l.created_at, timezone, { dateStyle: 'medium', timeStyle: 'short' })}</td>
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
