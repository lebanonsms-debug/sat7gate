'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#22d3ee', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

export default function ReportsPage() {
  const [daily, setDaily] = useState<{ hour: string; count: number }[]>([])
  const [byCompany, setByCompany] = useState<{ name: string; count: number }[]>([])
  const [byCategory, setByCategory] = useState<{ name: string; count: number }[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchReports = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data: movements } = await supabase.from('gate_movements').select('*, visitor:visitors(*, person:persons(*), company:companies(*))').gte('entry_time', today)
      const list = movements || []
      
      // Hourly distribution
      const hours: Record<number, number> = {}
      list.forEach((m) => { const h = new Date((m as { entry_time?: string }).entry_time || '').getHours(); hours[h] = (hours[h] || 0) + 1 })
      const hourly = Object.entries(hours).map(([hour, count]) => ({ hour: `${hour}:00`, count })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
      setDaily(hourly)

      // By company
      const companies: Record<string, number> = {}
      list.forEach((m) => { const name = (m as { visitor?: { company?: { name?: string } } }).visitor?.company?.name || 'Unknown'; companies[name] = (companies[name] || 0) + 1 })
      setByCompany(Object.entries(companies).map(([name, count]) => ({ name, count })))

      // By category
      const categories: Record<string, number> = {}
      list.forEach((m) => { const cat = (m as { visitor?: { person?: { person_category?: string } } }).visitor?.person?.person_category?.replace('_', ' ') || 'unknown'; categories[cat] = (categories[cat] || 0) + 1 })
      setByCategory(Object.entries(categories).map(([name, count]) => ({ name, count })))
    }
    fetchReports()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
        <p className="text-slate-400 mt-1">Daily activity overview</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader><CardTitle>Hourly Entries Today</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader><CardTitle>By Company</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={byCompany} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="count">
                  {byCompany.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
