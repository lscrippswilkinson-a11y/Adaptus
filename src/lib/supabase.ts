import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True once the project keys are present in .env.local; the app falls back to
 * local-only mode until then, so it keeps working during setup. */
export const hasSupabase = Boolean(url && anonKey)

if (!hasSupabase) {
  console.warn(
    '[adaptus] Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local. Running in local-only mode.',
  )
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'public-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
