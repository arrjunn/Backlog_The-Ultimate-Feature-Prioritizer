import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { apiKey, teamId, request } = await req.json()

        if (!apiKey || !teamId || !request?.title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

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

        const res = await fetch('https://api.linear.app/graphql', {
            method: 'POST',
            headers: {
                Authorization: apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: mutation, variables }),
        })

        if (!res.ok) {
            const err = await res.text()
            return NextResponse.json({ error: err }, { status: res.status })
        }

        const json = await res.json()
        if (json.errors?.length) {
            return NextResponse.json({ error: json.errors[0].message }, { status: 400 })
        }

        const issue = json.data?.issueCreate?.issue
        return NextResponse.json({ url: issue?.url, id: issue?.id })
    } catch (err: any) {
        return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
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
