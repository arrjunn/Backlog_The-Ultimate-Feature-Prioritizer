import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRoute } from '@/lib/supabase/api-auth'
import { getErrorMessage } from '@/lib/utils/shared'
import { z } from 'zod'

const NotionSchema = z.object({
    apiKey: z.string().min(1).max(500),
    databaseId: z.string().min(1).max(100),
    request: z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional().nullable(),
        status: z.string().optional().nullable(),
        rice_score: z.number().optional().nullable(),
        tags: z.array(z.string()).optional().nullable(),
    }),
})

export async function POST(req: NextRequest) {
    // Auth check
    const auth = await authenticateApiRoute()
    if (auth.error) return auth.error

    try {
        const body = await req.json()
        const parsed = NotionSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
        }

        const { apiKey, databaseId, request } = parsed.data

        // Build Notion page properties
        const properties: Record<string, unknown> = {
            // Name is the title property in most Notion DBs
            Name: {
                title: [{ text: { content: request.title } }],
            },
        }

        // Add optional properties if they exist in the DB (Notion ignores unknown ones)
        if (request.status) {
            properties['Status'] = { select: { name: capitalizeStatus(request.status) } }
        }
        if (request.description) {
            properties['Description'] = {
                rich_text: [{ text: { content: request.description.slice(0, 2000) } }],
            }
        }
        if (request.rice_score != null) {
            properties['RICE Score'] = { number: request.rice_score }
        }
        if (request.tags?.length) {
            properties['Tags'] = {
                multi_select: request.tags.map((t: string) => ({ name: t })),
            }
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const res = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28',
            },
            body: JSON.stringify({
                parent: { database_id: databaseId },
                properties,
            }),
            signal: controller.signal,
        })
        clearTimeout(timeout)

        if (!res.ok) {
            const err = await res.json()
            return NextResponse.json({ error: err.message ?? JSON.stringify(err) }, { status: res.status })
        }

        const page = await res.json()
        return NextResponse.json({ url: page.url, id: page.id })
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}

function capitalizeStatus(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}
