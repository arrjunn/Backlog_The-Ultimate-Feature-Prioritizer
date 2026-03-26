'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import {
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    Heart,
    ListFilter,
    Inbox,
    Download,
    Tag,
    X,
    Search,
    Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RequestModal } from '@/components/features/requests/RequestModal'
import { RequestSlideOver } from '@/components/features/requests/RequestSlideOver'
import { STATUS_CONFIG, FeatureStatus, formatRelativeDate } from '@/lib/utils/rice'
import { FeatureRequest, Profile } from '@/types/database.types'
import { cn } from '@/lib/utils/cn'
import { getInitials } from '@/lib/utils/shared'
import { useWorkspace } from '../WorkspaceLayoutClient'

type SortOption = 'active_score' | 'vote_count' | 'created_at'
type SortDir = 'asc' | 'desc'

function getFrameworkScoreValue(request: Partial<FeatureRequest>, frameworkId: string): number | null {
    switch (frameworkId) {
        case 'rice': return request.rice_score ?? null
        case 'ice': return request.ice_score ?? null
        case 'moscow':
            if (request.moscow_category === 'must_have') return 4
            if (request.moscow_category === 'should_have') return 3
            if (request.moscow_category === 'could_have') return 2
            if (request.moscow_category === 'wont_have') return 1
            return null
        case 'jtbd': return request.jtbd_opportunity_score ?? null
        case 'kano':
            if (request.kano_category === 'must_be') return 5
            if (request.kano_category === 'one_dimensional') return 4
            if (request.kano_category === 'attractive') return 3
            if (request.kano_category === 'indifferent') return 2
            if (request.kano_category === 'reverse') return 1
            if (request.kano_category === 'questionable') return 0
            return null
        case 'impact_effort':
            if (request.ie_quadrant === 'quick_win') return 4
            if (request.ie_quadrant === 'major_project') return 3
            if (request.ie_quadrant === 'fill_in') return 2
            if (request.ie_quadrant === 'thankless_task') return 1
            return null
        case 'wsjf': return request.wsjf_score ?? null
        default: return request.rice_score ?? null
    }
}

export default function BacklogPage() {
    const { slug } = useParams<{ slug: string }>()
    const { workspace, profile, isAdmin, searchQuery, showNewRequestModal, setShowNewRequestModal, activeFramework } = useWorkspace()
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>('active_score')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [filterTags, setFilterTags] = useState<string[]>([])

    // semantic search state
    const [semanticQuery, setSemanticQuery] = useState('')
    const [semanticResults, setSemanticResults] = useState<any[]>([])
    const [semanticLoading, setSemanticLoading] = useState(false)
    const semanticTimeout = useRef<NodeJS.Timeout | null>(null)

    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: requests, isLoading } = useQuery({
        queryKey: ['feature-requests', slug],
        enabled: !!workspace,
        queryFn: async () => {
            const { data } = await supabase
                .from('feature_requests')
                .select('*, profiles(*), votes(id, user_id)')
                .eq('workspace_id', workspace!.id)
                .order('created_at', { ascending: false })
            return (data || []) as (FeatureRequest & { profiles: Profile | null; votes: { id: string; user_id: string }[] })[]
        },
    })

    // semantic search with debounce
    useEffect(() => {
        if (!semanticQuery.trim() || !workspace) {
            setSemanticResults([])
            return
        }
        if (semanticTimeout.current) clearTimeout(semanticTimeout.current)
        semanticTimeout.current = setTimeout(async () => {
            setSemanticLoading(true)
            try {
                const res = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: semanticQuery, workspaceId: workspace.id })
                })
                const data = await res.json()
                setSemanticResults(data.results || [])
            } catch {
                setSemanticResults([])
            } finally {
                setSemanticLoading(false)
            }
        }, 600)
    }, [semanticQuery, workspace])

    // Real-time subscription
    useEffect(() => {
        if (!workspace) return
        const channel = supabase
            .channel(`requests-${workspace.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'feature_requests',
                filter: `workspace_id=eq.${workspace.id}`,
            }, () => {
                queryClient.invalidateQueries({ queryKey: ['feature-requests', slug] })
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspace?.id, slug])

    const currentUserId = profile?.id

    const allTags = useMemo(() => {
        if (!requests) return []
        const set = new Set<string>()
        requests.forEach(r => (r.tags || []).forEach((t: string) => set.add(t)))
        return Array.from(set).sort()
    }, [requests])

    const filteredAndSorted = useMemo(() => requests
        ? requests
            .filter((r) => {
                if (filterStatus !== 'all' && r.status !== filterStatus) return false
                if (searchQuery) {
                    const q = searchQuery.toLowerCase()
                    return r.title.toLowerCase().includes(q) || (r.description?.toLowerCase().includes(q) ?? false)
                }
                if (filterTags.length > 0) {
                    const reqTags = r.tags || []
                    if (!filterTags.every(t => reqTags.includes(t))) return false
                }
                if (activeFramework) {
                    const score = getFrameworkScoreValue(r, activeFramework)
                    if (score === null || score === undefined) return false
                }
                return true
            })
            .sort((a, b) => {
                let aVal: number, bVal: number
                if (sortBy === 'active_score') {
                    const aScore = getFrameworkScoreValue(a, activeFramework || 'rice')
                    const bScore = getFrameworkScoreValue(b, activeFramework || 'rice')
                    if (aScore === null && bScore === null) return 0
                    if (aScore === null) return 1
                    if (bScore === null) return -1
                    aVal = aScore
                    bVal = bScore
                } else if (sortBy === 'vote_count') {
                    aVal = a.votes?.length || 0
                    bVal = b.votes?.length || 0
                } else {
                    aVal = new Date(a.created_at).getTime()
                    bVal = new Date(b.created_at).getTime()
                }
                return sortDir === 'desc' ? bVal - aVal : aVal - bVal
            })
        : [], [requests, filterStatus, searchQuery, filterTags, activeFramework, sortBy, sortDir])

    const toggleSort = (col: SortOption) => {
        if (sortBy === col) {
            setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
        } else {
            setSortBy(col)
            setSortDir('desc')
        }
    }

    const exportCSV = () => {
        const rows = filteredAndSorted.map(r => ({
            Title: r.title,
            Status: r.status,
            Tags: (r.tags || []).join('; '),
            Votes: r.votes?.length ?? 0,
            'RICE Score': r.rice_score ?? '',
            'ICE Score': r.ice_score ?? '',
            'MoSCoW': r.moscow_category ?? '',
            'JTBD Score': r.jtbd_opportunity_score ?? '',
            'Kano Category': r.kano_category ?? '',
            'IE Quadrant': r.ie_quadrant ?? '',
            'WSJF Score': r.wsjf_score ?? '',
            'Submitted By': r.profiles?.full_name ?? '',
            'Created At': new Date(r.created_at).toLocaleDateString(),
        }))
        const headers = Object.keys(rows[0] || {})
        const csv = [
            headers.join(','),
            ...rows.map(row => headers.map(h => `"${String((row as any)[h]).replace(/"/g, '""')}"`).join(','))
        ].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backlog-${slug}-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    const isSemanticMode = semanticQuery.trim().length > 0
    const displayRows = isSemanticMode ? semanticResults : filteredAndSorted

    return (
        <div className="p-4 sm:p-6 h-full">
            {/* Header + filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div>
                    <h1 className="ws-page-heading">Backlog</h1>
                    <p className="ws-page-sub">
                        {filteredAndSorted.length} request{filteredAndSorted.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36 h-8 text-sm">
                        <ListFilter className="h-3.5 w-3.5 mr-1.5" />
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <button
                    onClick={exportCSV}
                    disabled={filteredAndSorted.length === 0}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Export visible rows to CSV"
                >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                </button>
            </div>

            {/* Semantic search bar */}
            <div className="relative mb-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 focus-within:border-primary/50 transition-colors">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <input
                        type="text"
                        placeholder="Semantic search — find requests by meaning, not just keywords..."
                        value={semanticQuery}
                        onChange={e => setSemanticQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {semanticLoading && (
                        <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    {semanticQuery && !semanticLoading && (
                        <button onClick={() => { setSemanticQuery(''); setSemanticResults([]) }}>
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>
                {isSemanticMode && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 ml-1">
                        {semanticLoading ? 'Searching...' : `${semanticResults.length} semantically similar result${semanticResults.length !== 1 ? 's' : ''}`}
                    </p>
                )}
            </div>

            {/* Tag filter chips */}
            {allTags.length > 0 && !isSemanticMode && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {allTags.map(tag => {
                        const active = filterTags.includes(tag)
                        return (
                            <button
                                key={tag}
                                onClick={() => setFilterTags(prev =>
                                    active ? prev.filter(t => t !== tag) : [...prev, tag]
                                )}
                                className={cn(
                                    'px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all',
                                    active
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-transparent text-muted-foreground border-border hover:border-primary/60 hover:text-foreground'
                                )}
                            >
                                {tag}
                            </button>
                        )
                    })}
                    {filterTags.length > 0 && (
                        <button
                            onClick={() => setFilterTags([])}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3 w-3" /> clear
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[280px]">
                                    Title
                                </th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                    Status
                                </th>
                                {isSemanticMode && (
                                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                        Similarity
                                    </th>
                                )}
                                {!isSemanticMode && (
                                    <th
                                        className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                                        onClick={() => toggleSort('vote_count')}
                                    >
                                        <span className="flex items-center gap-1">
                                            Votes
                                            {sortBy === 'vote_count' ? (
                                                sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                                            )}
                                        </span>
                                    </th>
                                )}
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Submitted By
                                </th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tags</th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Frameworks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border/50">
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-7 w-7 rounded-full" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                    </tr>
                                ))
                            ) : displayRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <Inbox className="h-12 w-12 opacity-30" />
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {isSemanticMode ? 'No similar requests found' : 'No feature requests yet'}
                                                </p>
                                                <p className="text-sm mt-1">
                                                    {isSemanticMode ? 'Try a different search term' : searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Click "+ New Request" to add your first one'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : isSemanticMode ? (
                                // semantic results rows
                                semanticResults.map((result) => {
                                    const status = result.status as FeatureStatus
                                    const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['backlog']
                                    const similarityPct = Math.round((result.similarity || 0) * 100)

                                    return (
                                        <tr
                                            key={result.id}
                                            className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors duration-150"
                                            onClick={() => setSelectedRequestId(result.id)}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-medium line-clamp-1">{result.title}</span>
                                                {result.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{result.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', statusCfg.color)}>
                                                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusCfg.dot)} />
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-primary"
                                                            style={{ width: `${similarityPct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{similarityPct}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarFallback className="text-xs">?</AvatarFallback>
                                                </Avatar>
                                            </td>
                                            <td className="px-4 py-3" />
                                            <td className="px-4 py-3" />
                                        </tr>
                                    )
                                })
                            ) : (
                                filteredAndSorted.map((req) => {
                                    const status = req.status as FeatureStatus
                                    const statusCfg = STATUS_CONFIG[status]
                                    const userVoted = req.votes?.some((v) => v.user_id === currentUserId)

                                    return (
                                        <tr
                                            key={req.id}
                                            className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors duration-150"
                                            onClick={() => setSelectedRequestId(req.id)}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-medium line-clamp-1">{req.title}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', statusCfg.color)}>
                                                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusCfg.dot)} />
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn('flex items-center gap-1 text-sm', userVoted ? 'text-red-500' : 'text-muted-foreground')}>
                                                    <Heart className={cn('h-3.5 w-3.5', userVoted && 'fill-current')} />
                                                    {req.votes?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarImage src={req.profiles?.avatar_url || ''} />
                                                    <AvatarFallback className="text-xs">{getInitials(req.profiles?.full_name || '')}</AvatarFallback>
                                                </Avatar>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1 flex-wrap">
                                                    {req.tags?.slice(0, 2).map((tag) => (
                                                        <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {req.tags && req.tags.length > 2 && (
                                                        <span className="text-[11px] text-muted-foreground" title={req.tags.slice(2).join(', ')}>+{req.tags.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {req.rice_score != null && (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">RICE {req.rice_score.toFixed(0)}</span>
                                                    )}
                                                    {req.ice_score != null && (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">ICE {req.ice_score.toFixed(0)}</span>
                                                    )}
                                                    {req.moscow_category != null && (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400">MoSCoW</span>
                                                    )}
                                                    {req.jtbd_opportunity_score != null && (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400">JTBD {req.jtbd_opportunity_score.toFixed(0)}</span>
                                                    )}
                                                    {req.kano_category != null && (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-pink-500/10 text-pink-600 dark:text-pink-400">Kano</span>
                                                    )}
                                                    {req.ie_quadrant != null && (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400">I/E</span>
                                                    )}
                                                    {req.wsjf_score != null && (
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">WSJF {req.wsjf_score.toFixed(1)}</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {workspace && (
                <RequestModal
                    open={showNewRequestModal}
                    onClose={() => setShowNewRequestModal(false)}
                    workspaceId={workspace.id}
                    workspaceSlug={slug}
                />
            )}

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