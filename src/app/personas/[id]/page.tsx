'use client'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { RequireAuth } from '@/components/auth/RequireAuth'

export default function PersonaPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  return (
    <RequireAuth>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-semibold mb-2">Persona #{id}</h1>
        <p className="text-slate-500">Espace du jumeau cognitif.</p>
      </motion.div>
    </RequireAuth>
  )
}


