import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const AskSchema = z.object({
  persona_id: z.number().int(),
  question: z.string().min(3),
})

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { persona_id, question } = AskSchema.parse(await req.json())
    const db = supabaseAdmin()

    const { data: persona, error: pErr } = await db
      .from('personas')
      .select('name, description, tone, constraints, system_prompt')
      .eq('id', persona_id)
      .single()
    if (pErr) throw pErr

    const qEmb = await client.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
      input: [question],
    })
    const qVec = qEmb.data[0].embedding

    const { data: matches } = await db.rpc('match_documents', {
      p_id: persona_id,
      query_embedding: qVec,
      match_count: 5,
    })

    const ctx = (matches || [])
      .map((m: any) => `[score=${Number(m.score).toFixed(2)}]\n${m.content}`)
      .join('\n\n')

    const parts: string[] = []
    if (persona.system_prompt) parts.push(persona.system_prompt)
    parts.push(`Tu es le jumeau cognitif de ${persona.name}.`)
    if (persona.description) parts.push(`Style: ${persona.description}.`)
    if (persona.tone) parts.push(`Ton: ${persona.tone}.`)
    if (persona.constraints) parts.push(`Contraintes: ${persona.constraints}.`)
    const system = parts.join(' ')

    const stream = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      stream: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Contexte:\n${ctx}\n\nQuestion: ${question}` },
      ],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        let full = ''
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content || ''
            if (delta) {
              full += delta
              controller.enqueue(encoder.encode(`data: ${delta}\n\n`))
            }
          }
          // save messages after completion
          await db.from('messages').insert([
            { persona_id, role: 'user', content: question },
            { persona_id, role: 'assistant', content: full },
          ])
          controller.enqueue(encoder.encode(`event: done\ndata: ok\n\n`))
        } catch (e: any) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: e.message })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}


