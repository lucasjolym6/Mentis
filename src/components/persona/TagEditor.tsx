// src/components/persona/TagEditor.tsx
"use client"
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function TagEditor({ initial, onSave }: { initial: string; onSave: (value: string) => Promise<void> }) {
  const [val, setVal] = React.useState(initial)
  const [saving, setSaving] = React.useState(false)
  return (
    <div className="mt-4 grid gap-3">
      <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="ex: client, sales, Q3" />
      <div className="flex justify-end gap-2">
        <Button onClick={async () => { setSaving(true); try { await onSave(val) } finally { setSaving(false) } }} disabled={saving}>Enregistrer</Button>
      </div>
    </div>
  )
}


