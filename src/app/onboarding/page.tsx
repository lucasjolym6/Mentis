'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import RequireAuth from '@/components/auth/RequireAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseClient } from '@/lib/supabase-browser'
import { Logo } from '@/components/common/Logo'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

type Step = 1 | 2 | 3

const formSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  description: z.string().optional(),
})
type FormValues = z.infer<typeof formSchema>

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: 'Mon premier Mentis', description: '' },
  })

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) return
      const { data } = await supabaseClient
        .from('profiles')
        .select('onboarding_done')
        .eq('user_id', user.id)
        .single()
      if (data?.onboarding_done) router.replace('/dashboard')
    })()
  }, [router])

  const slide = useMemo(() => ({
    initial: { opacity: 0, x: 16 },
    enter: { opacity: 1, x: 0, transition: { duration: 0.35 } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.25 } },
  }), [])

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) return
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, user_id: user.id }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        setToast(e.error || 'Erreur lors de la création du jumeau')
        return
      }
      await supabaseClient
        .from('profiles')
        .upsert({ user_id: user.id, onboarding_done: true })
      setToast(`Bienvenue, ${values.name} !`)
      reset()
      setTimeout(() => router.replace('/dashboard'), 400)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-[720px] p-6">
        <div className="mb-8 text-center glass-card p-6">
          <div className="mb-3 flex justify-center"><Logo /></div>
          <h1 className="text-3xl font-semibold tracking-tight">Bienvenue dans Mentis</h1>
          <p className="mt-2 text-sm text-gray-600">Construis ton jumeau cognitif — une IA qui apprend de toi, pense comme toi, et prolonge ton savoir.</p>
        </div>

        {toast && (
          <div className="mb-4 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
            {toast}
          </div>
        )}

        <div className="relative min-h-[320px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" variants={slide} initial="initial" animate="enter" exit="exit" className="glass-card p-6">
                <h2 className="text-xl font-semibold">Bienvenue</h2>
                <p className="mt-2 text-sm text-gray-600">Découvre Mentis, une plateforme pour créer des jumeaux cognitifs alignés à ton style et nourris par tes connaissances.</p>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setStep(2)} className="transition-transform duration-200 ease-in-out hover:scale-105">Commencer l’aventure →</Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" variants={slide} initial="initial" animate="enter" exit="exit" className="glass-card p-6">
                <h2 className="text-xl font-semibold">Qu’est-ce qu’un Mentis ?</h2>
                <p className="mt-2 text-sm text-gray-600">Un <strong>Mentis</strong> est ton double numérique, une intelligence entraînée sur ta manière de penser. Tu peux lui confier tes notes, réflexions et documents. Il apprend, retient et te répond avec ta propre logique.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { title: 'Mémoire', desc: 'Stocke tes connaissances et tes textes', icon: '🧠' },
                    { title: 'Dialogue', desc: 'Répond avec ton ton et style', icon: '💬' },
                    { title: 'Évolution', desc: 'Apprend continuellement', icon: '⚙️' },
                  ].map((c, i) => (
                    <motion.div key={c.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} className="glass-card p-4">
                      <div className="text-xl">{c.icon}</div>
                      <div className="mt-2 text-sm font-medium">{c.title}</div>
                      <div className="text-xs text-gray-600">{c.desc}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>Retour</Button>
                  <Button onClick={() => setStep(3)} className="transition-transform duration-200 ease-in-out hover:scale-105">Créer mon premier Mentis →</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" variants={slide} initial="initial" animate="enter" exit="exit" className="glass-card p-6">
                <h2 className="text-xl font-semibold">Créons ton premier Mentis</h2>
                <p className="mt-1 text-sm text-gray-600">Donne-lui un nom et décris sa personnalité.</p>
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" placeholder="Ex: Jean Dupont" {...register('name')} />
                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" placeholder="Style / logique (optionnel)" {...register('description')} />
                  </div>
                  <div className="mt-2 flex justify-between">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>Retour</Button>
                    <Button type="submit" disabled={isSubmitting || submitting} className="transition-transform duration-200 ease-in-out hover:scale-105">
                      {isSubmitting || submitting ? 'Création…' : 'Créer mon Mentis'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </RequireAuth>
  )
}


