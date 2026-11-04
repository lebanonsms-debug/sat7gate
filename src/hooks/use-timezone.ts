'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'

export function useTimezone() {
  const [timezone, setTimezone] = useState('Asia/Beirut')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('profiles').select('timezone').eq('id', user.id).single()
      if (data?.timezone) setTimezone(data.timezone)
      setLoading(false)
    }
    load()
  }, [supabase])

  return { timezone, loading }
}
