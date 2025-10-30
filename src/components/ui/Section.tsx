import * as React from 'react'
import { cn } from '@/lib/utils'

export function Section({ title, subtitle, className, children }: { title?: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('space-y-3', className)}>
      {(title || subtitle) && (
        <div>
          {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  )
}


