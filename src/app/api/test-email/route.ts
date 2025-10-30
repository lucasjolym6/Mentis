// API route pour tester l'envoi d'email
import { NextResponse } from 'next/server'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log('[TEST EMAIL] Starting email test...')
    console.log('[TEST EMAIL] Environment check:', {
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) || 'N/A',
    })

    const result = await sendInvitationEmail({
      to: email,
      personaName: 'Mentis de test',
      inviteUrl: 'https://mentis.app/invite/test-token-123',
      inviterName: 'Système de test',
    })

    console.log('[TEST EMAIL] Result:', result)

    return NextResponse.json({
      success: result.success,
      error: result.error,
      emailId: result.id,
      message: result.success 
        ? 'Email envoyé avec succès ! Vérifiez https://resend.com/emails'
        : `Erreur: ${result.error}`,
    })
  } catch (e: any) {
    console.error('[TEST EMAIL] Exception:', e)
    return NextResponse.json({ 
      error: e.message || 'Erreur inattendue',
      stack: e.stack,
    }, { status: 500 })
  }
}

