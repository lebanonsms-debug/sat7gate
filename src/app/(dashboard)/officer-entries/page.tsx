'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, Clock, Sun, Moon, Users } from 'lucide-react'
import { useTimezone } from '@/hooks/use-timezone'
import { formatInTimezone } from '@/lib/utils/timezone'

type Entry = {
  id: string
  created_at: string
  host_name: string | null
  purpose: string | null
  notes: string | null
  person_name: string
  person_category: string
  company_name: string
  officer_name: string
  officer_shift: 'day' | 'night'
}

const SHIFT_FILTERS = [
  { value: 'all', label: 'All Shifts' },
  { value: 'day', label: 'Day Shift' },
  { value: 'night', label: 'Night Shift' },
] as const

type ShiftFilter = (typeof SHIFT_FILTERS)[number]['value']

export default function SecurityOfficerPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [shift, setShift] = useState<ShiftFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { timezone } = useTimezone()

  const fetchEntries = useCallback(async (shiftValue: ShiftFilter) => {
    setLoading(true)
    setError('')
    try {
      const query = shiftValue === 'all' ? '' : `?shift=${shiftValue}`
      const res = await fetch(`/api/officer-entries${query}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load entries')
      setEntries(data.entries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries(shift) }, [shift, fetchEntries]) // eslint-disable-line react-hooks/set-state-in-effect

  const dayCount = entries.filter(e => e.officer_shift === 'day').length
  const nightCount = entries.filter(e => e.officer_shift === 'night').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Officer</h1>
          <p className="text-slate-400 mt-1">Entries created by security officers — filter by shift</p>
        </div>
        <div className="flex items-center gap-2">
          {SHIFT_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setShift(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] touch-manipulation transition-colors ${
                shift === f.value
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {f.value === 'day' && <Sun className="w-4 h-4 inline mr-1" />}
              {f.value === 'night' && <Moon className="w-4 h-4 inline mr-1" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Entries</p>
              <p className="text-2xl font-bold text-white">{entries.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Day Shift</p>
              <p className="text-2xl font-bold text-white">{dayCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Moon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Night Shift</p>
              <p className="text-2xl font-bold text-white">{nightCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400">Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No entries found</p>
              <p className="text-slate-500 text-sm mt-1">
                {shift === 'all'
                  ? 'New entries created by security officers will appear here'
                  : `No entries found for the ${shift} shift`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Entry Time</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Person</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase hidden sm:table-cell">Category</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase hidden md:table-cell">Company</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase hidden md:table-cell">Host</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Officer</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {entries.map(e => (
                    <tr key={e.id} className="hover:bg-slate-700/20">
                      <td className="px-4 sm:px-6 py-3 text-sm text-slate-300 whitespace-nowrap">
                        {formatInTimezone(e.created_at, timezone)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-white font-medium">
                        {e.person_name}
                        {e.purpose ? <span className="block text-xs text-slate-400 font-normal">{e.purpose}</span> : null}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-slate-300 hidden sm:table-cell">
                        {e.person_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-slate-300 hidden md:table-cell">{e.company_name}</td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-slate-300 hidden md:table-cell">{e.host_name || '-'}</td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-slate-200">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                          {e.officer_name}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          e.officer_shift === 'day'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {e.officer_shift === 'day' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                          {e.officer_shift === 'day' ? 'Day' : 'Night'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
