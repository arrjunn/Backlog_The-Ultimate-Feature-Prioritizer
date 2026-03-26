import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!

export async function POST() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // get all requests that don't have embeddings yet
        const { data: requests, error: fetchError } = await supabase
            .from('feature_requests')
            .select('id, title, description, tags')
            .is('embedding', null)

        if (fetchError) throw fetchError
        if (!requests || requests.length === 0) {
            return NextResponse.json({ message: 'No requests need embedding', count: 0 })
        }

        let successCount = 0
        let failCount = 0

        for (const req of requests) {
            try {
                const text = `${req.title} ${req.description || ''} ${(req.tags || []).join(' ')}`

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: { parts: [{ text }] }
                        })
                    }
                )

                const data = await res.json()
                const embedding = data?.embedding?.values

                if (!embedding) {
                    console.error(`No embedding for request ${req.id}:`, JSON.stringify(data))
                    failCount++
                    continue
                }

                const { error: updateError } = await supabase
                    .from('feature_requests')
                    .update({ embedding })
                    .eq('id', req.id)

                if (updateError) {
                    console.error(`Failed to update request ${req.id}:`, updateError)
                    failCount++
                } else {
                    successCount++
                    console.log(`Embedded request ${req.id}: ${req.title}`)
                }

                // small delay to avoid hitting Google's rate limit
                await new Promise(resolve => setTimeout(resolve, 200))

            } catch (err) {
                console.error(`Error processing request ${req.id}:`, err)
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