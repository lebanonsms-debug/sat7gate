'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, UserPlus, Activity, Users, Car, Building2, QrCode, FileText, Settings, LogOut, ShieldCheck, BarChart3 } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['security_officer', 'administrator', 'management', 'viewer'] },
  { href: '/register-entry', label: 'Register Entry', icon: UserPlus, roles: ['security_officer', 'administrator'] },
  { href: '/live-gate', label: 'Live Gate', icon: Activity, roles: ['security_officer', 'administrator', 'management', 'viewer'] },
  { href: '/live-occupancy', label: 'Live Occupancy', icon: BarChart3, roles: ['security_officer', 'administrator', 'management', 'viewer'] },
  { href: '/visitor-history', label: 'Visitor History', icon: Users, roles: ['security_officer', 'administrator', 'management', 'viewer'] },
  { href: '/employees', label: 'Employees', icon: ShieldCheck, roles: ['security_officer', 'administrator'] },
  { href: '/vehicles', label: 'Vehicles', icon: Car, roles: ['security_officer', 'administrator'] },
  { href: '/companies', label: 'Companies', icon: Building2, roles: ['administrator'] },
  { href: '/qr-passes', label: 'QR Passes', icon: QrCode, roles: ['security_officer', 'administrator'] },
  { href: '/reports', label: 'Reports', icon: FileText, roles: ['administrator', 'management'] },
  { href: '/security-officers', label: 'Security Officers', icon: ShieldCheck, roles: ['administrator'] },
  { href: '/audit-logs', label: 'Audit Logs', icon: FileText, roles: ['administrator'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['administrator'] },
]

export function Sidebar({ role, onLogout }: { role: string; onLogout: () => void }) {
  const pathname = usePathname()
  const filtered = navItems.filter(item => item.roles.includes(role))

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-700 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">SAT7 GATE</h1>
            <p className="text-xs text-slate-400">Security Control</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filtered.map(item => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={active ? 'default' : 'ghost'}
                className={cn('w-full justify-start gap-3', active ? 'bg-cyan-600 hover:bg-cyan-700' : 'text-slate-300 hover:text-white hover:bg-slate-800')}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
