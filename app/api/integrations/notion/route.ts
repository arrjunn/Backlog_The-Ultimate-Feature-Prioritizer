import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
    try {
        const { apiKey, databaseId, request } = await req.json()

        if (!apiKey || !databaseId || !request?.title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

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
        })

        if (!res.ok) {
            const err = await res.json()
            return NextResponse.json({ error: err.message ?? JSON.stringify(err) }, { status: res.status })
        }

        const page = await res.json()
        return NextResponse.json({ url: page.url, id: page.id })
    } catch (err: any) {
        return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
    }
}

function capitalizeStatus(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}
