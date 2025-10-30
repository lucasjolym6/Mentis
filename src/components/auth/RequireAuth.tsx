"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabaseClient.auth.getSession()
      if (!data.session) {
        router.replace('/login')
      } else {
        setReady(true)
      }
    })()
  }, [router])

  if (!ready) return null
  return <>{children}</>
}


