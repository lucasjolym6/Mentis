// src/components/common/Logo.tsx
"use client"

export function Logo() {
  return (
    <div
      className="text-2xl font-semibold tracking-widest"
      style={{
        color: 'var(--color-accent)',
        textShadow: '0 0 16px rgba(91,192,190,0.6)',
        fontFamily: 'var(--font-space-grotesk)',
      }}
    >
      MENTIS
    </div>
  )
}
