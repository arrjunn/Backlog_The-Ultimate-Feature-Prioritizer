import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

interface TriageResult {
    category: 'bug' | 'feature' | 'improvement' | 'question'
    priority: 'high' | 'medium' | 'low'
    reason: string
    suggestedTags: string[]
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 256,
        }),
        signal: controller.signal,
    })
    clearTimeout(timeout)

    const data = await res.json()
    return data?.choices?.[0]?.message?.content || ''
}

export async function POST(req: NextRequest) {
    // Internal-only endpoint: called from embed route after embedding completes
    // Secured by checking for internal secret header
    const internalSecret = req.headers.get('x-internal-secret')
    if (internalSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { requestId } = await req.json()
        if (!requestId || typeof requestId !== 'string') {
            return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Fetch the request
        const { data: request, error: fetchError } = await supabase
            .from('feature_requests')
            .select('id, title, description, tags, status')
            .eq('id', requestId)
            .single()

        if (fetchError || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        const requestText = `Title: ${request.title}\nDescription: ${request.description || 'None'}\nTags: ${(request.tags || []).join(', ') || 'None'}`

        // ─── STEP 1: Classify type ───────────────────────────────
        const classifyResponse = await callGroq(
            `You are a request classifier. Classify the following feature request into exactly one category.
Reply with ONLY one word: bug, feature, improvement, or question.
- bug: something is broken or not working correctly
- feature: a new capability that doesn't exist yet
- improvement: enhancing something that already exists
- question: asking for help, clarification, or information`,
            requestText
        )

        const rawCategory = classifyResponse.trim().toLowerCase().replace(/[^a-z]/g, '')
        const category = (['bug', 'feature', 'improvement', 'question'].includes(rawCategory)
            ? rawCategory
            : 'feature') as TriageResult['category']

        // ─── STEP 2: Assign priority ────────────────────────────
        const priorityResponse = await callGroq(
            `You are a priority assessor for a product backlog. Given a feature request classified as "${category}", assign a priority level.
Reply in this exact format (2 lines only):
PRIORITY: high|medium|low
REASON: one sentence explaining why

Priority guidelines:
- high: affects many users, security issue, blocking critical workflow, or data loss risk
- medium: useful improvement, moderate user impact, nice-to-have but not urgent
- low: cosmetic, edge case, affects few users, or has easy workarounds`,
            requestText
        )

        const priorityMatch = priorityResponse.match(/PRIORITY:\s*(high|medium|low)/i)
        const reasonMatch = priorityResponse.match(/REASON:\s*(.+)/i)
        const priority = (priorityMatch?.[1]?.toLowerCase() || 'medium') as TriageResult['priority']
        const reason = reasonMatch?.[1]?.trim() || `Auto-classified as ${priority} priority ${category}`

        // ─── STEP 3: Suggest tags ────────────────────────────────
        const tagsResponse = await callGroq(
            `You are a tag suggester for a product backlog. Suggest 1-3 relevant tags for this ${category} request.
Reply with ONLY comma-separated lowercase tags using hyphens for spaces. Example: auth, user-experience, performance
Do not include generic tags like "feature" or "request". Be specific to the content.`,
            requestText
        )

        const suggestedTags = tagsResponse
            .split(',')
            .map(t => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
            .filter(t => t.length > 0 && t.length < 30)
            .slice(0, 3)

        // ─── STEP 4: Update the request ──────────────────────────
        const existingTags = request.tags || []
        const newTags = suggestedTags.filter(t => !existingTags.includes(t))
        const mergedTags = [...existingTags, ...newTags].slice(0, 10)

        const { error: updateError } = await supabase
            .from('feature_requests')
            .update({
                category,
                priority,
                triage_reason: reason,
                tags: mergedTags,
            })
            .eq('id', requestId)

        if (updateError) {
            console.error('Triage update error:', updateError)
            return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
        }

        return NextResponse.json({
            category,
            priority,
            reason,
            suggestedTags,
            mergedTags,
        })
    } catch (err) {
        console.error('Triage error:', err)
        return NextResponse.json({ error: 'Triage failed' }, { status: 500 })
    }
}
