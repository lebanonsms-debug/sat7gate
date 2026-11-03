'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Download } from 'lucide-react'

export default function QrPassesPage() {
  const [passes, setPasses] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.from('visitor_passes').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').then(({ data }) => setPasses(data || []))
  }, [supabase])

  const generatePass = async (visitorId: string) => {
    const token = crypto.randomUUID()
    const { data } = await supabase.from('visitor_passes').insert({ visitor_id: visitorId, token_hash: token, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }).select().single()
    if (data) setPasses([data, ...passes])
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">QR Visitor Passes</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader><CardTitle>Generated Passes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {passes.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-white">{p.visitor?.person?.full_name}</p>
                    <p className="text-xs text-slate-400">Expires: {new Date(p.expires_at).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" onClick={() => setSelected(p)} className="bg-cyan-600 hover:bg-cyan-700">View QR</Button>
                </div>
              ))}
              {passes.length === 0 && <p className="text-slate-500 text-sm">No passes generated yet</p>}
            </div>
          </CardContent>
        </Card>
        {selected && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader><CardTitle>QR Pass</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={selected.token_hash} size={200} />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">{selected.visitor?.person?.full_name}</p>
                <p className="text-slate-400 text-sm">{selected.visitor?.company?.name}</p>
                <p className="text-slate-500 text-xs mt-1">Expires: {new Date(selected.expires_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Download className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
