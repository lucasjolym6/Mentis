'use client'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { supabaseClient } from '@/lib/supabase-browser'
import { GlassCard } from '@/components/ui/GlassCard'
import { FancyButton } from '@/components/ui/FancyButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

const Schema = z.object({
  name: z.string().min(2, 'Nom trop court').max(50).transform(v => v.trim()),
  template: z.string().min(1, 'Choisis un template'),
  description: z.string().max(240).optional().transform(v => (v ?? '').trim()),
  avatar: z.string().optional().default('🧠'),
  openAdvanced: z.boolean().optional(),
})

const EMOJI_OPTIONS = ['🧠', '✨', '🔷', '🌊', '🌐', '📘', '💡', '🚀', '🎯', '⚡', '🌟', '🎨', '🔮', '💎', '🔥', '🌈']

type Template = {
  id: string
  name: string
  description: string
  icon: string | null
  preset: string
  category: string | null
}

export function CreateMentisDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: (created?: { id?: number }) => void
}) {
  const [submitting, setSubmitting] = React.useState(false)
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = React.useState(true)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const { register, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    mode: 'onChange',
    defaultValues: { name: '', template: '', description: '', avatar: '🧠', openAdvanced: true },
  })

  const name = watch('name')
  const template = watch('template')
  const description = watch('description')
  const avatar = watch('avatar')

  // Grouper les templates par catégorie
  const templatesByCategory = React.useMemo(() => {
    const grouped = templates.reduce((acc, t) => {
      const cat = t.category || 'Autres'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(t)
      return acc
    }, {} as Record<string, Template[]>)
    return grouped
  }, [templates])

  const categories = Object.keys(templatesByCategory)

  // Charger les templates depuis Supabase
  React.useEffect(() => {
    if (!open) return
    
    async function loadTemplates() {
      try {
        setLoadingTemplates(true)
        const { data, error } = await supabaseClient
          .from('mentis_templates')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (error) {
          console.error('Error loading templates:', error)
          return
        }

        setTemplates((data as Template[]) || [])
      } catch (e) {
        console.error('Failed to load templates:', e)
      } finally {
        setLoadingTemplates(false)
      }
    }

    loadTemplates()
  }, [open])

  function pickTemplate(tid: string) {
    const t = templates.find(x => x.id === tid)
    if (!t) return
    setValue('template', t.id, { shouldValidate: true, shouldDirty: true })
    if (!watch('description')) {
      setValue('description', t.preset, { shouldValidate: true, shouldDirty: true })
    }
  }

  async function onSubmit(values: z.infer<typeof Schema>) {
    try {
      setSubmitting(true)
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) {
        alert('Reconnecte-toi pour créer un Mentis.')
        return
      }

      if (!values.template || !values.name || values.name.trim().length < 2) {
        alert('Veuillez remplir tous les champs obligatoires.')
        return
      }

      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: values.name.trim(), 
          description: values.description?.trim() || '', 
          avatar: values.avatar || '🧠',
          user_id: user.id 
        }),
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err?.error || 'Impossible de créer le Mentis.')
        return
      }
      
      const created = await res.json().catch(()=>({}))
      onOpenChange(false)
      onCreated?.(created)
      
      if (values.openAdvanced && (created as any)?.id) {
        setTimeout(() => {
          window.location.href = `/personas/${(created as any).id}#settings`
        }, 100)
      }
    } catch (e: any) {
      console.error('Error creating persona:', e)
      alert(e.message || 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTemplates = selectedCategory
    ? templatesByCategory[selectedCategory] || []
    : templates

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto" aria-hidden={false}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-3xl md:max-w-4xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6 sm:p-8 rounded-2xl max-h-[85vh] overflow-y-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))] mb-2">
                  Créer un Mentis
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Choisis un template, personnalise-le, et crée ton jumeau cognitif en quelques clics.
                </p>
              </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2 block">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  placeholder="Mentis Luna"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all duration-200 focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-[hsl(var(--brand))] hover:border-[hsl(var(--brand))]/50"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2 block">
                  Avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setValue('avatar', emoji, { shouldValidate: true })}
                      className={cn(
                        'h-10 w-10 rounded-xl border-2 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center text-xl',
                        avatar === emoji
                          ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/10 ring-2 ring-[hsl(var(--brand))]/30'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--brand))]/50'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 block">
                  Template <span className="text-red-500">*</span>
                </label>
                
                {/* Filtres par catégorie (optionnel) */}
                {categories.length > 1 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                        !selectedCategory
                          ? 'bg-[hsl(var(--brand))] text-white'
                          : 'bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-3))]'
                      )}
                    >
                      Tous
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                          selectedCategory === cat
                            ? 'bg-[hsl(var(--brand))] text-white'
                            : 'bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-3))]'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatePresence mode="wait">
                    {loadingTemplates ? (
                      // Skeleton pendant le chargement
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                      ))
                    ) : filteredTemplates.length === 0 ? (
                      // Fallback si aucun template
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-2 p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] text-center"
                      >
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Aucun template disponible. Vérifie ta connexion à Supabase.
                        </p>
                      </motion.div>
                    ) : (
                      // Liste des templates
                      filteredTemplates.map((t, index) => (
                        <motion.button
                          key={t.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          type="button"
                          onClick={() => pickTemplate(t.id)}
                          className={cn(
                            'group relative px-4 py-4 rounded-xl border border-[hsl(var(--border))]',
                            'bg-[hsl(var(--surface-2))]/50 text-left transition-all duration-200',
                            'hover:bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--brand))] hover:shadow-lg hover:scale-[1.02]',
                            'active:scale-[0.98]',
                            template === t.id && 'ring-2 ring-[hsl(var(--brand))] border-[hsl(var(--brand))] bg-[hsl(var(--surface-2))] shadow-lg'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icône avec background */}
                            {t.icon && (
                              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-[hsl(var(--brand))] to-[#22D3EE] flex items-center justify-center text-xl">
                                {t.icon}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1">
                                {t.name}
                              </div>
                              <div className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
                                {t.description || t.preset}
                              </div>
                              {/* Catégorie badge */}
                              {t.category && (
                                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[hsl(var(--surface-3))] text-[hsl(var(--muted-foreground))]">
                                  {t.category}
                                </div>
                              )}
                            </div>
                            {/* Indicateur de sélection */}
                            {template === t.id && (
                              <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[hsl(var(--brand))] animate-pulse" />
                            )}
                          </div>
                        </motion.button>
                      ))
                    )}
                  </AnimatePresence>
                </div>
                {errors.template && (
                  <p className="text-xs text-red-500 mt-2">{errors.template.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2 block">
                  Description <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">(courte)</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Calme, analytique, propose des plans d’action concrets."
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all duration-200 focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-[hsl(var(--brand))] hover:border-[hsl(var(--brand))]/50 resize-none"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                  Tu pourras détailler et affiner le style dans Paramètres.
                </p>
              </div>

            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 block">
                  Aperçu
                </label>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2"
                >
                  <GlassCard className="p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[hsl(var(--brand))] to-[#22D3EE] ring-2 ring-[hsl(var(--brand))]/30 flex items-center justify-center text-2xl">
                          {avatar || '🧠'}
                        </div>
                        {template && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[hsl(var(--foreground))] mb-1">
                          {name || 'Nom du Mentis'}
                        </div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-3 leading-relaxed">
                          {description || 'Une brève description issue du template choisi.'}
                        </div>
                        {template && (
                          <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                              Template : <span className="font-medium text-[hsl(var(--brand))]">
                                {templates.find(t => t.id === template)?.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors">
                <input
                  type="checkbox"
                  {...register('openAdvanced')}
                  defaultChecked
                  className="rounded border-[hsl(var(--border))] text-[hsl(var(--brand))] focus:ring-[hsl(var(--brand))]"
                />
                Ouvrir les paramètres avancés après la création
              </label>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-3))] transition-all duration-200"
              >
                Annuler
              </button>
              <FancyButton type="submit" disabled={!isValid || submitting}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Création…
                  </span>
                ) : (
                  'Créer mon Mentis'
                )}
              </FancyButton>
            </div>
          </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}


