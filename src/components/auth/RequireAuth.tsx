"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase-browser'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login')
      else setReady(true)
    })
    const { data: sub } = supabaseClient.auth.onAuthStateChange((_evt, session) => {
      if (!session) router.replace('/login')
    })
    return () => sub?.subscription.unsubscribe()
  }, [router])

  if (!ready) return null
  return <>{children}</>
}


