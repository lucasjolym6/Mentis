import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const AskSchema = z.object({
  persona_id: z.number().int(),
  question: z.string().min(3),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { persona_id, question } = AskSchema.parse(body)

    const { data: persona, error: pErr } = await supabaseAdmin
      .from('personas')
      .select('name, description')
      .eq('id', persona_id)
      .single()
    if (pErr) throw pErr

    const qEmb = await client.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
      input: [question],
    })
    const qVec = qEmb.data[0].embedding

    const { data: matches, error: mErr } = await supabaseAdmin.rpc('match_documents', {
      p_id: persona_id,
      query_embedding: qVec,
      match_count: 6,
    })
    if (mErr) throw mErr

    const contextBlock = (matches || [])
      .map((m: any) => `[Connaissance score=${Number(m.score).toFixed(2)}]\n${m.content}`)
      .join('\n\n')

    const system = `Tu es le jumeau cognitif de ${persona.name}. Style/Logique: ${persona.description}. Réponds de manière concise et actionnable.`

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Contexte:\n${contextBlock}\n\nQuestion: ${question}` },
      ],
    })

    const answer = completion.choices[0].message?.content || ''

    await supabaseAdmin.from('messages').insert([
      { persona_id, role: 'user', content: question },
      { persona_id, role: 'assistant', content: answer },
    ])

    return NextResponse.json({ answer })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
