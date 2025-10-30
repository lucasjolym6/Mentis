import { NextResponse } from "next/server"
import { openai } from "@/lib/openai"
import { buildSystemFor } from "@/lib/agent"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET() {
  try {
    // Exemple: prendre les 10 derniers personas et générer un mini brief chacun
    const db = supabaseAdmin()
    const { data: personas, error: pErr } = await db
      .from("personas")
      .select("id, name, description, style, tone, constraints, system_prompt")
      .order("created_at", { ascending: false })
      .limit(10)
    
    if (pErr) {
      console.error('Error fetching personas:', pErr)
      return NextResponse.json({ error: 'Erreur lors de la récupération des personas' }, { status: 500 })
    }

    const results: any[] = []
    
    for (const p of personas ?? []) {
      try {
        // Récupérer les 5 derniers documents du persona
        const { data: docs, error: dErr } = await db
          .from("documents")
          .select("content")
          .eq("persona_id", p.id)
          .order("created_at", { ascending: false })
          .limit(5)
        
        if (dErr) {
          console.error(`Error fetching docs for persona ${p.id}:`, dErr)
          continue
        }

        const rag = (docs ?? []).map((d, i) => `[Doc ${i + 1}]\n${d.content}`).join("\n\n")
        const sys = buildSystemFor(p)
        
        // Utiliser l'API Chat Completions standard (pas responses.create)
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            { role: "system", content: sys },
            { 
              role: "user", 
              content: `Fais un brief des nouveautés et 3 actions clés.\n\nContexte:\n${rag || "(pas de documents)"}` 
            }
          ],
        })

        const text = completion.choices[0]?.message?.content || "(aucune réponse générée)"
        
        results.push({ 
          personaId: p.id, 
          personaName: p.name,
          text,
          docsCount: docs?.length || 0
        })
      } catch (e: any) {
        console.error(`Error generating brief for persona ${p.id}:`, e)
        results.push({ 
          personaId: p.id, 
          personaName: p.name,
          text: `Erreur: ${e.message || 'Erreur lors de la génération du brief'}`,
          error: true
        })
      }
    }

    return NextResponse.json({ 
      ok: true, 
      results,
      count: results.length
    })
  } catch (e: any) {
    console.error('Briefs API error:', e)
    return NextResponse.json({ 
      error: e.message || 'Erreur lors de la génération des briefs' 
    }, { status: 500 })
  }
}

