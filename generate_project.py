#!/usr/bin/env python3
"""Generate SAT7 GATE project files."""
import os

BASE = r"C:\Users\elielb\sat7-gate\src"

FILES = {}

# ──────────────────────────────────────────────
# lib/supabase/client.ts
FILES[f"{BASE}/lib/supabase/client.ts"] = r'''import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export function createClientComponentClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
'''

# ──────────────────────────────────────────────
# lib/types.ts
FILES[f"{BASE}/lib/types.ts"] = r'''export type Role = 'security_officer' | 'administrator' | 'management' | 'viewer'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  active: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  identifier: string
  color: string
  active: boolean
  created_at: string
}

export type PersonCategory = 'employee' | 'guest' | 'rental_company' | 'delivery' | 'contractor' | 'supplier' | 'other'

export interface Person {
  id: string
  full_name: string
  person_category: PersonCategory
  identification_number?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  person_id: string
  manufacturer?: string
  model?: string
  color?: string
  plate_number?: string
  created_at: string
}

export interface Visitor {
  id: string
  person_id: string
  destination_company_id: string
  host_name?: string
  purpose?: string
  notes?: string
  created_by: string
  created_at: string
}

export type MovementStatus = 'inside' | 'exited' | 'pending'

export interface GateMovement {
  id: string
  visitor_id: string
  entry_time: string
  exit_time?: string
  entry_officer_id: string
  exit_officer_id?: string
  status: MovementStatus
  created_at: string
}

export interface VisitorPass {
  id: string
  visitor_id: string
  token_hash: string
  expires_at: string
  revoked_at?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  details?: string
  created_at: string
}

export interface LprEvent {
  id: string
  plate_number?: string
  confidence_score?: number
  image_path?: string
  recognition_status: string
  created_at: string
}
'''

# ──────────────────────────────────────────────
# lib/utils.ts
FILES[f"{BASE}/lib/utils.ts"] = r'''import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
'''

# ──────────────────────────────────────────────
# hooks/use-auth.ts
FILES[f"{BASE}/hooks/use-auth.ts"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import type { Profile, Role } from '@/lib/types'

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          setProfile(data as Profile)
          setRole((data as Profile).role)
        }
      }
      setLoading(false)
    }
    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) {
          setProfile(data as Profile)
          setRole((data as Profile).role)
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setRole(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setRole(null)
  }

  return { profile, role, loading, signOut }
}
'''

# ──────────────────────────────────────────────
# components/ui/button.tsx
FILES[f"{BASE}/components/ui/button.tsx"] = r'''import * as React from 'react'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    default: 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-500/20',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-slate-600 bg-transparent hover:bg-slate-800 text-slate-200',
    ghost: 'hover:bg-slate-800 text-slate-200',
  }
  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6 text-lg',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
'''

# ──────────────────────────────────────────────
# components/ui/card.tsx
FILES[f"{BASE}/components/ui/card.tsx"] = r'''import * as React from 'react'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6 shadow-xl', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-slate-100', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />
}
'''

# ──────────────────────────────────────────────
# components/ui/input.tsx
FILES[f"{BASE}/components/ui/input.tsx"] = r'''import * as React from 'react'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
'''

# ──────────────────────────────────────────────
# components/ui/select.tsx
FILES[f"{BASE}/components/ui/select.tsx"] = r'''import * as React from 'react'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
'''

# ──────────────────────────────────────────────
# components/layout/sidebar.tsx
FILES[f"{BASE}/components/layout/sidebar.tsx"] = r''''use client'

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
'''

# ──────────────────────────────────────────────
# components/layout/top-nav.tsx
FILES[f"{BASE}/components/layout/top-nav.tsx"] = r''''use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export function TopNav({ profile }: { profile: Profile | null }) {
  const [time, setTime] = useState(new Date())
  const supabase = createClientComponentClient()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-slate-300">
          {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>
        <span className="text-cyan-400 font-mono text-sm">{time.toLocaleTimeString()}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
          <p className="text-xs text-slate-400 capitalize">{profile?.role?.replace('_', ' ') || ''}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
'''

# ──────────────────────────────────────────────
# app/globals.css (updated theme)
FILES[f"{BASE}/app/globals.css"] = r'''@import "tailwindcss";

@theme inline {
  --color-background: #0B0F19;
  --color-foreground: #E2E8F0;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-cyan-400: #22d3ee;
  --color-cyan-600: #0891b2;
  --color-cyan-700: #0e7490;
  --color-slate-800: #1e293b;
  --color-slate-900: #0f172a;
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #0f172a;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
'''

# ──────────────────────────────────────────────
# app/layout.tsx (updated)
FILES[f"{BASE}/app/layout.tsx"] = r'''import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAT7 GATE - Security Entrance Management",
  description: "Smart Security Entrance & Building Access Management System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0B0F19] text-slate-100">
        {children}
      </body>
    </html>
  );
}
'''

# ──────────────────────────────────────────────
# app/api/auth/login/route.ts
FILES[f"{BASE}/app/api/auth/login/route.ts"] = r'''import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
'''

print("Writing core files...")
for path, content in FILES.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  wrote {path}")

print("Done")
