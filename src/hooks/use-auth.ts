'use client'

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
