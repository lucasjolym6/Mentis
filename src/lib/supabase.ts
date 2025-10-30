// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

/** Client côté navigateur (lecture/écriture sécurisée par RLS) */
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/** Client admin côté serveur UNIQUEMENT (bypass RLS)
 *  ⚠️ N'UTILISE PAS ceci dans des fichiers "use client"
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

