'use client'
import { supabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/auth/RequireAuth'

export default function SettingsPage() {
  const router = useRouter()
  const signOut = async () => {
    await supabaseClient.auth.signOut()
    router.replace('/login')
  }
  return (
    <RequireAuth>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <Button variant="outline" onClick={signOut}>Se déconnecter</Button>
      </div>
    </RequireAuth>
  )
}


