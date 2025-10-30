'use client'
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FancyButton } from '@/components/ui/FancyButton'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function ShareForm({ personaId, onShared }: { personaId: number; onShared?: () => void }) {
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<'viewer' | 'editor'>('viewer')
  const [saving, setSaving] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const submit = async () => {
    if (!email.trim()) {
      alert('Veuillez entrer une adresse email')
      return
    }
    
    if (!validateEmail(email)) {
      alert('Adresse email invalide')
      return
    }
    
    setSaving(true)
    setSuccess(false)
    try {
      const r = await fetch(`/api/personas/${personaId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      })
      
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        alert(e.error || 'Erreur lors de l\'envoi de l\'invitation')
        return
      }
      
      const result = await r.json()
      
      // Afficher un message selon le résultat
      if (result.email_sent === false) {
        const errorMsg = result.email_error || 'Inconnue'
        const isDomainError = errorMsg.includes('vérifier un domaine') || errorMsg.includes('only send testing emails')
        
        if (isDomainError) {
          alert(`Invitation créée mais l'email n'a pas pu être envoyé.\n\n⚠️ ${errorMsg}\n\n📧 Solutions:\n1. Utiliser l'adresse email de votre compte Resend (lucasjolym6@gmail.com)\n2. Vérifier un domaine dans Resend: https://resend.com/domains\n3. Partager ce lien manuellement:\n${result.invite_url}`)
        } else {
          alert(`Invitation créée mais l'email n'a pas pu être envoyé.\n\nErreur: ${errorMsg}\n\nVous pouvez partager ce lien manuellement:\n${result.invite_url}`)
        }
      } else {
        setSuccess(true)
        setEmail('')
        setTimeout(() => {
          setSuccess(false)
          onShared?.()
        }, 2000)
      }
    } catch (e: any) {
      alert('Erreur réseau : ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !saving && email.trim()) {
      submit()
    }
  }

  return (
    <div className="mt-4 grid gap-4">
      {success && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600">
          ✓ Invitation envoyée avec succès !
        </div>
      )}
      
      <div className="grid gap-2">
        <Label htmlFor="email" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Adresse email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="exemple@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-2.5 text-sm",
            "text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]",
            "outline-none transition-all duration-200",
            "focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-[hsl(var(--brand))]",
            "hover:border-[hsl(var(--brand))]/50"
          )}
          disabled={saving}
        />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          La personne recevra un email avec un lien pour créer son compte et accéder au Mentis.
        </p>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="role" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Rôle
        </Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className={cn(
            "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-2.5 text-sm",
            "text-[hsl(var(--foreground))] outline-none transition-all duration-200",
            "focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-[hsl(var(--brand))]"
          )}
          disabled={saving}
        >
          <option value="viewer">Lecture seule</option>
          <option value="editor">Édition</option>
        </select>
      </div>
      
      <div className="flex justify-end gap-2">
        <FancyButton 
          onClick={submit} 
          disabled={saving || !email.trim()}
          className="min-w-[120px]"
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Envoi...
            </span>
          ) : (
            'Envoyer invitation'
          )}
        </FancyButton>
      </div>
    </div>
  )
}


