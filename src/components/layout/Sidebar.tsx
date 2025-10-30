// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/personas/1', label: 'Persona' },
  { href: '/settings', label: 'Settings' },
]

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn('w-56 border-r border-slate-200 dark:border-slate-800 p-3', className)}>
      <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Navigation</div>
      <nav className="grid gap-1">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}


