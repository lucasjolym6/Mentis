// src/components/persona/DocumentPanel.tsx
"use client"
import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagEditor } from '@/components/persona/TagEditor'
import { supabaseClient } from '@/lib/supabase-browser'

type Doc = { id: number; content: string; created_at?: string; tags?: string[] }

export function DocumentPanel({ personaId, initialDocs = [], persona, onPersonaUpdated, mode = 'all' }: { personaId: number; initialDocs?: Doc[]; persona?: { id: number; name: string; description?: string | null; tone?: string | null; constraints?: string | null; system_prompt?: string | null; status?: 'active' | 'draft' | null }; onPersonaUpdated?: (p: any) => void; mode?: 'all' | 'profileOnly' | 'docsOnly' }) {
  const [docs, setDocs] = React.useState<Doc[]>(initialDocs)
  const [content, setContent] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [pName, setPName] = React.useState(persona?.name || '')
  const [pDesc, setPDesc] = React.useState(persona?.description || '')
  const [pTone, setPTone] = React.useState(persona?.tone || '')
  const [pConstraints, setPConstraints] = React.useState(persona?.constraints || '')
  const [pSystem, setPSystem] = React.useState(persona?.system_prompt || '')
  const [pStatus, setPStatus] = React.useState<'active' | 'draft'>(persona?.status || 'active')
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabaseClient
      .from('documents')
      .select('id, content, created_at, tags')
      .eq('persona_id', personaId)
      .order('created_at', { ascending: false })
    setDocs((data as Doc[]) || [])
    setLoading(false)
  }

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId])

  React.useEffect(() => {
    setPName(persona?.name || '')
    setPDesc(persona?.description || '')
    setPTone(persona?.tone || '')
    setPConstraints(persona?.constraints || '')
    setPSystem(persona?.system_prompt || '')
    setPStatus((persona?.status as any) || 'active')
  }, [persona?.name, persona?.description, persona?.tone, persona?.constraints, persona?.system_prompt, persona?.status])

  const ingest = async () => {
    const text = content.trim()
    if (text.length < 5) {
      alert('Le document doit contenir au moins 5 caractères.')
      return
    }
    setSaving(true)
    // optimistic append
    const optimistic: Doc = { id: -Date.now(), content: text, created_at: new Date().toISOString() }
    setDocs((d) => [optimistic, ...d])
    try {
      const r = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: personaId, content: text }),
      })
      if (!r.ok) {
        // rollback optimistic
        setDocs((d) => d.filter((x) => x.id !== optimistic.id))
        if (r.status === 429) {
          alert("OpenAI indisponible (quota). Réessayez plus tard.")
        } else {
          const e = await r.json().catch(() => ({}))
          alert(e.error || 'Erreur lors de l\'ajout du document')
        }
        return
      }
      setContent('')
      // refresh from source of truth
      load()
      alert('Document ajouté avec succès')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {mode !== 'docsOnly' && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">Profil</div>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="pname">Nom</Label>
              <Input id="pname" value={pName} onChange={(e) => setPName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pdesc">Description / style</Label>
              <Input id="pdesc" value={pDesc ?? ''} onChange={(e) => setPDesc(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ptone">Ton</Label>
              <Input id="ptone" value={pTone} onChange={(e) => setPTone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pconstraints">Contraintes</Label>
              <Input id="pconstraints" value={pConstraints} onChange={(e) => setPConstraints(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="psystem">Consignes système</Label>
              <Input id="psystem" value={pSystem} onChange={(e) => setPSystem(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pstatus">Statut</Label>
              <select id="pstatus" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={pStatus} onChange={(e) => setPStatus(e.target.value as any)}>
                <option value="active">Actif</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  if (!pName || pName.trim().length < 2) {
                    alert('Le nom doit contenir au moins 2 caractères.')
                    return
                  }
                  if (!Number.isFinite(personaId as any)) {
                    alert('Identifiant de Mentis invalide. Rechargez la page et réessayez.')
                    return
                  }
                  setSavingProfile(true)
                  try {
                    const r = await fetch(`/api/personas/${personaId}?id=${personaId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: personaId, name: pName, description: pDesc, tone: pTone, constraints: pConstraints, system_prompt: pSystem, status: pStatus }),
                    })
                    if (!r.ok) {
                      const e = await r.json().catch(() => ({}))
                      alert(e.error || 'Erreur lors de la mise à jour')
                      return
                    }
                    const updated = await r.json()
                    onPersonaUpdated?.(updated)
                    alert('Profil mis à jour')
                  } finally {
                    setSavingProfile(false)
                  }
                }}
                disabled={savingProfile}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {mode !== 'profileOnly' && (
      <>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Documents</div>
          <div className="flex items-center gap-2">
            <Dialog.Root open={uploadOpen} onOpenChange={setUploadOpen}>
              <Dialog.Trigger asChild>
                <Button size="sm" variant="secondary">Ajouter un fichier</Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <Dialog.Title className="text-lg font-semibold">Ajouter un fichier</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-slate-500">Support actuel: .txt, .md (PDF à venir)</Dialog.Description>
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []) as File[]
                        if (files.length === 0) return
                        setUploading(true)
                        try {
                          for (const f of files) {
                            const text = await f.text()
                            if (text.trim().length < 5) continue
                            const r = await fetch('/api/ingest', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ persona_id: personaId, content: text })
                            })
                            if (!r.ok) {
                              const err = await r.json().catch(() => ({}))
                              console.error('Ingest failed', err)
                            }
                          }
                          setUploadOpen(false)
                          load()
                          alert('Fichiers ajoutés')
                        } finally {
                          setUploading(false)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Dialog.Close asChild>
                      <Button variant="ghost" type="button" disabled={uploading}>Fermer</Button>
                    </Dialog.Close>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun document pour l\'instant.</p>
        ) : (
          <>
            {selectedTag && (
              <div className="mb-2 text-xs text-slate-400">
                Filtre: <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">{selectedTag}</span>
                <button className="ml-2 underline" onClick={() => setSelectedTag(null)}>effacer</button>
              </div>
            )}
            <ul className="space-y-2">
            {docs
              .filter((d) => !selectedTag || (d.tags || []).includes(selectedTag))
              .map((d) => (
              <li key={d.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                <div className="whitespace-pre-wrap">{d.content}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(d.tags || []).map((t, i) => (
                    <button
                      key={i}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs hover:bg-white/10"
                      onClick={() => setSelectedTag(t)}
                    >
                      {t}
                    </button>
                  ))}
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <Button size="sm" variant="ghost">Éditer tags</Button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 bg-black/40" />
                      <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <Dialog.Title className="text-lg font-semibold">Tags du document</Dialog.Title>
                        <Dialog.Description className="mt-1 text-sm text-slate-500">Séparez par des virgules. Max 20.</Dialog.Description>
                        <TagEditor
                          initial={(d.tags || []).join(', ')}
                          onSave={async (val) => {
                            const tags = val.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20)
                            const r = await fetch(`/api/documents/${d.id}/tags`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ tags }),
                            })
                            if (!r.ok) {
                              const e = await r.json().catch(() => ({}))
                              alert(e.error || 'Erreur tags')
                              return
                            }
                            await load()
                          }}
                        />
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
              </li>
            ))}
          </ul>
          </>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">Alimenter le Mentis avec du texte</div>
        <div className="grid gap-2">
          <Label htmlFor="free-text">Contenu</Label>
          <textarea
            id="free-text"
            className="min-h-[120px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="Collez votre texte…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={ingest} disabled={saving}>Ajouter</Button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}


