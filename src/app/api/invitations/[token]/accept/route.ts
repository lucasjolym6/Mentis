import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const token = resolvedParams.token

    if (!token) {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { user_id } = body

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 })
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

    // Vérifier que l'email correspond à l'utilisateur
    try {
      const { data: userData, error: userError } = await db.auth.admin.getUserById(user_id)
      
      if (userError || !userData?.user) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
      }

      const user = userData.user
      
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        return NextResponse.json({ error: 'L\'email de l\'invitation ne correspond pas à votre compte' }, { status: 400 })
      }

      // Ajouter l'utilisateur à persona_members
      const { error: memberError } = await db
        .from('persona_members')
        .upsert(
          {
            persona_id: invitation.persona_id,
            member_user_id: user_id,
            role: invitation.role,
          },
          { onConflict: 'persona_id,member_user_id' }
        )

      if (memberError) {
        console.error('Member insert error:', memberError)
        return NextResponse.json({ error: 'Erreur lors de l\'ajout à l\'équipe' }, { status: 500 })
      }

      // Marquer l'invitation comme acceptée
      const { error: updateError } = await db
        .from('persona_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      if (updateError) {
        console.error('Invitation update error:', updateError)
        // On continue quand même car l'accès a été accordé
      }

      return NextResponse.json({
        ok: true,
        message: 'Invitation acceptée avec succès',
        persona_id: invitation.persona_id,
      })
    } catch (authErr: any) {
      console.error('Auth error in accept:', authErr)
      return NextResponse.json({ error: 'Erreur lors de la vérification de l\'utilisateur' }, { status: 500 })
    }
  } catch (e: any) {
    console.error('Accept invitation error:', e)
    return NextResponse.json({ error: e.message || 'Erreur lors de l\'acceptation de l\'invitation' }, { status: 500 })
  }
}

