'use client'
import { supabaseClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import RequireAuth from '@/components/auth/RequireAuth'

export default function SettingsPage() {
  const router = useRouter()
  const signOut = async () => {
    await supabaseClient.auth.signOut()
    router.replace('/login')
  }
  return (
    <RequireAuth>
      <div className="space-y-6">
        <div className="text-sm text-gray-500">
          <span className="text-gray-600">Accueil</span>
          <span className="mx-2">/</span>
          <span>Paramètres</span>
        </div>

        <div className="glass-card p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
          <p className="text-sm text-gray-500">Gérez les préférences de votre compte</p>
          <div className="mt-6">
            <Button variant="secondary" onClick={signOut}>Se déconnecter</Button>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}


