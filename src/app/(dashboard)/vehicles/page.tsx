'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const supabase = createClientComponentClient()
  useEffect(() => {
    supabase.from('vehicles').select('*, person:persons(*)').then(({ data }) => setVehicles(data || []))
  }, [supabase])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Vehicles</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plate</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Person</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Make/Model</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Color</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4 text-sm font-mono text-white">{v.plate_number}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.person?.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.manufacturer} {v.model}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.color}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
