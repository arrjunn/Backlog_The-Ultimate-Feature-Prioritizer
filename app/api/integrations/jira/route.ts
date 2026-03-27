import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRoute } from '@/lib/supabase/api-auth'
import { getErrorMessage } from '@/lib/utils/shared'
import { z } from 'zod'

const JiraSchema = z.object({
    jiraUrl: z.string().url().refine(url => {
        try {
            const u = new URL(url)
            return u.protocol === 'https:' && (u.hostname.endsWith('.atlassian.net') || u.hostname.endsWith('.jira.com'))
        } catch { return false }
    }, 'Must be an HTTPS Atlassian domain'),
    email: z.string().email(),
    apiToken: z.string().min(1).max(500),
    projectKey: z.string().min(1).max(20),
    request: z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional().nullable(),
        rice_score: z.number().optional().nullable(),
        ice_score: z.number().optional().nullable(),
        wsjf_score: z.number().optional().nullable(),
        moscow_category: z.string().optional().nullable(),
        tags: z.array(z.string()).optional().nullable(),
        status: z.string().optional().nullable(),
    }),
})

export async function POST(req: NextRequest) {
    const auth = await authenticateApiRoute()
    if (auth.error) return auth.error

    try {
        const body = await req.json()
        const parsed = JiraSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
        }

        const { jiraUrl, email, apiToken, projectKey, request } = parsed.data

        const base = jiraUrl.replace(/\/$/, '')
        const authHeader = Buffer.from(`${email}:${apiToken}`).toString('base64')

        const payload: Record<string, unknown> = {
            fields: {
                project: { key: projectKey.toUpperCase() },
                summary: request.title,
                description: {
                    version: 1,
                    type: 'doc',
                    content: buildJiraDoc(request),
                },
                issuetype: { name: 'Story' },
            },
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const res = await fetch(`${base}/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${authHeader}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        })
        clearTimeout(timeout)

        if (!res.ok) {
            const err = await res.json()
            const msg = err.errors ? JSON.stringify(err.errors) : (err.errorMessages?.[0] ?? JSON.stringify(err))
            return NextResponse.json({ error: msg }, { status: res.status })
        }

        const issue = await res.json()
        const url = `${base}/browse/${issue.key}`
        return NextResponse.json({ url, id: issue.key })
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}

function textNode(text: string) {
    return { type: 'text', text }
}

function paragraph(...texts: string[]): unknown {
    return { type: 'paragraph', content: texts.map(t => ({ type: 'text', text: t })) }
}

function buildJiraDoc(request: Record<string, unknown>): unknown {
    const content: unknown[] = []

    if (request.description) {
        content.push(paragraph(String(request.description)))
        content.push(paragraph(''))
    }

    const scoreLines: string[] = []
    if (request.rice_score != null) scoreLines.push(`RICE Score: ${request.rice_score}`)
    if (request.ice_score != null) scoreLines.push(`ICE Score: ${request.ice_score}`)
    if (request.wsjf_score != null) scoreLines.push(`WSJF Score: ${request.wsjf_score}`)
    if (request.moscow_category) scoreLines.push(`MoSCoW: ${request.moscow_category}`)
    if ((request.tags as string[])?.length) scoreLines.push(`Tags: ${(request.tags as string[]).join(', ')}`)

    if (scoreLines.length > 0) {
        content.push({ type: 'heading', attrs: { level: 3 }, content: [textNode('Framework Scores')] })
        content.push({ type: 'bulletList', content: scoreLines.map(line => ({ type: 'listItem', content: [paragraph(line)] })) })
    }

    content.push(paragraph('---'))
    content.push(paragraph('Pushed from Backlog'))

    return { version: 1, type: 'doc', content }
}
