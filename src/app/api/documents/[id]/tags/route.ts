import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'

const BodySchema = z.object({
  tags: z.array(z.string().min(1)).max(20),
})

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) throw new Error('Invalid id')
    const db = supabaseAdmin()
    const { data, error } = await db
      .from('documents')
      .select('id, tags')
      .eq('id', id)
      .single()
    if (error) throw error
    return NextResponse.json({ id: data.id, tags: (data as any).tags || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) throw new Error('Invalid id')
    const { tags } = BodySchema.parse(await req.json())
    const db = supabaseAdmin()
    const { error } = await db
      .from('documents')
      .update({ tags })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}


