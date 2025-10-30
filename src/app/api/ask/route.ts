import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import { openai } from '@/lib/openai'
import { buildSystemFor, webhookFunctionTool } from '@/lib/agent'

const AskSchema = z.object({
  personaId: z.number().int(),
  message: z.string().min(1),
  enableWebSearch: z.boolean().optional().default(false),
  webhookUrl: z.string().url().optional(),
})

// Simple exécution de function-calls côté serveur
async function handleToolCall(name: string, args: any) {
  if (name === "post_webhook") {
    const res = await fetch(args.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args.payload),
    })
    const text = await res.text()
    return { status: res.status, body: text.slice(0, 2000) }
  }
  return { error: `Unknown tool: ${name}` }
}

export async function POST(req: Request) {
  try {
    const body = AskSchema.parse(await req.json())
    const db = supabaseAdmin()

    // 1) Charger le persona
    const { data: persona, error: pErr } = await db
      .from("personas")
      .select("id, name, description, style, tone, constraints, system_prompt")
      .eq("id", body.personaId)
      .single()
    if (pErr || !persona) {
      return NextResponse.json({ error: "Persona introuvable" }, { status: 404 })
    }

    // 2) Charger top-k docs (RAG simple)
    // Option 1: Si match_documents existe, utiliser embeddings (plus précis)
    let ragContext = ""
    try {
      const qEmb = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
        input: [body.message],
      })
      const qVec = qEmb.data[0].embedding
      
      const { data: matches } = await db.rpc('match_documents', {
        p_id: body.personaId,
        query_embedding: qVec,
        match_count: 5,
      })
      
      if (matches && matches.length > 0) {
        ragContext = (matches as any[]).map((m, i) => `[Doc ${i + 1}, score=${Number(m.score || 0).toFixed(2)}]\n${m.content}`).join("\n\n")
      }
    } catch (e) {
      // Fallback: prendre les N derniers docs si match() indispo
      const { data: docs } = await db
        .from("documents")
        .select("content")
        .eq("persona_id", body.personaId)
        .order("created_at", { ascending: false })
        .limit(5)
      ragContext = (docs ?? []).map((d, i) => `[Doc ${i + 1}]\n${d.content}`).join("\n\n")
    }

    // 3) Construire le système
    const system = buildSystemFor(persona)

    // 4) Préparer les tools
    const tools: any[] = [webhookFunctionTool]
    // Note: web_search n'est pas disponible dans l'API standard
    // Il faudrait utiliser l'API Assistants ou un service tiers

    // 5) Appel OpenAI Chat Completions (avec tools)
    const messages: any[] = [
      { role: "system", content: system },
      { role: "user", content: `${body.message}\n\nContexte:\n${ragContext || "(pas de docs)"}\n` }
    ]

    let finalText = ""
    let toolOutputNotes: any[] = []
    let maxIterations = 5
    let iteration = 0

    while (iteration < maxIterations) {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
      })

      const message = response.choices[0].message

      // Si pas de tool calls, on a la réponse finale
      if (!message.tool_calls || message.tool_calls.length === 0) {
        finalText = message.content || ""
        break
      }

      // Ajouter le message assistant avec tool calls
      messages.push({
        role: message.role,
        content: message.content || null,
        tool_calls: message.tool_calls,
      })

      // Exécuter les tool calls
      for (const toolCall of message.tool_calls || []) {
        if (toolCall.type === 'function' && 'function' in toolCall && toolCall.function) {
          const { id, function: fn } = toolCall
          const argsObj = typeof fn.arguments === "string" ? JSON.parse(fn.arguments) : fn.arguments
          const toolRes = await handleToolCall(fn.name, argsObj)
          toolOutputNotes.push({ name: fn.name, result: toolRes })

          // Ajouter le résultat au message pour le prochain tour
          messages.push({
            role: "tool",
            tool_call_id: id,
            name: fn.name,
            content: JSON.stringify(toolRes),
          })
        }
      }

      iteration++
    }

    // Si on n'a pas de réponse finale, prendre la dernière
    if (!finalText && iteration >= maxIterations) {
      finalText = "(erreur: trop d'itérations)"
    }

    // Sauvegarder dans la base de données
    await db.from('messages').insert([
      { persona_id: body.personaId, role: 'user', content: body.message },
      { persona_id: body.personaId, role: 'assistant', content: finalText || "(aucune réponse)" },
    ])

    // Si l'utilisateur a fourni un webhook direct, on pousse le résultat
    if (body.webhookUrl) {
      try {
        await fetch(body.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId: body.personaId, result: finalText || "(aucune réponse)" })
        })
      } catch (e) {
        console.error('Webhook direct error:', e)
      }
    }

    return NextResponse.json({ 
      text: finalText || "(aucune réponse)", 
      tools: toolOutputNotes.length > 0 ? toolOutputNotes : undefined 
    })
  } catch (e: any) {
    console.error('Ask API error:', e)
    return NextResponse.json({ error: e.message || 'Erreur lors de la génération de la réponse' }, { status: 400 })
  }
}
