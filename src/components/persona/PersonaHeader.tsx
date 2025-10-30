// src/components/persona/PersonaHeader.tsx
"use client"
import { motion } from 'framer-motion'

export function PersonaHeader({ name, description, avatar }: { name: string; description?: string | null; avatar?: string | null }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl p-4 bg-gradient-to-r from-[hsl(var(--surface-2))] to-transparent">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-[hsl(var(--brand))] to-[#22D3EE] ring-4 ring-[hsl(var(--brand))]/20 flex items-center justify-center text-2xl">
          {avatar || '🧠'}
        </div>
        <div>
          <div className="text-sm text-gray-500">Jumeau cognitif</div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          {description && <p className="mt-1 text-gray-600">{description}</p>}
        </div>
      </div>
    </motion.div>
  )
}


