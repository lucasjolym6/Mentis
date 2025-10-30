'use client'
import * as React from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { FancyButton } from '@/components/ui/FancyButton'
import { cn } from '@/lib/utils'

export function AskAgent({ personaId }: { personaId: number }) {
  const [q, setQ] = React.useState("")
  const [res, setRes] = React.useState<string>("")
  const [busy, setBusy] = React.useState(false)
  const [toolCalls, setToolCalls] = React.useState<any[]>([])

  async function run() {
    if (!q.trim() || busy) return
    
    setBusy(true)
    setRes("")
    setToolCalls([])
    
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          personaId, 
          message: q.trim(), 
          enableWebSearch: false 
        })
      })
      
      if (!r.ok) {
        const error = await r.json().catch(() => ({}))
        setRes(`Erreur: ${error.error || 'Erreur inconnue'}`)
        return
      }
      
      const j = await r.json()
      setRes(j.text || "(aucune réponse)")
      
      if (j.tools && j.tools.length > 0) {
        setToolCalls(j.tools)
      }
    } catch (e: any) {
      setRes(`Erreur: ${e.message || 'Erreur réseau'}`)
    } finally {
      setBusy(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      run()
    }
  }

  return (
    <GlassCard className="p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
          Agent IA
        </h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Pose une question ou demande une analyse. L'agent peut utiliser des outils externes si nécessaire.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Ex: Fais-moi un brief des 5 derniers docs, ou envoie un résumé à un webhook Slack"
          className={cn(
            "w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-2.5 text-sm",
            "text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]",
            "outline-none transition-all duration-200",
            "focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-[hsl(var(--brand))]",
            "hover:border-[hsl(var(--brand))]/50 resize-none"
          )}
          disabled={busy}
        />
        
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {busy ? 'Analyse en cours...' : 'Cmd/Ctrl + Enter pour envoyer'}
          </span>
          <FancyButton 
            onClick={run} 
            disabled={busy || !q.trim()}
            className="min-w-[140px]"
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyse…
              </span>
            ) : (
              "Demander à l'agent"
            )}
          </FancyButton>
        </div>
      </div>

      {res && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Réponse
            </h4>
            <pre className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap break-words font-normal">
              {res}
            </pre>
          </div>

          {toolCalls.length > 0 && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                Outils utilisés ({toolCalls.length})
              </h4>
              <div className="space-y-2">
                {toolCalls.map((tool, idx) => (
                  <div key={idx} className="text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="font-medium text-[hsl(var(--brand))]">{tool.name}</span>
                    {'result' in tool && tool.result && (
                      <span className="ml-2">
                        {tool.result.success !== false ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}

