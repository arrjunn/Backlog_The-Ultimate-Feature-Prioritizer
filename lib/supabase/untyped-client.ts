import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns an untyped Supabase client for mutations (insert/update/delete).
 *
 * PostgREST v12's generic overloads collapse to `never` when using
 * manually-authored Database types (a known issue with @supabase/supabase-js v2).
 * Read operations (.select, .eq, etc.) work fine with the typed client.
 * Use this client only for .insert() / .update() / .delete() calls that
 * trigger the `never` type error.
 *
 * At runtime, this is identical to the typed client (same singleton).
 */
export function createUntypedClient(): SupabaseClient {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
