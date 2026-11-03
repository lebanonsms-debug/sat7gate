'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [timezone, setTimezone] = useState('Africa/Brazzaville')
  const supabase = createClientComponentClient()

  const saveSettings = async () => {
    setSaving(true)
    await supabase.from('audit_logs').insert({ action: 'update_settings', entity_type: 'settings', details: `Timezone: ${timezone}` })
    setSaving(false)
    alert('Settings saved')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>System Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Timezone</label>
            <Input value={timezone} onChange={e => setTimezone(e.target.value)} />
          </div>
          <Button onClick={saveSettings} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">{saving ? 'Saving...' : 'Save Settings'}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
