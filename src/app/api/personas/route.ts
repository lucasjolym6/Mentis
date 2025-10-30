// src/app/api/personas/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

const PersonaSchema = z.object({
  name: z.string().min(2),
  description: z.string().default(''),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, description } = PersonaSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .from('personas')
      .upsert({ name, description })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ id: data.id, name })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
