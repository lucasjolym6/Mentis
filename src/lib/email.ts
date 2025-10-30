// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvitationEmail({
  to,
  personaName,
  inviteUrl,
  inviterName,
}: {
  to: string
  personaName: string
  inviteUrl: string
  inviterName?: string
}) {
  // Vérification détaillée de la clé API
  const apiKey = process.env.RESEND_API_KEY
  console.log('[EMAIL] Checking API key:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    startsWith: apiKey?.substring(0, 3) || 'N/A',
    isInEnv: typeof process.env.RESEND_API_KEY !== 'undefined',
  })
  
  if (!apiKey || apiKey.trim().length === 0) {
    console.error('[EMAIL] ❌ RESEND_API_KEY is missing or empty!')
    console.error('[EMAIL] Make sure RESEND_API_KEY is set in .env.local')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }
  
  if (!apiKey.startsWith('re_')) {
    console.warn('[EMAIL] ⚠️ API key format might be incorrect (should start with "re_")')
  }

  try {
    // Email expéditeur:
    // - Si vous avez vérifié votre domaine dans Resend: utilisez RESEND_FROM_EMAIL (ex: noreply@votredomaine.com)
    // - Sinon, utilisez l'adresse de test Resend: onboarding@resend.dev (fonctionne sans configuration)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    
    console.log('[EMAIL] Attempting to send invitation email:', {
      from: fromEmail,
      to,
      personaName,
      inviteUrl,
      hasApiKey: !!apiKey,
    })
    
    console.log('[EMAIL] 🚀 Calling Resend API...')
    console.log('[EMAIL] Request details:', {
      from: fromEmail,
      to: [to],
      subject: `Invitation à rejoindre "${personaName}" sur Mentis`,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A',
    })
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Invitation à rejoindre "${personaName}" sur Mentis`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation Mentis</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #006BFF 0%, #22D3EE 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Invitation Mentis</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px; margin: 0 0 20px 0;">
                ${inviterName ? `Bonjour,<br><br>${inviterName} vous invite à rejoindre son jumeau cognitif <strong>"${personaName}"</strong> sur Mentis.` : `Bonjour,<br><br>Vous avez été invité(e) à rejoindre le jumeau cognitif <strong>"${personaName}"</strong> sur Mentis.`}
              </p>
              <p style="font-size: 16px; margin: 0 0 30px 0;">
                Mentis est une plateforme qui permet de créer et d'interagir avec des intelligences artificielles personnalisées.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #006BFF 0%, #22D3EE 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Créer mon compte et accepter
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Ou copiez ce lien dans votre navigateur :<br>
                <a href="${inviteUrl}" style="color: #006BFF; word-break: break-all;">${inviteUrl}</a>
              </p>
              <p style="font-size: 12px; color: #9ca3af; margin: 20px 0 0 0;">
                Cette invitation expire dans 7 jours.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
        Invitation à rejoindre "${personaName}" sur Mentis
        
        ${inviterName ? `${inviterName} vous invite à rejoindre son jumeau cognitif "${personaName}" sur Mentis.` : `Vous avez été invité(e) à rejoindre le jumeau cognitif "${personaName}" sur Mentis.`}
        
        Mentis est une plateforme qui permet de créer et d'interagir avec des intelligences artificielles personnalisées.
        
        Pour créer votre compte et accepter l'invitation, cliquez sur le lien suivant :
        ${inviteUrl}
        
        Cette invitation expire dans 7 jours.
      `,
    })

    if (error) {
      console.error('[EMAIL] ❌ Resend API returned an error:', {
        error,
        message: error.message,
        name: error.name,
        type: typeof error,
        keys: Object.keys(error || {}),
        fullError: JSON.stringify(error, null, 2),
      })
      
      // Gestion spécifique de l'erreur de domaine non vérifié
      if (error.message && error.message.includes('only send testing emails to your own email address')) {
        const friendlyError = 'L\'adresse de test Resend ne permet d\'envoyer qu\'à votre propre adresse email. Pour envoyer à d\'autres destinataires, vous devez vérifier un domaine dans Resend (https://resend.com/domains) et utiliser une adresse email de ce domaine.'
        return { success: false, error: friendlyError, errorCode: 'DOMAIN_NOT_VERIFIED' }
      }
      
      return { success: false, error: error.message || 'Erreur Resend inconnue' }
    }

    if (!data) {
      console.error('[EMAIL] ❌ Resend API returned no data and no error (unexpected)')
      return { success: false, error: 'Resend returned no data' }
    }

    console.log('[EMAIL] ✅ Email sent successfully!', {
      emailId: data?.id,
      to,
      from: fromEmail,
      dataKeys: Object.keys(data || {}),
    })

    // Note importante: avec onboarding@resend.dev, l'email peut ne pas arriver pour certaines adresses
    // Vérifiez dans le dashboard Resend: https://resend.com/emails
    if (fromEmail === 'onboarding@resend.dev') {
      console.warn('[EMAIL] Using test email address. Limitations apply:')
      console.warn('[EMAIL] - Only works with certain email providers')
      console.warn('[EMAIL] - May be blocked by spam filters')
      console.warn('[EMAIL] - Check delivery status at: https://resend.com/emails')
    }

    return { success: true, id: data?.id, emailId: data?.id }
  } catch (e: any) {
    console.error('[EMAIL] Unexpected error:', {
      message: e.message,
      stack: e.stack,
      name: e.name,
      fullError: e,
    })
    return { success: false, error: e.message || 'Erreur lors de l\'envoi de l\'email' }
  }
}

