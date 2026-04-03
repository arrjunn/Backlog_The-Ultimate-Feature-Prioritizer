import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateApiRoute } from '@/lib/supabase/api-auth'
import type { MatchedRequest } from '@/types/ask.types'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!

const SYSTEM_PROMPT = `You are a helpful assistant for a product team's feature request backlog.
Answer the user's question based ONLY on the provided feature request data below.
Be concise and specific. Reference feature requests by their exact title in quotes.
If the data doesn't contain enough information to answer, say so clearly.
Do not make up information that isn't in the provided context.
Format your response in plain text with clear structure.`

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

        // Step 1: Embed the question (same pattern as /api/search)
        const embedController = new AbortController()
        const embedTimeout = setTimeout(() => embedController.abort(), 15000)

        const embedRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: { parts: [{ text: question }] } }),
                signal: embedController.signal,
            }
        )
        clearTimeout(embedTimeout)

        const embedData = await embedRes.json()
        const embedding = embedData?.embedding?.values
        if (!embedding) {
            return NextResponse.json({ error: 'Failed to embed question' }, { status: 500 })
        }

        // Step 2: Retrieve relevant feature requests via existing RPC
        const { data: results, error: rpcError } = await supabase.rpc('match_requests', {
            query_embedding: embedding,
            match_threshold: 0.30,
            match_count: 12,
            p_workspace_id: workspaceId,
        })

        if (rpcError) throw rpcError
        const sources = (results || []) as MatchedRequest[]

        // Step 3: Build context from retrieved requests
        const context = sources.map((r, i) => {
            const lines = [`${i + 1}. Title: ${r.title}`]
            if (r.description) lines.push(`   Description: ${r.description}`)
            lines.push(`   Status: ${r.status}`)
            if (r.rice_score != null) lines.push(`   RICE Score: ${r.rice_score}`)
            lines.push(`   Created: ${r.created_at}`)
            return lines.join('\n')
        }).join('\n\n')

        if (!context) {
            return NextResponse.json({
                answer: 'No feature requests found with embeddings in this workspace. Make sure some requests have been embedded.',
                sources: [],
            })
        }

        // Step 4: Call Gemini to synthesize an answer
        const llmController = new AbortController()
        const llmTimeout = setTimeout(() => llmController.abort(), 30000)

        const llmRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents: [{
                        parts: [{ text: `Feature request data:\n${context}\n\nQuestion: ${question}` }],
                    }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
                }),
                signal: llmController.signal,
            }
        )
        clearTimeout(llmTimeout)

        const llmData = await llmRes.json()
        const answer = llmData?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!answer) {
            console.error('No answer from Gemini:', JSON.stringify(llmData).slice(0, 500))
            return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 })
        }

        return NextResponse.json({ answer, sources })
    } catch (err) {
        console.error('Ask error:', err)
        return NextResponse.json({ error: 'Failed to answer question' }, { status: 500 })
    }
}
