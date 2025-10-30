// src/components/dashboard/PersonaCard.tsx
"use client"
import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { MoreVertical } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

export type Persona = {
  id: number
  name: string
  description?: string | null
  avatar?: string | null
  created_at?: string | null
  docsCount?: number
  lastMessageAt?: string | null
}

export function PersonaCard({ persona, index = 0, onDeleted, onRenamed }: { persona: Persona; index?: number; onDeleted?: () => void; onRenamed?: () => void }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const handleDelete = async () => {
    try {
      if (!persona.id || !Number.isFinite(persona.id)) {
        alert('ID de Mentis invalide')
        setConfirmOpen(false)
        return
      }
      
      const res = await fetch(`/api/personas/${persona.id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        console.error('Delete error:', e)
        alert(e.error || 'Erreur lors de la suppression')
        setConfirmOpen(false)
        return
      }
      
      setConfirmOpen(false)
      onDeleted?.()
    } catch (e: any) {
      console.error('Delete exception:', e)
      alert(e.message || 'Erreur inattendue lors de la suppression')
      setConfirmOpen(false)
    }
  }
  const rename = async () => {
    const next = prompt('Nouveau nom', persona.name)
    if (!next || next.trim().length < 2) return
    const r = await fetch(`/api/personas/${persona.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: next.trim() }),
    })
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      alert(e.error || 'Erreur lors du renommage')
      return
    }
    onRenamed?.()
  }
  const duplicate = async () => {
    const r = await fetch(`/api/personas/${persona.id}/duplicate`, { method: 'POST' })
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      alert(e.error || 'Erreur lors de la duplication')
      return
    }
    onRenamed?.()
  }

  return (
    <motion.div 
      initial={{ y: 8, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <GlassCard className="hover:scale-[1.02] relative h-full flex flex-col p-5 transition-transform duration-200">
        {/* Menu kebab - en dehors du Link */}
        <div className="absolute right-3 top-3 z-20">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Options" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-1 shadow-lg min-w-[180px] z-50"
                align="end"
                sideOffset={5}
              >
                <DropdownMenu.Item asChild>
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))] transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      rename()
                    }}
                  >
                    Renommer
                  </button>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))] transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      duplicate()
                    }}
                  >
                    Dupliquer
                  </button>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-[hsl(var(--border))] my-1" />
                <DropdownMenu.Item asChild>
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setConfirmOpen(true)
                    }}
                  >
                    Supprimer
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Contenu cliquable */}
        <Link href={`/personas/${persona.id}`} className="flex-1 flex flex-col min-w-0">
          <div className="flex items-start gap-3 flex-1 min-h-0">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(var(--brand))] to-[#22D3EE] ring-2 ring-[hsl(var(--brand))]/30 flex items-center justify-center text-xl overflow-hidden">
              {persona.avatar || '🧠'}
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <h3 className="text-[15px] font-semibold mb-1 line-clamp-1">{persona.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 flex-1">{persona.description || 'Aucune description'}</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 pt-3 border-t border-[hsl(var(--border))]">
            📄 {typeof persona.docsCount === 'number' ? persona.docsCount : 0} docs • Dernière interaction {persona.lastMessageAt ? new Date(persona.lastMessageAt).toLocaleDateString() : '—'}
          </div>
        </Link>
      </GlassCard>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <AlertDialog.Title className="text-lg font-semibold">Supprimer le jumeau</AlertDialog.Title>
            <AlertDialog.Description className="mt-1 text-sm text-slate-500">
              Cette action est irréversible. Les documents et messages associés seront supprimés.
            </AlertDialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="ghost">Annuler</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button onClick={handleDelete} variant="secondary">Confirmer</Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </motion.div>
  )
}


