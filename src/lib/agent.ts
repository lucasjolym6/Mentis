// src/lib/agent.ts
import { openai } from './openai'

type Persona = {
  id: number
  name: string
  description?: string | null
  style?: string | null
  tone?: string | null
  constraints?: string | null
  system_prompt?: string | null
}

export function buildSystemFor(persona: Persona) {
  const parts = [
    `Tu es "${persona.name}", un jumeau cognitif (agent) qui raisonne avec clarté et rigueur.`,
    persona.description ? `Description: ${persona.description}` : "",
    persona.style ? `Style: ${persona.style}` : "",
    persona.tone ? `Ton: ${persona.tone}` : "",
    persona.constraints ? `Contraintes: ${persona.constraints}` : "",
    persona.system_prompt ? `Consignes système: ${persona.system_prompt}` : "",
    `Règles: sois concis, explicite tes hypothèses, propose un plan d'action concret.`,
  ].filter(Boolean)
  return parts.join("\n")
}

// Tool "function" -> webhook HTTP sortant
export const webhookFunctionTool = {
  type: "function" as const,
  function: {
    name: "post_webhook",
    description: "POST un message ou un rapport JSON vers une URL externe (Slack/Notion/Discord/etc.). Utilise ce tool quand l'utilisateur demande d'envoyer un rapport, une notification, ou un résumé vers un service externe.",
    parameters: {
      type: "object",
      properties: {
        url: { 
          type: "string", 
          description: "URL complète du webhook (ex: https://hooks.slack.com/services/...)" 
        },
        payload: { 
          type: "object", 
          description: "Objet JSON à envoyer (sera sérialisé en JSON)" 
        }
      },
      required: ["url", "payload"]
    }
  }
}

// Récupérer les tools disponibles pour l'agent
// Note: web_search n'est pas disponible dans l'API Chat Completions standard
// Il faudrait utiliser l'API Assistants ou une intégration tierce pour web_search
export const getAvailableTools = (enableWebSearch: boolean = true, enableWebhook: boolean = true) => {
  const tools: any[] = []
  
  // Note: Pour activer web_search, il faudrait utiliser l'API Assistants d'OpenAI
  // ou intégrer un service tiers (Serper, Tavily, etc.)
  // Pour l'instant, on ne garde que le webhook tool qui fonctionne
  
  // Webhook function tool (custom)
  if (enableWebhook) {
    tools.push(webhookFunctionTool)
  }
  
  // TODO: Ajouter un tool web_search custom si nécessaire
  // Exemple avec un service tierce :
  // if (enableWebSearch) {
  //   tools.push(webSearchCustomTool)
  // }
  
  return tools
}

// Handler pour exécuter les function calls
export async function executeFunctionCall(functionName: string, args: any) {
  if (functionName === "post_webhook") {
    const { url, payload } = args
    
    if (!url || typeof url !== 'string') {
      throw new Error("URL du webhook invalide")
    }
    
    if (!payload || typeof payload !== 'object') {
      throw new Error("Payload du webhook invalide")
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue')
        throw new Error(`Webhook a échoué: ${response.status} ${errorText}`)
      }
      
      const responseData = await response.json().catch(() => ({ ok: true }))
      return {
        success: true,
        response: responseData,
        message: "Webhook envoyé avec succès"
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erreur lors de l'envoi du webhook"
      }
    }
  }
  
  throw new Error(`Fonction inconnue: ${functionName}`)
}

