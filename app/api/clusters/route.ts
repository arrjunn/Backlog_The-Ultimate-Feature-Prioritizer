import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateApiRoute } from '@/lib/supabase/api-auth'
import { kMeansCosine, suggestK } from '@/lib/utils/kmeans'
import { generateClusterName, deduplicateNames } from '@/lib/utils/cluster-naming'

const CLUSTER_COLORS = [
    '#8b5cf6', '#f97316', '#3b82f6', '#22c55e', '#ec4899',
    '#14b8a6', '#eab308', '#ef4444', '#6366f1', '#6b7280',
]

export async function POST(req: NextRequest) {
    const auth = await authenticateApiRoute()
    if (auth.error) return auth.error

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase env vars not configured' }, { status: 500 })
    }

    try {
        const { workspaceId, k: requestedK } = await req.json()
        if (!workspaceId || typeof workspaceId !== 'string') {
            return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
        }
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
            return NextResponse.json({ error: 'Invalid workspaceId' }, { status: 400 })
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

        // Fetch all requests (count total)
        const { count: totalRequests } = await supabase
            .from('feature_requests')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)

        // Fetch requests with embeddings
        const { data: requests, error: fetchError } = await supabase
            .from('feature_requests')
            .select('id, title, status, description, rice_score, created_at, embedding')
            .eq('workspace_id', workspaceId)
            .not('embedding', 'is', null)

        if (fetchError) {
            console.error('Cluster fetch error:', fetchError)
            return NextResponse.json({ error: `Failed to fetch requests: ${fetchError.message}` }, { status: 500 })
        }

        const embedded = requests || []
        const embeddedCount = embedded.length

        if (embeddedCount < 2) {
            return NextResponse.json({
                error: 'Need at least 2 embedded requests to cluster',
                meta: { totalRequests: totalRequests || 0, embeddedCount },
            }, { status: 422 })
        }

        // Get vote counts scoped to this workspace's requests (avoids full table scan)
        const reqIds = embedded.map((r) => r.id)
        const { data: voteCounts } = await supabase
            .from('votes')
            .select('feature_request_id')
            .in('feature_request_id', reqIds)

        const voteMap = new Map<string, number>()
        for (const v of voteCounts || []) {
            const id = v.feature_request_id
            voteMap.set(id, (voteMap.get(id) || 0) + 1)
        }

        // Determine k
        let k = requestedK != null ? Math.max(2, Math.min(10, Math.floor(requestedK))) : suggestK(embeddedCount)
        k = Math.min(k, embeddedCount)

        // Extract embeddings (pgvector may return as string)
        const embeddings = embedded.map((r) => {
            const raw = r.embedding
            if (typeof raw === 'string') return JSON.parse(raw) as number[]
            return raw as number[]
        })
        const result = kMeansCosine(embeddings, k)

        // Verify we actually got k clusters — if not, force round-robin
        const uniqueClusters = new Set(result.assignments)
        if (uniqueClusters.size < k) {
            // Force redistribution: sort by distance from global mean, assign round-robin
            for (let i = 0; i < embedded.length; i++) {
                result.assignments[i] = i % k
            }
        }

        // Group requests by cluster
        const clusterGroups: Map<number, typeof embedded> = new Map()
        for (let i = 0; i < embedded.length; i++) {
            const cluster = result.assignments[i]
            if (!clusterGroups.has(cluster)) clusterGroups.set(cluster, [])
            clusterGroups.get(cluster)!.push(embedded[i])
        }

        // Build cluster objects
        const rawNames: string[] = []
        const clusterEntries: {
            id: number
            name: string
            color: string
            requests: {
                id: string
                title: string
                status: string
                description: string | null
                rice_score: number | null
                created_at: string
                vote_count: number
            }[]
            requestCount: number
            totalVotes: number
        }[] = []

        for (const [clusterId, items] of Array.from(clusterGroups.entries())) {
            const titles = items.map((r) => r.title)
            rawNames.push(generateClusterName(titles, clusterId))

            const reqs = items.map((r) => ({
                id: r.id,
                title: r.title,
                status: r.status,
                description: r.description,
                rice_score: r.rice_score,
                created_at: r.created_at,
                vote_count: voteMap.get(r.id) || 0,
            }))

            const totalVotes = reqs.reduce((sum, r) => sum + r.vote_count, 0)

            clusterEntries.push({
                id: clusterId,
                name: '', // filled after dedup
                color: CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length],
                requests: reqs.sort((a, b) => b.vote_count - a.vote_count),
                requestCount: reqs.length,
                totalVotes,
            })
        }

        // Deduplicate names
        const dedupedNames = deduplicateNames(rawNames)
        for (let i = 0; i < clusterEntries.length; i++) {
            clusterEntries[i].name = dedupedNames[i]
        }

        // Sort clusters by total votes descending
        clusterEntries.sort((a, b) => b.totalVotes - a.totalVotes)

        return NextResponse.json({
            clusters: clusterEntries,
            meta: {
                totalRequests: totalRequests || 0,
                embeddedCount,
                k,
                iterations: result.iterations,
            },
        })
    } catch (err) {
        console.error('Cluster error:', err)
        console.error('Cluster error:', err)
        return NextResponse.json({ error: 'Clustering failed' }, { status: 500 })
    }
}
