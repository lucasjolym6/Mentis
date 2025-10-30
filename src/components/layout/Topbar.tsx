// src/components/layout/Topbar.tsx
"use client"
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export function Topbar() {
  return (
    <header className="h-14 sticky top-0 border-b border-[#E5E7EB] flex items-center justify-between px-6 bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="flex items-center gap-3">
        <Logo />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}


