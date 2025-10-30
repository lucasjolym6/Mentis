import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'

const PersonaSchema = z.object({
  name: z.string().min(2),
  description: z.string().default(''),
  user_id: z.string().uuid(),
  avatar: z.string().optional().default('🧠'),
  tone: z.string().optional(),
  constraints: z.string().optional(),
  system_prompt: z.string().optional(),
  status: z.enum(['active', 'draft']).optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, description, user_id, avatar, tone, constraints, system_prompt, status } = PersonaSchema.parse(body)

    const db = supabaseAdmin()
    const { data, error } = await db
      .from('personas')
      .insert({ name, description, user_id, avatar: avatar || '🧠', tone, constraints, system_prompt, status })
      .select('id, name, description, avatar, tone, constraints, system_prompt, status, created_at')
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
