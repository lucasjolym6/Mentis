"use client"
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')) }, [])
  return (
    <button
      onClick={() => {
        const el = document.documentElement
        el.classList.toggle('dark')
        setDark(el.classList.contains('dark'))
      }}
      className="px-3 py-1 rounded-xl border border-[hsl(var(--border))] hover:ring-gradient"
      title="Theme"
    >
      {dark ? '🌙' : '☀️'}
    </button>
  )
}


