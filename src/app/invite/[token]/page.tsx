'use client'
import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase-browser'
import { GlassCard } from '@/components/ui/GlassCard'
import { FancyButton } from '@/components/ui/FancyButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function InvitePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = params?.token

  const [invite, setInvite] = React.useState<{
    email: string
    persona_name: string
    persona_id: number
    role: 'viewer' | 'editor'
    valid: boolean
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [accepting, setAccepting] = React.useState(false)
  
  // Form states
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const [mode, setMode] = React.useState<'signup' | 'signin'>('signup')

  // Charger l'invitation
  React.useEffect(() => {
    if (!token) {
      setError('Token d\'invitation invalide')
      setLoading(false)
      return
    }

    async function loadInvite() {
      try {
        const res = await fetch(`/api/invitations/${token}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setError(err.error || 'Invitation introuvable ou expirée')
          setLoading(false)
          return
        }

        const data = await res.json()
        setInvite(data)
        setEmail(data.email)
        setLoading(false)
      } catch (e: any) {
        setError('Erreur lors du chargement de l\'invitation')
        setLoading(false)
      }
    }

    loadInvite()
  }, [token])

  // Vérifier si l'utilisateur est déjà connecté
  React.useEffect(() => {
    if (!invite || loading) return

    async function checkAuth() {
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (session?.user) {
        // Utilisateur déjà connecté: accepter directement l'invitation
        handleAcceptInvite(session.user.id)
      }
    }

    checkAuth()
  }, [invite, loading])

  const handleAcceptInvite = async (userId?: string) => {
    if (!invite || !token) return

    setAccepting(true)
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || 'Erreur lors de l\'acceptation de l\'invitation')
        return
      }

      // Rediriger vers le dashboard ou la page du persona
      router.push(`/personas/${invite.persona_id}`)
    } catch (e: any) {
      setError('Erreur réseau : ' + e.message)
    } finally {
      setAccepting(false)
    }
  }

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setAccepting(true)
    setError(null)

    try {
      // Créer le compte
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/invite/${token}`,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError('Erreur lors de la création du compte')
        return
      }

      // Accepter l'invitation avec le nouvel utilisateur
      await handleAcceptInvite(authData.user.id)
    } catch (e: any) {
      setError('Erreur : ' + e.message)
    } finally {
      setAccepting(false)
    }
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setAccepting(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError('Erreur lors de la connexion')
        return
      }

      // Accepter l'invitation
      await handleAcceptInvite(authData.user.id)
    } catch (e: any) {
      setError('Erreur : ' + e.message)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">Chargement de l'invitation...</p>
        </GlassCard>
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Invitation invalide</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">{error}</p>
          <FancyButton onClick={() => router.push('/login')}>Aller à la page de connexion</FancyButton>
        </GlassCard>
      </div>
    )
  }

  if (!invite) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(var(--bg))]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))] mb-2">
              Invitation à rejoindre un Mentis
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Vous avez été invité à accéder à <strong>{invite.persona_name}</strong>
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
              {invite.role === 'editor' ? '📝 Édition' : '👁️ Lecture seule'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-[hsl(var(--foreground))]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={true}
                className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-foreground))]"
              />
            </div>

            {mode === 'signup' && (
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Nom
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
                  disabled={accepting}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-[hsl(var(--foreground))]">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Choisissez un mot de passe' : 'Votre mot de passe'}
                className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
                disabled={accepting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !accepting) {
                    mode === 'signup' ? handleSignUp() : handleSignIn()
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
              <span>{mode === 'signup' ? 'Déjà un compte ?' : 'Pas encore de compte ?'}</span>
              <button
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup')
                  setError(null)
                }}
                className="text-[hsl(var(--brand))] hover:underline"
                disabled={accepting}
              >
                {mode === 'signup' ? 'Se connecter' : 'Créer un compte'}
              </button>
            </div>

            <FancyButton
              onClick={mode === 'signup' ? handleSignUp : handleSignIn}
              disabled={accepting || !password || (mode === 'signup' && !name)}
              className="w-full"
            >
              {accepting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {mode === 'signup' ? 'Création...' : 'Connexion...'}
                </span>
              ) : (
                mode === 'signup' ? 'Créer mon compte et accepter' : 'Se connecter et accepter'
              )}
            </FancyButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

