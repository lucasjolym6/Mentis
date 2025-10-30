"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import RequireAuth from '@/components/auth/RequireAuth'
import { supabaseClient } from '@/lib/supabase-browser'
import { PersonaHeader } from '@/components/persona/PersonaHeader'
import { ChatPanel } from '@/components/persona/ChatPanel'
import { DocumentPanel } from '@/components/persona/DocumentPanel'
import Link from 'next/link'
import { ShareForm } from '@/components/persona/ShareForm'
import { Button } from '@/components/ui/button'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Dialog from '@radix-ui/react-dialog'

export default function PersonaPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const idStr = params?.id
  const personaId = Number(idStr)
  const [persona, setPersona] = useState<{ id: number; name: string; description?: string | null; avatar?: string | null } | null>(null)
  const [initialDocs, setInitialDocs] = useState<Array<{ id: number; content: string; created_at?: string }>>([])
  const [initialMessages, setInitialMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'chat' | 'profile' | 'educate'>('chat')
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    if (!personaId) return
    ;(async () => {
      setLoading(true)
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const p = supabaseClient
        .from('personas')
        .select('id, name, description, avatar')
        .eq('id', personaId)
        .single()
      const d = supabaseClient
        .from('documents')
        .select('id, content, created_at')
        .eq('persona_id', personaId)
        .order('created_at', { ascending: false })
      const m = supabaseClient
        .from('messages')
        .select('id, role, content, created_at')
        .eq('persona_id', personaId)
        .order('created_at', { ascending: true })

      const [pRes, dRes, mRes] = await Promise.all([p, d, m])
      if (pRes.error || !pRes.data) {
        alert("Jumeau introuvable ou accès refusé.")
        router.replace('/dashboard')
        return
      }
      setPersona({ id: pRes.data.id, name: pRes.data.name, description: pRes.data.description, avatar: pRes.data.avatar })
      setInitialDocs((dRes.data as any) || [])
      setInitialMessages(((mRes.data as any) || []).map((x: any) => ({ role: x.role, content: x.content })))
      setLoading(false)
    })()
  }, [personaId, router])

  return (
    <RequireAuth>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
        {loading ? (
          <div className="text-slate-500">Chargement…</div>
        ) : persona ? (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                <span className="mx-2">/</span>
                <span>{persona.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await fetch(`/api/personas/${personaId}/duplicate`, { method: 'POST' })
                    alert('Mentis dupliqué')
                  }}
                >
                  Dupliquer
                </Button>
                <Dialog.Root open={shareOpen} onOpenChange={setShareOpen}>
                  <Dialog.Trigger asChild>
                    <Button variant="secondary">Partager</Button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 shadow-xl z-50">
                      <Dialog.Title className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                        Partager ce Mentis
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                        Invitez quelqu'un par email. Il recevra un lien pour créer son compte et accéder à ce Mentis.
                      </Dialog.Description>
                      <ShareForm 
                        personaId={personaId} 
                        onShared={() => {
                          setShareOpen(false)
                        }}
                      />
                      <Dialog.Close asChild>
                        <button className="absolute right-4 top-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                          ✕
                        </button>
                      </Dialog.Close>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <Button variant="ghost">Supprimer</Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/40" />
                    <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                      <AlertDialog.Title className="text-lg font-semibold">Supprimer ce Mentis</AlertDialog.Title>
                      <AlertDialog.Description className="mt-1 text-sm text-slate-500">
                        Cette action est irréversible. Les documents et messages associés seront supprimés.
                      </AlertDialog.Description>
                      <div className="mt-4 flex justify-end gap-2">
                        <AlertDialog.Cancel asChild>
                          <Button variant="ghost">Annuler</Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              const r = await fetch(`/api/personas/${personaId}`, { method: 'DELETE' })
                              if (!r.ok) {
                                const e = await r.json().catch(() => ({}))
                                alert(e.error || 'Erreur lors de la suppression')
                                return
                              }
                              window.location.href = '/dashboard'
                            }}
                          >
                            Confirmer
                          </Button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </div>
            </div>
            <PersonaHeader name={persona.name} description={persona.description} avatar={persona.avatar} />

            <div className="mt-2 flex gap-2">
              {(['chat','profile','educate'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-xl border ${tab===t ? 'bg-white text-gray-900 border-gray-200' : 'bg-white/60 text-gray-600 border-gray-200 hover:bg-white'}`}
                >
                  {t === 'chat' ? 'Chat' : t === 'profile' ? 'Profil du Mentis' : 'Eduquer le Mentis'}
                </button>
              ))}
            </div>

            {tab === 'chat' && (
              <div className="glass-card p-4">
                <ChatPanel personaId={personaId} initialMessages={initialMessages} />
              </div>
            )}
            {tab === 'profile' && (
              <div className="glass-card p-4 min-h-[360px]">
                <DocumentPanel
                  personaId={personaId}
                  initialDocs={[]}
                  persona={persona || undefined}
                  onPersonaUpdated={(p) => setPersona(p)}
                  mode="profileOnly"
                />
              </div>
            )}
            {tab === 'educate' && (
              <div className="glass-card p-4 min-h-[480px]">
                <DocumentPanel
                  personaId={personaId}
                  initialDocs={initialDocs}
                  persona={persona || undefined}
                  onPersonaUpdated={(p) => setPersona(p)}
                  mode="docsOnly"
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-slate-500">Persona introuvable.</div>
        )}
      </motion.div>
    </RequireAuth>
  )
}


