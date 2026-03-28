import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!
const BATCH_SIZE = 100

export async function POST(req: NextRequest) {
    // Protect with CRON_SECRET (same as digest) since this is an admin operation
    const cronSecret = process.env.CRON_SECRET
    const authHeader = req.headers.get('authorization')
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Get requests that don't have embeddings yet (paginated)
        const { data: requests, error: fetchError } = await supabase
            .from('feature_requests')
            .select('id, title, description, tags')
            .is('embedding', null)
            .limit(BATCH_SIZE)

        if (fetchError) throw fetchError
        if (!requests || requests.length === 0) {
            return NextResponse.json({ message: 'No requests need embedding', count: 0 })
        }

        let successCount = 0
        let failCount = 0

        for (const item of requests) {
            try {
                const text = `${item.title} ${item.description || ''} ${(item.tags || []).join(' ')}`

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

                let data: { embedding?: { values?: number[] } }
                try { data = await res.json() } catch {
                    console.error(`Failed to parse embedding response for ${item.id}`)
                    failCount++
                    continue
                }
                const embedding = data?.embedding?.values

                if (!embedding) {
                    console.error(`No embedding for request ${item.id}`)
                    failCount++
                    continue
                }

                const { error: updateError } = await supabase
                    .from('feature_requests')
                    .update({ embedding })
                    .eq('id', item.id)

                if (updateError) {
                    console.error(`Failed to update request ${item.id}:`, updateError.message)
                    failCount++
                } else {
                    successCount++
                }

                // Small delay to avoid hitting Google's rate limit
                await new Promise(resolve => setTimeout(resolve, 200))

            } catch (err) {
                console.error(`Error processing request ${item.id}:`, err)
                failCount++
            }
        }

        return NextResponse.json({
            message: 'Backfill complete',
            total: requests.length,
            success: successCount,
            failed: failCount
        })
    } catch (err) {
        console.error('Backfill error:', err)
        return NextResponse.json({ error: 'Backfill failed' }, { status: 500 })
    }
}
