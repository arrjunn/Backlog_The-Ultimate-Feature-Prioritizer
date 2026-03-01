import { createBrowserClient } from '@supabase/ssr'

/**
 * Returns an untyped Supabase client. Use this in places where the
 * PostgREST v12 generic overloads collapse to `never` due to our
 * manually-authored Database type shape not perfectly matching the
 * generated type structure. At runtime behaviour is identical.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createUntypedClient(): any {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
