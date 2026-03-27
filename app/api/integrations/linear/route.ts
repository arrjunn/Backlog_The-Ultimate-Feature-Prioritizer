import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRoute } from '@/lib/supabase/api-auth'
import { getErrorMessage } from '@/lib/utils/shared'
import { z } from 'zod'

const LinearSchema = z.object({
    apiKey: z.string().min(1).max(500),
    teamId: z.string().min(1).max(100),
    request: z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional().nullable(),
        rice_score: z.number().optional().nullable(),
        ice_score: z.number().optional().nullable(),
        wsjf_score: z.number().optional().nullable(),
        tags: z.array(z.string()).optional().nullable(),
        status: z.string().optional().nullable(),
    }),
})

export async function POST(req: NextRequest) {
    // Auth check
    const auth = await authenticateApiRoute()
    if (auth.error) return auth.error

    try {
        const body = await req.json()
        const parsed = LinearSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
        }

        const { apiKey, teamId, request } = parsed.data

        // Linear uses GraphQL
        const mutation = `
            mutation CreateIssue($input: IssueCreateInput!) {
                issueCreate(input: $input) {
                    success
                    issue { id url title }
                }
            }
        `

        const variables = {
            input: {
                teamId,
                title: request.title,
                description: buildLinearDescription(request),
                priority: mapPriorityFromRice(request.rice_score),
            },
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const res = await fetch('https://api.linear.app/graphql', {
            method: 'POST',
            headers: {
                Authorization: apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: mutation, variables }),
            signal: controller.signal,
        })
        clearTimeout(timeout)

        if (!res.ok) {
            const errText = await res.text()
            return NextResponse.json({ error: errText }, { status: res.status })
        }

        const json = await res.json()
        if (json.errors?.length) {
            return NextResponse.json({ error: json.errors[0].message }, { status: 400 })
        }

        const issue = json.data?.issueCreate?.issue
        return NextResponse.json({ url: issue?.url, id: issue?.id })
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}

function buildLinearDescription(request: Record<string, unknown>): string {
    const lines: string[] = []
    if (request.description) lines.push(String(request.description))
    lines.push('')
    lines.push('---')
    lines.push('**Pushed from Backlog**')
    if (request.rice_score != null) lines.push(`- RICE Score: **${request.rice_score}**`)
    if (request.ice_score != null) lines.push(`- ICE Score: **${request.ice_score}**`)
    if (request.wsjf_score != null) lines.push(`- WSJF Score: **${request.wsjf_score}**`)
    if ((request.tags as string[])?.length) lines.push(`- Tags: ${(request.tags as string[]).join(', ')}`)
    if (request.status) lines.push(`- Status: ${request.status}`)
    return lines.join('\n')
}

function mapPriorityFromRice(riceScore: number | null | undefined): number {
    // Linear priorities: 0=No priority, 1=Urgent, 2=High, 3=Medium, 4=Low
    if (riceScore == null) return 0
    if (riceScore >= 100) return 1 // Urgent
    if (riceScore >= 50) return 2  // High
    if (riceScore >= 20) return 3  // Medium
    return 4                        // Low
}
