// src/components/layout/Topbar.tsx
"use client"
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
      <div className="font-semibold tracking-tight">Mentis</div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  )
}


