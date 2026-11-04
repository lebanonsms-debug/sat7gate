'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Globe } from 'lucide-react'

const COMMON_TIMEZONES = [
  'Asia/Beirut',
  'Africa/Cairo',
  'Africa/Nairobi',
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Riyadh',
  'UTC',
]

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timezone, setTimezone] = useState('Asia/Beirut')
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('timezone').eq('id', user.id).single()
      if (data?.timezone) setTimezone(data.timezone)
      setLoading(false)
    }
    load()
  }, [supabase])

  const saveSettings = async () => {
    setSaving(true)
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.from('profiles').update({ timezone }).eq('id', user.id)
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'update_settings', entity_type: 'settings', details: `Timezone: ${timezone}` })
      setMessage('Settings saved')
    } catch (err: any) {
      setMessage(err.message || 'Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader><CardTitle>System Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Timezone</label>
                <div className="flex gap-2">
                  <Globe className="w-4 h-4 text-slate-400 mt-3" />
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {COMMON_TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-500 mt-1">Default: Asia/Beirut (Beirut, Lebanon)</p>
              </div>
              <Button onClick={saveSettings} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">{saving ? 'Saving...' : 'Save Settings'}</Button>
              {message && <p className={`text-sm ${message.includes('saved') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
