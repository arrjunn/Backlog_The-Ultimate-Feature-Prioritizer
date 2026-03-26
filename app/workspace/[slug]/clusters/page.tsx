'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Network, AlertTriangle, Heart, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { STATUS_CONFIG, FeatureStatus } from '@/lib/utils/rice'
import { RequestSlideOver } from '@/components/features/requests/RequestSlideOver'
import { useWorkspace } from '../WorkspaceLayoutClient'
import { cn } from '@/lib/utils/cn'

interface ClusterRequest {
    id: string
    title: string
    status: string
    description: string | null
    rice_score: number | null
    created_at: string
    vote_count: number
}

interface Cluster {
    id: number
    name: string
    color: string
    requests: ClusterRequest[]
    requestCount: number
    totalVotes: number
}

interface ClusterResponse {
    clusters: Cluster[]
    meta: {
        totalRequests: number
        embeddedCount: number
        k: number
        iterations: number
    }
}

function ClusterCard({
    cluster,
    expanded,
    onToggle,
    onRequestClick,
}: {
    cluster: Cluster
    expanded: boolean
    onToggle: () => void
    onRequestClick: (id: string) => void
}) {
    const displayRequests = expanded ? cluster.requests : cluster.requests.slice(0, 5)
    const hasMore = cluster.requests.length > 5

    return (
        <Card className="group hover:border-primary/20 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    <span
                        className="h-3 w-3 rounded-full shrink-0 mt-1"
                        style={{ background: cluster.color }}
                    />
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold leading-tight">
                            {cluster.name}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span>{cluster.requestCount} request{cluster.requestCount !== 1 ? 's' : ''}</span>
                            <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {cluster.totalVotes}
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-1.5">
                    {displayRequests.map((req) => {
                        const statusCfg = STATUS_CONFIG[req.status as FeatureStatus]
                        return (
                            <div
                                key={req.id}
                                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group/row"
                                onClick={() => onRequestClick(req.id)}
                            >
                                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusCfg?.dot || 'bg-gray-400')} />
                                <span className="text-sm truncate flex-1 group-hover/row:text-primary transition-colors">
                                    {req.title}
                                </span>
                                {req.vote_count > 0 && (
                                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                        {req.vote_count}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {hasMore && (
                    <button
                        onClick={onToggle}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 pt-2 border-t border-border/50 w-full transition-colors"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp className="h-3 w-3" />
                                Show less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-3 w-3" />
                                Show all {cluster.requestCount}
                            </>
                        )}
                    </button>
                )}
            </CardContent>
        </Card>
    )
}

export default function ClustersPage() {
    const { slug } = useParams<{ slug: string }>()
    const { workspace, isAdmin } = useWorkspace()
    const [k, setK] = useState<number>(0) // 0 = auto
    const [debouncedK, setDebouncedK] = useState<number>(0)
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
    const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set())

    // Debounce k changes
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedK(k), 300)
        return () => clearTimeout(timer)
    }, [k])

    const { data, isLoading, error } = useQuery<ClusterResponse>({
        queryKey: ['clusters', workspace?.id, debouncedK],
        enabled: !!workspace,
        staleTime: 30_000,
        queryFn: async () => {
            const body: Record<string, unknown> = { workspaceId: workspace!.id }
            if (debouncedK > 0) body.k = debouncedK

            const res = await fetch('/api/clusters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to compute clusters')
            }

            return res.json()
        },
    })

    const toggleCluster = (id: number) => {
        setExpandedClusters((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <div>
                    <h1 className="ws-page-heading">Clusters</h1>
                    <p className="ws-page-sub">auto-discovered themes from your requests</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
            </div>
        )
    }

    // Error / not enough embeddings
    if (error || !data) {
        const message = error instanceof Error ? error.message : 'Failed to compute clusters'
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <div>
                    <h1 className="ws-page-heading">Clusters</h1>
                    <p className="ws-page-sub">auto-discovered themes from your requests</p>
                </div>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <Network className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground text-sm max-w-md">
                        {message}
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-2">
                        Embeddings are generated when requests are created or via the backfill endpoint.
                    </p>
                </div>
            </div>
        )
    }

    const { clusters, meta } = data
    const showCoverageWarning = meta.embeddedCount < meta.totalRequests

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div>
                <h1 className="ws-page-heading">Clusters</h1>
                <p className="ws-page-sub">auto-discovered themes from your requests</p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-2.5">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">
                        Clusters:
                    </label>
                    <input
                        type="range"
                        min={2}
                        max={Math.min(10, meta.embeddedCount)}
                        value={k === 0 ? meta.k : k}
                        onChange={(e) => setK(Number(e.target.value))}
                        className="w-28 accent-primary"
                    />
                    <span className="text-sm font-medium tabular-nums w-5 text-center">
                        {k === 0 ? meta.k : k}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                        {meta.embeddedCount} embedded request{meta.embeddedCount !== 1 ? 's' : ''} clustered in {meta.iterations} iteration{meta.iterations !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Coverage warning */}
            {showCoverageWarning && (
                <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                        Only {meta.embeddedCount} of {meta.totalRequests} requests have embeddings.
                        Clusters are based only on embedded requests.
                    </span>
                </div>
            )}

            {/* Cluster grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clusters.map((cluster) => (
                    <ClusterCard
                        key={cluster.id}
                        cluster={cluster}
                        expanded={expandedClusters.has(cluster.id)}
                        onToggle={() => toggleCluster(cluster.id)}
                        onRequestClick={setSelectedRequestId}
                    />
                ))}
            </div>

            {/* Slide-over */}
            {workspace && (
                <RequestSlideOver
                    requestId={selectedRequestId}
                    workspaceId={workspace.id}
                    workspaceSlug={slug}
                    isAdmin={isAdmin}
                    onClose={() => setSelectedRequestId(null)}
                />
            )}
        </div>
    )
}
