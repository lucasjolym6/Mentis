// src/components/persona/ChatPanel.tsx
"use client"
import * as React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

type Message = { id?: number; role: 'user' | 'assistant'; content: string; citations?: Array<{ id: number; content: string; score: number }> }

export function ChatPanel({ personaId, initialMessages = [] }: { personaId: number; initialMessages?: Message[] }) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages)
  const [question, setQuestion] = React.useState('')
  const [sending, setSending] = React.useState(false)

  const ask = async () => {
    if (!question.trim()) return
    const q = question
    setQuestion('')
    setMessages((m) => [...m, { role: 'user', content: q }])
    setSending(true)
    try {
      // streaming first; fallback to non-streaming
      const r = await fetch('/api/ask/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: personaId, question: q }),
      })
      if (r.ok && r.headers.get('content-type')?.includes('text/event-stream')) {
        let acc = ''
        setMessages((m) => [...m, { role: 'assistant', content: '' }])
        const reader = r.body!.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          for (const line of text.split('\n\n')) {
            if (!line) continue
            if (line.startsWith('event: error')) {
              // ignore here; user message already shown
              continue
            }
            if (line.startsWith('event: done')) continue
            if (line.startsWith('data: ')) {
              const token = line.slice(6)
              acc += token
              setMessages((m) => {
                const copy = [...m]
                const last = copy[copy.length - 1]
                if (last && last.role === 'assistant') {
                  last.content = acc
                }
                return copy
              })
            }
          }
        }
      } else {
        // fallback non-streaming
        if (!r.ok) {
          if (r.status === 429) {
            alert('Crédits OpenAI épuisés. Réessayez plus tard.')
          } else {
            const e = await r.json().catch(() => ({}))
            alert(e.error || 'Erreur lors de la génération')
          }
          return
        }
        const data = await r.json()
        const answer = data.answer || ' '
        setMessages((m) => [...m, { role: 'assistant', content: answer }])
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">Chat IA</div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">Posez une question pour commencer.</p>
        )}
        {messages.map((m, idx) => {
          const isUser = m.role === 'user'
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('max-w-[70%] rounded-2xl px-4 py-2 shadow-sm', isUser ? 'ml-auto bg-[hsl(var(--surface-3))]' : 'mr-auto bg-white/80')}
            >
              <p className="text-[15px] leading-6 whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                <div className="mt-2 rounded-md border border-white/10 bg-white/60 p-2 text-xs">
                  <div className="mb-1 font-medium">Citations</div>
                  <ul className="list-disc pl-4 space-y-1">
                    {m.citations.slice(0, 5).map((c, i) => (
                      <li key={i} className="opacity-80">{c.content}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )
        })}
        {sending && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mr-auto max-w-[85%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            typing…
          </motion.div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Votre question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ask()
            }
          }}
        />
        <Button onClick={ask} disabled={sending}>Envoyer</Button>
      </div>
    </div>
  )
}


