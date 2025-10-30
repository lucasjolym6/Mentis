// src/components/dashboard/CreatePersonaDialog.tsx
"use client"
import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseClient } from '@/lib/supabase-browser'

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function CreatePersonaDialog({ onCreated, open, onOpenChange, triggerLabel = 'Créer un jumeau cognitif' }: { onCreated?: () => void; open?: boolean; onOpenChange?: (o: boolean) => void; triggerLabel?: string }) {
  const [localOpen, setLocalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const openState = isControlled ? open! : localOpen
  const setOpen = (o: boolean) => (isControlled ? onOpenChange?.(o) : setLocalOpen(o))
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })

  const onSubmit = async (values: FormValues) => {
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      alert('Session expirée. Veuillez vous reconnecter.')
      return
    }
    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, user_id: user.id }),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      alert(e.error || 'Erreur lors de la création')
      return
    }
    alert('Mentis créé avec succès')
    setOpen(false)
    reset()
    onCreated?.()
  }

  return (
    <Dialog.Root open={openState} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>+ {triggerLabel}</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <Dialog.Title className="text-lg font-semibold">Nouveau jumeau</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-500">
            Définissez le nom et la description du jumeau cognitif.
          </Dialog.Description>

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" placeholder="Ex: Jean Dupont" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Style / logique" {...register('description')} />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="ghost" type="button">Annuler</Button>
              </Dialog.Close>
              <Button disabled={isSubmitting} type="submit">Créer</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}


