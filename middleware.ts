import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // If Supabase env vars aren't configured yet, allow all traffic through
    // (this prevents the app from crashing before credentials are set up)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.next()
    }

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Do not run any logic between createServerClient and getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Public routes - no auth required
    const isPublicRoute =
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/forgot-password' ||
        pathname === '/verify-email' ||
        pathname.startsWith('/auth/') ||
        pathname.startsWith('/api/digest') ||
        pathname.startsWith('/api/backfill-embeddings')

    // Redirect unauthenticated users away from protected routesvscode-webview://15v1jo83ju7pf6fq1uji1suohhchk95ehgk5178sdd2tjlk1jlqq/supabase/migrations/20260327000000_add_embeddings.sql
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from auth pages
    if (user && (pathname === '/login' || pathname === '/signup')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}