import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateApiRoute } from '@/lib/supabase/api-auth'
import { createAskEngine } from '@/lib/llamaindex/engine'

export async function POST(req: NextRequest) {
    const auth = await authenticateApiRoute()
    if (auth.error) return auth.error

    try {
        const { question, workspaceId } = await req.json()

        if (!question || !workspaceId) {
            return NextResponse.json({ error: 'Missing question or workspaceId' }, { status: 400 })
        }
        if (typeof question !== 'string' || question.length > 500) {
            return NextResponse.json({ error: 'Question too long (max 500 chars)' }, { status: 400 })
        }
        if (typeof workspaceId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
            return NextResponse.json({ error: 'Invalid workspaceId' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Supabase env vars not configured' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Verify workspace membership
        const { data: membership } = await supabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .eq('user_id', auth.user!.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Create engine and query
        const { engine, retriever } = createAskEngine({ supabase, workspaceId })
        const response = await engine.query({ query: question })

        return NextResponse.json({
            answer: response.toString(),
            sources: retriever.lastSources,
        })
    } catch (err) {
        console.error('Ask error:', err)
        return NextResponse.json({ error: 'Failed to answer question' }, { status: 500 })
    }
}
