import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendInvitationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

const ShareSchema = z.object({
  email: z.string().email(),
  role: z.enum(['viewer', 'editor']).default('viewer'),
  // Support legacy: member_user_id pour compatibilité
  member_user_id: z.string().uuid().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const id = Number(resolvedParams.id)
    if (!Number.isInteger(id)) throw new Error('Invalid id')
    
    const body = ShareSchema.parse(await req.json())
    const db = supabaseAdmin()

    // Si un member_user_id est fourni (ancien système), utiliser directement
    if (body.member_user_id) {
      const { error } = await db
        .from('persona_members')
        .upsert(
          { persona_id: id, member_user_id: body.member_user_id, role: body.role },
          { onConflict: 'persona_id,member_user_id' }
        )
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    // Nouveau système: inviter par email
    if (!body.email) {
      throw new Error('Email requis')
    }

    // Vérifier si l'utilisateur existe déjà
    try {
      const { data: users, error: listError } = await db.auth.admin.listUsers()
      
      if (!listError && users?.users) {
        const existingUser = users.users.find((u: any) => u.email?.toLowerCase() === body.email.toLowerCase())
        
        if (existingUser) {
          // Utilisateur existe déjà: ajouter directement à persona_members
          const { error: memberError } = await db
            .from('persona_members')
            .upsert(
              { persona_id: id, member_user_id: existingUser.id, role: body.role },
              { onConflict: 'persona_id,member_user_id' }
            )
          if (memberError) throw memberError
          
          // TODO: Envoyer une notification email (optionnel)
          return NextResponse.json({ ok: true, message: 'Accès accordé à l\'utilisateur existant' })
        }
      }
    } catch (authError: any) {
      // Si la vérification échoue, on continue quand même avec la création d'invitation
      console.error('Auth check error:', authError)
    }

    // Créer un token d'invitation unique
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expire dans 7 jours

    // Vérifier si une invitation existe déjà pour cet email/persona
    const { data: existingInvite } = await db
      .from('persona_invitations')
      .select('id')
      .eq('persona_id', id)
      .eq('email', body.email)
      .is('accepted_at', null)
      .single()

    if (existingInvite) {
      // Mettre à jour l'invitation existante
      const { error: updateError } = await db
        .from('persona_invitations')
        .update({
          token,
          role: body.role,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        })
        .eq('id', existingInvite.id)
      
      if (updateError) throw updateError
    } else {
      // Créer une nouvelle invitation
      const { error: insertError } = await db
        .from('persona_invitations')
        .insert({
          persona_id: id,
          email: body.email.toLowerCase().trim(),
          role: body.role,
          token,
          expires_at: expiresAt.toISOString(),
        })
      
      if (insertError) throw insertError
    }

    // Récupérer les infos du persona pour l'email
    const { data: persona } = await db
      .from('personas')
      .select('id, name, description')
      .eq('id', id)
      .single()

    // Construire l'URL d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000')
    const inviteUrl = `${baseUrl}/invite/${token}`

    // Récupérer le nom de l'inviteur (optionnel)
    let inviterName: string | undefined
    try {
      const url = new URL(req.url)
      // On pourrait récupérer l'utilisateur actuel depuis le token JWT si nécessaire
      // Pour l'instant, on laisse undefined
    } catch {}

    // Envoyer l'email d'invitation via Resend
    const emailResult = await sendInvitationEmail({
      to: body.email,
      personaName: persona?.name || 'Un Mentis',
      inviteUrl,
      inviterName,
    })

    if (!emailResult.success) {
      console.error('[SHARE API] Email send failed:', emailResult.error)
      // On continue quand même car l'invitation est créée
      // L'utilisateur peut toujours accéder via l'URL directement
      return NextResponse.json({ 
        ok: true, 
        message: 'Invitation créée avec succès, mais l\'email n\'a pas pu être envoyé',
        invite_url: inviteUrl,
        email_sent: false,
        email_error: emailResult.error,
        warning: 'L\'invitation a été créée. Vous pouvez partager le lien manuellement.',
      })
    }

    console.log('[SHARE API] Invitation email sent successfully:', emailResult.id)

    return NextResponse.json({ 
      ok: true, 
      message: 'Invitation créée et email envoyé avec succès',
      invite_url: inviteUrl,
      email_sent: true,
      email_id: emailResult.id,
    })
  } catch (e: any) {
    console.error('Share API error:', e)
    return NextResponse.json({ error: e.message || 'Erreur lors du partage' }, { status: 400 })
  }
}


