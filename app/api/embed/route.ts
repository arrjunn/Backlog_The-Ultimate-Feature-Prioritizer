import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!

export async function POST(req: NextRequest) {
    try {
        const { id, text } = await req.json()
        if (!id || !text) return NextResponse.json({ error: 'Missing id or text' }, { status: 400 })

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
        console.log('Google embedding response:', JSON.stringify(data))

        const embedding = data?.embedding?.values
        if (!embedding) {
            console.error('No embedding in response:', JSON.stringify(data))
            return NextResponse.json({ error: 'No embedding returned' }, { status: 500 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

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
