'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'

/** Current user's role (from their own profile). */
export function useRole() {
  const [role, setRole] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setRole(null); return }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setRole(data?.role || null)
    }
    load() // eslint-disable-line react-hooks/set-state-in-effect
  }, [supabase])

  return role
}
