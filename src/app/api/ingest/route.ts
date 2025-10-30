import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const IngestSchema = z.object({
  persona_id: z.number().int(),
  content: z.string().min(5),
})

export async function POST(req: Request) {
  try {
    const { persona_id, content } = IngestSchema.parse(await req.json())
    const emb = await client.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
      input: [content],
    })
    const vector = emb.data[0].embedding

    const db = supabaseAdmin()
    const { error } = await db.from('documents').insert({
      persona_id,
      content,
      embedding: vector,
    })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
