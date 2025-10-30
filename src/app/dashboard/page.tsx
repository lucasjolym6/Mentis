'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import RequireAuth from '@/components/auth/RequireAuth'
import { supabaseClient } from '@/lib/supabase-browser'
import { CreateMentisDialog } from '@/components/dashboard/CreateMentisDialog'
import { FancyButton } from '@/components/ui/FancyButton'
import { Input } from '@/components/ui/input'
import { PersonaCard, type Persona } from '@/components/dashboard/PersonaCard'

export default function DashboardPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [newOpen, setNewOpen] = useState(false)
  const [query, setQuery] = useState('')

  const load = async () => {
    setLoading(true)
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      setPersonas([])
      setLoading(false)
      return
    }

    // Récupérer les personas possédés ET partagés
    const [ownedData, sharedData] = await Promise.all([
      // Personas possédés
      supabaseClient
        .from('personas')
        .select('id, name, description, avatar, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      // Personas partagés (via persona_members)
      supabaseClient
        .from('persona_members')
        .select('persona_id, role, personas(id, name, description, avatar, created_at)')
        .eq('member_user_id', user.id),
    ])

    const allPersonas: Persona[] = []

    // Ajouter les personas possédés
    if (ownedData.data) {
      allPersonas.push(...(ownedData.data as Persona[]))
    }

    // Ajouter les personas partagés (sans doublons)
    if (sharedData.data) {
      const sharedPersonas = sharedData.data
        .map((m: any) => m.personas)
        .filter((p: any) => p && !allPersonas.find((op) => op.id === p.id))
      allPersonas.push(...(sharedPersonas as Persona[]))
    }

    // Enrichir avec docs count et last message timestamp
    const enriched = await Promise.all(
      allPersonas.map(async (p) => {
        const [docsCountRes, lastMsgRes] = await Promise.all([
          supabaseClient
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('persona_id', p.id),
          supabaseClient
            .from('messages')
            .select('created_at')
            .eq('persona_id', p.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ])
        const docsCount = docsCountRes.count ?? 0
        const lastMessageAt = (lastMsgRes.data && lastMsgRes.data[0]?.created_at) || null
        return { ...p, docsCount, lastMessageAt }
      })
    )

    // Trier par date de création (plus récent en premier)
    enriched.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateB - dateA
    })

    setPersonas(enriched)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <RequireAuth>
      <div className="space-y-6">
        <div className="text-sm text-gray-500">
          <span className="text-gray-600">Accueil</span>
          <span className="mx-2">/</span>
          <span>Dashboard</span>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm glass-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Mes Mentis</h1>
              <p className="text-sm text-gray-500">Créez et gérez vos jumeaux cognitifs</p>
            </div>
            <div className="flex items-center gap-2">
              <FancyButton type="button" onClick={() => setNewOpen(true)}>+ Nouveau Mentis</FancyButton>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Rechercher par nom ou description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

      {/* Single instance of the creation dialog mounted once */}
      <CreateMentisDialog onCreated={load} open={newOpen} onOpenChange={setNewOpen} />

        {loading ? (
          <p className="text-slate-500">Chargement…</p>
        ) : personas.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-dashed p-12 text-center text-slate-400 dark:border-slate-800">
            <div className="mb-3 text-lg">Aucun jumeau pour l’instant.</div>
            <FancyButton type="button" onClick={() => setNewOpen(true)}>Créer ton premier Mentis</FancyButton>
          </motion.div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {personas
              .filter((p) => {
                const q = query.trim().toLowerCase()
                if (!q) return true
                return (
                  p.name.toLowerCase().includes(q) ||
                  (p.description || '').toLowerCase().includes(q)
                )
              })
              .map((p, i) => (
              <PersonaCard key={p.id} persona={p} index={i} onDeleted={load} onRenamed={load} />
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  )
}


