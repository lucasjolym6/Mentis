import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'

const GetSchema = z.object({
  persona_id: z.coerce.number().int(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = GetSchema.parse({
      persona_id: searchParams.get('persona_id'),
      limit: searchParams.get('limit') ?? undefined,
    })
    const db = supabaseAdmin()
    const { data, error } = await db
      .from('messages')
      .select('id, persona_id, role, content, created_at')
      .eq('persona_id', parsed.persona_id)
      .order('created_at', { ascending: true })
      .limit(parsed.limit)
    if (error) throw error
    return NextResponse.json({ messages: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

const PostSchema = z.object({
  persona_id: z.number().int(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const { persona_id, role, content } = PostSchema.parse(await req.json())
    const db = supabaseAdmin()
    const { data, error } = await db
      .from('messages')
      .insert({ persona_id, role, content })
      .select('id')
      .single()
    if (error) throw error
    return NextResponse.json({ id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}


