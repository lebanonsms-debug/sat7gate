'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, UserPlus, Activity, Users, Car,
  Building2, QrCode, FileText, Settings, LogOut,
  ShieldCheck, BarChart3, History as HistoryIcon,
  Camera, ClipboardList
} from 'lucide-react'
import type { Profile } from '@/lib/types'

const navSections = [
  {
    title: 'Operational Gate',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['security_officer', 'administrator', 'management', 'viewer'] },
      { href: '/register-entry', label: 'Register Entry', icon: UserPlus, roles: ['security_officer', 'administrator'], badge: 'Quick' },
      { href: '/live-gate', label: 'Live Gate', icon: Activity, roles: ['security_officer', 'administrator', 'management', 'viewer'], badge: 'Live' },
      { href: '/live-occupancy', label: 'Live Occupancy', icon: BarChart3, roles: ['security_officer', 'administrator', 'management', 'viewer'] },
    ]
  },
  {
    title: 'Database & Lookup',
    items: [
      { href: '/visitor-history', label: 'Visitor History', icon: HistoryIcon, roles: ['security_officer', 'administrator', 'management', 'viewer'] },
      { href: '/employees', label: 'Employees', icon: Users, roles: ['security_officer', 'administrator'] },
      { href: '/vehicles', label: 'Vehicles', icon: Car, roles: ['security_officer', 'administrator'] },
      { href: '/qr-passes', label: 'QR Visitor Passes', icon: QrCode, roles: ['security_officer', 'administrator'], badge: '2' },
      { href: '/companies', label: 'Companies', icon: Building2, roles: ['administrator'] },
    ]
  },
  {
    title: 'Management & Control',
    items: [
      { href: '/reports', label: 'Reports & Analytics', icon: FileText, roles: ['administrator', 'management'] },
      { href: '/security-officers', label: 'Security Officers', icon: ShieldCheck, roles: ['administrator'] },
      { href: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, roles: ['administrator'] },
      { href: '/settings', label: 'Settings', icon: Settings, roles: ['administrator'] },
    ]
  }
]

export function Sidebar({ profile, onLogout }: { profile: Profile | null; onLogout: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-slate-950 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">SAT7 GATE</h1>
            <p className="text-xs text-slate-400">Control Center v2.4</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navSections.map(section => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">{section.title}</h3>
            <div className="space-y-1">
              {section.items.filter(item => item.roles.includes(profile?.role || '')).map(item => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={active ? 'default' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 relative',
                        active
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                      {item.badge && (
                        <span className={cn(
                          'ml-auto text-xs px-2 py-0.5 rounded-full',
                          item.badge === 'Live'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item.badge === 'Quick'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-slate-400 capitalize">{profile?.role?.replace('_', ' ') || 'User'}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-900" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
