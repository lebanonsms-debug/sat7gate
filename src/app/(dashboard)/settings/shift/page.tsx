'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'

const SHIFT_OPTIONS = [
  { value: 'day', label: 'Day Shift' },
  { value: 'night', label: 'Night Shift' },
] as const

export default function ShiftSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shift, setShift] = useState('day')
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('shift').eq('id', user.id).single()
      if (data?.shift) setShift(data.shift)
      setLoading(false)
    }
    load()
  }, [supabase])

  const saveShift = async () => {
    setSaving(true)
    setMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.from('profiles').update({ shift }).eq('id', user.id)
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'update_shift', entity_type: 'settings', details: `Shift: ${shift}` })
      setMessage('Shift saved')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving shift'
      setMessage(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-6 max-w-2xl'>
      <h1 className='text-3xl font-bold text-white'>Shift Selector</h1>
      <Card className='border-slate-700 bg-slate-800/50'>
        <CardHeader>
          <CardTitle><Clock className='w-5 h-5 mr-2' />Current Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <span className='text-lg text-slate-200'>{shift === 'day' ? '☀️ Day Shift' : '🌙 Night Shift'}</span>
            <span className={`px-3 py-1 rounded-full text-sm ${shift === 'day' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
              {shift === 'day' ? 'Day' : 'Night'}
            </span>
          </div>
          <p className='text-sm text-slate-400 mt-2'>
            This is your current shift. It will be shown on the dashboard when you create new entries.
          </p>
        </CardContent>
      </Card>

      <Card className='border-slate-700 bg-slate-800/50'>
        <CardHeader>
          <CardTitle>Change Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col sm:flex-row gap-4 items-stretch'>
            <Button
              onClick={() => setShift('day')}
              className={`flex-1 h-12 ${shift === 'day' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              ☀️ Day Shift
            </Button>
            <Button
              onClick={() => setShift('night')}
              className={`flex-1 h-12 ${shift === 'night' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              🌙 Night Shift
            </Button>
          </div>
          <Button
            onClick={saveShift}
            className='bg-cyan-600 hover:bg-cyan-700 mt-4 h-12 w-full'
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Shift'}
          </Button>
          {message && <p className={'text-sm mt-2 ' + (message.includes('saved') || message.includes('Shift') ? 'text-emerald-400' : 'text-red-400')}>{message}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
