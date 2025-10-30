import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "glass gradient-border p-5",
        "transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] hover:shadow-lg",
        "shadow-[inset_0_1px_0_rgba(255,255,255,.35)]",
        className
      )}
    >
      {children}
    </div>
  )
}


