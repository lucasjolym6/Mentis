import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const token = resolvedParams.token

    if (!token) {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // Récupérer l'invitation
    const { data: invitation, error: inviteError } = await db
      .from('persona_invitations')
      .select('id, email, persona_id, role, expires_at, accepted_at')
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
    }

    // Vérifier si l'invitation est expirée
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expirée' }, { status: 400 })
    }

    // Vérifier si l'invitation a déjà été acceptée
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation déjà acceptée' }, { status: 400 })
    }

    // Récupérer les infos du persona
    const { data: persona, error: personaError } = await db
      .from('personas')
      .select('id, name, description, avatar')
      .eq('id', invitation.persona_id)
      .single()

    if (personaError || !persona) {
      return NextResponse.json({ error: 'Mentis introuvable' }, { status: 404 })
    }

    return NextResponse.json({
      email: invitation.email,
      persona_id: invitation.persona_id,
      persona_name: persona.name,
      role: invitation.role,
      valid: true,
    })
  } catch (e: any) {
    console.error('Get invitation error:', e)
    return NextResponse.json({ error: e.message || 'Erreur lors de la récupération de l\'invitation' }, { status: 500 })
  }
}

