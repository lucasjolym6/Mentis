import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    if (!Number.isInteger(id)) throw new Error('Invalid id')
    const db = supabaseAdmin()

    // Load source persona
    const { data: src, error: pErr } = await db
      .from('personas')
      .select('id, user_id, name, description')
      .eq('id', id)
      .single()
    if (pErr || !src) throw (pErr || new Error('Persona not found'))

    // Create target persona
    const { data: created, error: cErr } = await db
      .from('personas')
      .insert({
        user_id: (src as any).user_id,
        name: `${src.name} (copy)`,
        description: src.description,
      })
      .select('id, name, description, created_at')
      .single()
    if (cErr || !created) throw (cErr || new Error('Failed to create duplicate'))

    // Copy documents (best-effort)
    const { data: docs } = await db
      .from('documents')
      .select('content, embedding')
      .eq('persona_id', id)

    if (docs && docs.length > 0) {
      const payload = docs.map((d: any) => ({ persona_id: created.id, content: d.content, embedding: d.embedding }))
      const { error: dErr } = await db.from('documents').insert(payload)
      if (dErr) throw dErr
    }

    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}


