import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'

const PatchSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  tone: z.string().optional(),
  constraints: z.string().optional(),
  system_prompt: z.string().optional(),
  status: z.enum(['active', 'draft']).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as either Promise or direct object (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const url = new URL(req.url)
    const body: any = await req.json().catch(() => ({}))
    
    // Try multiple sources for the ID
    const rawId = (resolvedParams?.id ?? url.searchParams.get('id') ?? body?.id ?? body?.persona_id)?.toString()
    
    if (!rawId || rawId === 'undefined' || rawId === 'null') {
      console.error('PATCH: Missing id', { resolvedParams, body, url: req.url })
      throw new Error('Missing id')
    }
    
    const num = Number(rawId)
    if (!Number.isFinite(num) || isNaN(num)) {
      console.error('PATCH: Invalid id', { rawId, num })
      throw new Error('Invalid id')
    }
    
    const idFilter = num
    const payload = PatchSchema.parse(body)
    if (Object.keys(payload).length === 0) throw new Error('No fields to update')

    const db = supabaseAdmin()
    const { data, error } = await db
      .from('personas')
      .update(payload)
      .eq('id', idFilter)
      .select('id, name, description, avatar, tone, constraints, system_prompt, status, created_at')
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('PATCH: Error', e)
    return NextResponse.json({ error: e.message || 'Erreur lors de la mise à jour' }, { status: 400 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as either Promise or direct object (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const url = new URL(req.url)
    
    // Try multiple sources for the ID
    const rawId = (resolvedParams?.id ?? url.searchParams.get('id'))?.toString()
    
    if (!rawId || rawId === 'undefined' || rawId === 'null') {
      console.error('DELETE: Missing id', { resolvedParams, url: req.url })
      throw new Error('Missing id')
    }
    
    const num = Number(rawId)
    if (!Number.isFinite(num) || isNaN(num)) {
      console.error('DELETE: Invalid id', { rawId, num })
      throw new Error('Invalid id')
    }
    
    const idFilter = num
    const db = supabaseAdmin()

    // Delete related data first if cascade not configured
    const { error: mErr } = await db.from('messages').delete().eq('persona_id', idFilter)
    if (mErr) {
      console.error('DELETE: Error deleting messages', mErr)
      throw mErr
    }
    
    const { error: dErr } = await db.from('documents').delete().eq('persona_id', idFilter)
    if (dErr) {
      console.error('DELETE: Error deleting documents', dErr)
      throw dErr
    }
    
    const { error: pErr } = await db.from('personas').delete().eq('id', idFilter)
    if (pErr) {
      console.error('DELETE: Error deleting persona', pErr)
      throw pErr
    }
    
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('DELETE: Error', e)
    return NextResponse.json({ error: e.message || 'Erreur lors de la suppression' }, { status: 400 })
  }
}


