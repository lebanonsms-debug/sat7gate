'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const supabase = createClientComponentClient()
  useEffect(() => {
    supabase.from('audit_logs').select('*, user:profiles(full_name)').order('created_at', { ascending: false }).limit(200).then(({ data }) => setLogs(data || []))
  }, [supabase])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Entity</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 text-sm text-white">{l.action}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{l.entity_type} {l.entity_id?.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{l.user?.full_name || 'System'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{new Date(l.created_at).toLocaleString()}</td>
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
