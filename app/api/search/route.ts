import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!

export async function POST(req: NextRequest) {
    try {
        const { query, workspaceId } = await req.json()
        if (!query || !workspaceId) return NextResponse.json({ error: 'Missing query or workspaceId' }, { status: 400 })

        // convert search query to embedding
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text: query }] }
                })
            }
        )

        const data = await res.json()
        const embedding = data?.embedding?.values

        if (!embedding) {
            return NextResponse.json({ error: 'Failed to embed query' }, { status: 500 })
        }

        // search supabase for similar requests
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: results, error } = await supabase.rpc('match_requests', {
            query_embedding: embedding,
            match_threshold: 0.6,
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
