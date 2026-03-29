import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateApiRoute } from '@/lib/supabase/api-auth'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!

export async function POST(req: NextRequest) {
    const auth = await authenticateApiRoute()
    if (auth.error) return auth.error

    try {
        const { query, workspaceId } = await req.json()
        if (!query || !workspaceId) return NextResponse.json({ error: 'Missing query or workspaceId' }, { status: 400 })
        if (typeof query !== 'string' || query.length > 500) {
            return NextResponse.json({ error: 'Query too long (max 500 chars)' }, { status: 400 })
        }
        if (typeof workspaceId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
            return NextResponse.json({ error: 'Invalid workspaceId' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Verify user is a member of the workspace
        const { data: membership } = await supabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .eq('user_id', auth.user!.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Convert search query to embedding
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text: query }] }
                }),
                signal: controller.signal,
            }
        )
        clearTimeout(timeout)

        const data = await res.json()
        const embedding = data?.embedding?.values

        if (!embedding) {
            return NextResponse.json({ error: 'Failed to embed query' }, { status: 500 })
        }

        // Search supabase for similar requests
        const { data: results, error } = await supabase.rpc('match_requests', {
            query_embedding: embedding,
            match_threshold: 0.35,
            match_count: 5,
            p_workspace_id: workspaceId
        })

        if (error) throw error

        return NextResponse.json({ results })
    } catch (err) {
        console.error('Search error:', err)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
