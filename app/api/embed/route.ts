import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateApiRoute } from '@/lib/supabase/api-auth'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!

export async function POST(req: NextRequest) {
    const auth = await authenticateApiRoute()
    if (auth.error) return auth.error

    try {
        const { id, text } = await req.json()
        if (!id || !text) return NextResponse.json({ error: 'Missing id or text' }, { status: 400 })
        if (typeof text !== 'string' || text.length > 5000) {
            return NextResponse.json({ error: 'Text too long (max 5,000 chars)' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Verify the feature request belongs to a workspace the user has access to
        const { data: featureRequest } = await supabase
            .from('feature_requests')
            .select('workspace_id')
            .eq('id', id)
            .single()

        if (!featureRequest) {
            return NextResponse.json({ error: 'Feature request not found' }, { status: 404 })
        }

        const { data: membership } = await supabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', featureRequest.workspace_id)
            .eq('user_id', auth.user!.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text }] }
                }),
                signal: controller.signal,
            }
        )
        clearTimeout(timeout)

        const data = await res.json()

        const embedding = data?.embedding?.values
        if (!embedding) {
            console.error('No embedding in response:', res.status)
            return NextResponse.json({ error: 'No embedding returned' }, { status: 500 })
        }

        const { error } = await supabase
            .from('feature_requests')
            .update({ embedding })
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Embed error:', err)
        return NextResponse.json({ error: 'Failed to embed' }, { status: 500 })
    }
}
