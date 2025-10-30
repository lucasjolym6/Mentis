'use client'
import { motion } from 'framer-motion'
import { RequireAuth } from '@/components/auth/RequireAuth'

export default function DashboardPage() {
  return (
    <RequireAuth>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="text-slate-500">Bienvenue dans Mentis. Votre espace sera bientôt peuplé.</p>
      </motion.div>
    </RequireAuth>
  )
}


