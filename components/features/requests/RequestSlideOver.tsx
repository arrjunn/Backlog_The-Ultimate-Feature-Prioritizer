'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    X,
    Heart,
    Send,
    Tag,
    Clock,
    User,
    Loader2,
    ChevronDown,
    Sparkles,
    CheckCircle2,
    Eye,
    ExternalLink,
    Share2,
    Trash2,
    Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { createUntypedClient } from '@/lib/supabase/untyped-client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    getRiceScoreBadgeClass,
    STATUS_CONFIG,
    FeatureStatus,
    formatRelativeDate,
} from '@/lib/utils/rice'
import { FeatureRequest, Profile, Comment, Vote } from '@/types/database.types'
import { cn } from '@/lib/utils/cn'
import { getInitials } from '@/lib/utils/shared'
import { FrameworkScoreTabs } from '@/components/features/frameworks/FrameworkScoreTabs'
import { useWorkspace } from '@/app/workspace/[slug]/WorkspaceLayoutClient'
import { loadConfig } from '@/components/features/integrations/IntegrationsCard'
import confetti from 'canvas-confetti'

interface RequestSlideOverProps {
    requestId: string | null
    workspaceId: string
    workspaceSlug: string
    isAdmin: boolean
    onClose: () => void
}

export function RequestSlideOver({
    requestId,
    workspaceId,
    workspaceSlug,
    isAdmin,
    onClose,
}: RequestSlideOverProps) {
    const [comment, setComment] = useState('')
    const [isPostingComment, setIsPostingComment] = useState(false)
    const [isVoting, setIsVoting] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiSuggestion, setAiSuggestion] = useState<Record<string, string | number> | null>(null)
    const [aiApplied, setAiApplied] = useState(false)
    const [pushOpen, setPushOpen] = useState(false)
    const [pushing, setPushing] = useState<string | null>(null)
    const [pushResults, setPushResults] = useState<Record<string, string>>({})
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [pendingShippedConfirm, setPendingShippedConfirm] = useState(false)
    const commentsEndRef = useRef<HTMLDivElement>(null)
    const pushRef = useRef<HTMLDivElement>(null)
    const { isViewer, workspace } = useWorkspace()
    const supabase = createClient()
    const supabaseRaw = createUntypedClient()
    const queryClient = useQueryClient()

    const { data: currentUser } = useQuery({
        queryKey: ['current-user'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        },
    })

    const { data: request, isLoading } = useQuery({
        queryKey: ['feature-request', requestId],
        enabled: !!requestId,
        queryFn: async () => {
            const { data } = await supabase
                .from('feature_requests')
                .select('*, profiles(*)')
                .eq('id', requestId!)
                .single()
            return data as unknown as FeatureRequest & { profiles: Profile | null }
        },
    })

    const { data: votes } = useQuery({
        queryKey: ['votes', requestId],
        enabled: !!requestId,
        queryFn: async () => {
            const { data } = await supabase
                .from('votes')
                .select('*')
                .eq('feature_request_id', requestId!)
            return (data || []) as Vote[]
        },
    })

    const { data: comments, refetch: refetchComments } = useQuery({
        queryKey: ['comments', requestId],
        enabled: !!requestId,
        queryFn: async () => {
            const { data } = await supabase
                .from('comments')
                .select('*, profiles(*)')
                .eq('feature_request_id', requestId!)
                .order('created_at', { ascending: true })
            return (data || []) as (Comment & { profiles: Profile | null })[]
        },
    })

    // Real-time comments subscription
    useEffect(() => {
        if (!requestId) return
        const channel = supabase
            .channel(`comments-${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `feature_request_id=eq.${requestId}`,
                },
                () => {
                    refetchComments()
                }
            )
            .subscribe()
        return () => { supabase.removeChannel(channel) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId])

    // Real-time votes
    useEffect(() => {
        if (!requestId) return
        const channel = supabase
            .channel(`votes-${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'votes',
                    filter: `feature_request_id=eq.${requestId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['votes', requestId] })
                }
            )
            .subscribe()
        return () => { supabase.removeChannel(channel) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId])

    const userVote = votes?.find((v) => v.user_id === currentUser?.id)
    const voteCount = votes?.length || 0

    const handleVote = async () => {
        if (!currentUser || !requestId || isVoting) return
        setIsVoting(true)

        try {
            if (userVote) {
                await supabase.from('votes').delete().eq('id', userVote.id)
                toast.success('Vote removed')
            } else {
                await supabaseRaw.from('votes').insert({
                    feature_request_id: requestId,
                    user_id: currentUser.id,
                })
                toast.success('Voted!')
            }
            queryClient.invalidateQueries({ queryKey: ['votes', requestId] })
            queryClient.invalidateQueries({ queryKey: ['feature-requests', workspaceSlug] })
        } catch (err) {
            toast.error('Failed to vote')
        } finally {
            setIsVoting(false)
        }
    }

    const handleDelete = async () => {
        if (!requestId || !currentUser || isDeleting) return
        setIsDeleting(true)
        try {
            const { error } = await supabaseRaw.from('feature_requests').delete().eq('id', requestId)
            if (error) throw error
            queryClient.invalidateQueries({ queryKey: ['feature-requests', workspaceSlug] })
            queryClient.invalidateQueries({ queryKey: ['feature-request', requestId] })
            toast.success('Request deleted')
            onClose()
        } catch {
            toast.error('Failed to delete request')
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!requestId) return
        if (newStatus === 'shipped' && !pendingShippedConfirm) {
            setPendingShippedConfirm(true)
            return
        }
        setPendingShippedConfirm(false)
        const oldStatus = request?.status ?? ''
        const { error } = await supabaseRaw
            .from('feature_requests')
            .update({ status: newStatus })
            .eq('id', requestId)

        if (error) {
            toast.error('Failed to update status')
            return
        }

        toast.success(`Status changed to ${STATUS_CONFIG[newStatus as FeatureStatus]?.label}`)
        queryClient.invalidateQueries({ queryKey: ['feature-request', requestId] })
        queryClient.invalidateQueries({ queryKey: ['feature-requests', workspaceSlug] })

        // Celebrate shipped features with confetti
        if (newStatus === 'shipped') {
            const end = Date.now() + 600
            const frame = () => {
                confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } })
                confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } })
                if (Date.now() < end) requestAnimationFrame(frame)
            }
            frame()
        }

            // Fire-and-forget email notification to the requester
            ; (async () => {
                try {
                    const { data: req } = await supabase
                        .from('feature_requests')
                        .select('title, profiles(full_name, email)')
                        .eq('id', requestId)
                        .single()
                    const profile = (req as any)?.profiles
                    if (!profile?.email) return
                    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
                    await fetch('/api/notify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'status_change',
                            requesterEmail: profile.email,
                            requesterName: profile.full_name ?? 'there',
                            requestTitle: (req as any)?.title ?? '',
                            oldStatus,
                            newStatus,
                            workspaceName: workspace?.name ?? workspaceSlug,
                            requestUrl: `${siteUrl}/workspace/${workspaceSlug}/backlog`,
                        }),
                    })
                } catch { /* silent */ }
            })()
    }

    const handlePostComment = async () => {
        if (!comment.trim() || !currentUser || !requestId || isPostingComment) return
        const commentContent = comment.trim()
        setIsPostingComment(true)

        const { error } = await supabaseRaw.from('comments').insert({
            feature_request_id: requestId,
            user_id: currentUser.id,
            content: commentContent,
        })

        setIsPostingComment(false)
        if (error) {
            toast.error('Failed to post comment')
            return
        }

        setComment('')
        refetchComments()
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

            // Fire-and-forget email to the request submitter (if it's not themselves commenting)
            ; (async () => {
                try {
                    const { data: req } = await supabase
                        .from('feature_requests')
                        .select('title, user_id, profiles(full_name, email)')
                        .eq('id', requestId)
                        .single()
                    const profile = (req as any)?.profiles
                    if (!profile?.email || (req as any)?.user_id === currentUser.id) return
                    const commenterProfile = await supabase.from('profiles').select('full_name').eq('id', currentUser.id).single()
                    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
                    await fetch('/api/notify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'new_comment',
                            requesterEmail: profile.email,
                            requesterName: profile.full_name ?? 'there',
                            requestTitle: (req as any)?.title ?? '',
                            commenterName: (commenterProfile.data as any)?.full_name ?? 'Someone',
                            commentText: commentContent,
                            workspaceName: workspace?.name ?? workspaceSlug,
                            requestUrl: `${siteUrl}/workspace/${workspaceSlug}/backlog`,
                        }),
                    })
                } catch { /* silent */ }
            })()
    }

    const handlePushTo = async (provider: 'notion' | 'linear' | 'jira') => {
        if (!request || !workspace) return
        const config = loadConfig(workspace.id)
        const providerConfig = config[provider]

        setPushing(provider)
        setPushOpen(false)
        try {
            const cfg = config[provider] as any
            const body: Record<string, unknown> = { request }
            if (provider === 'notion') {
                Object.assign(body, { apiKey: cfg.apiKey, databaseId: cfg.databaseId })
            } else if (provider === 'linear') {
                Object.assign(body, { apiKey: cfg.apiKey, teamId: cfg.teamId })
            } else {
                Object.assign(body, {
                    jiraUrl: cfg.jiraUrl,
                    email: cfg.email,
                    apiToken: cfg.apiToken,
                    projectKey: cfg.projectKey,
                })
            }

            const res = await fetch(`/api/integrations/${provider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setPushResults(prev => ({ ...prev, [provider]: data.url }))
            toast.success(
                <span className="flex items-center gap-2">
                    Pushed to {provider.charAt(0).toUpperCase() + provider.slice(1)}!
                    <a href={data.url} target="_blank" rel="noopener noreferrer" className="underline text-primary">View →</a>
                </span>
            )
        } catch (e: unknown) {
            toast.error(`Push to ${provider} failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
        } finally {
            setPushing(null)
        }
    }

    // Close push dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (pushRef.current && !pushRef.current.contains(e.target as Node)) {
                setPushOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    // Escape key closes slide-over (dismiss delete confirm first)
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && requestId) {
                if (showDeleteConfirm) { setShowDeleteConfirm(false); return }
                if (pendingShippedConfirm) { setPendingShippedConfirm(false); return }
                onClose()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [requestId, onClose, showDeleteConfirm, pendingShippedConfirm])

    const canDelete = request && currentUser && !isViewer && (
        isAdmin || request.submitted_by === currentUser.id
    )

    const status = request?.status as FeatureStatus
    const statusConfig = status ? STATUS_CONFIG[status] : null

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300',
                    requestId ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div
                className={cn(
                    'fixed right-0 top-0 h-full w-full max-w-xl bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300',
                    requestId ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-border shrink-0 gap-3">
                    <div className="flex-1 min-w-0">
                        {isLoading ? (
                            <Skeleton className="h-6 w-3/4" />
                        ) : (
                            <h2 className="text-lg font-semibold leading-tight truncate">{request?.title}</h2>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Push-to dropdown */}
                        {!isViewer && request && workspace && (() => {
                            const cfg = loadConfig(workspace.id)
                            const available = (
                                [
                                    { id: 'notion', label: 'Notion', emoji: '📄', check: () => cfg.notion.apiKey && cfg.notion.databaseId },
                                    { id: 'linear', label: 'Linear', emoji: '⚡', check: () => cfg.linear.apiKey && cfg.linear.teamId },
                                    { id: 'jira', label: 'Jira', emoji: '🔵', check: () => cfg.jira.jiraUrl && cfg.jira.email && cfg.jira.apiToken && cfg.jira.projectKey },
                                ] as const
                            ).filter(p => p.check())

                            if (available.length === 0) return null

                            return (
                                <div className="relative" ref={pushRef}>
                                    <button
                                        onClick={() => setPushOpen(o => !o)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-all"
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                        Push to
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    </button>

                                    {pushOpen && (
                                        <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50">
                                            {available.map(platform => (
                                                <button
                                                    key={platform.id}
                                                    onClick={() => handlePushTo(platform.id)}
                                                    disabled={pushing === platform.id}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
                                                >
                                                    {pushing === platform.id
                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        : pushResults[platform.id]
                                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                            : <span>{platform.emoji}</span>
                                                    }
                                                    {platform.label}
                                                    {pushResults[platform.id] && (
                                                        <a
                                                            href={pushResults[platform.id]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            className="ml-auto text-primary"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })()}

                        {/* Copy link */}
                        {requestId && (
                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/workspace/${workspaceSlug}/backlog?request=${requestId}`
                                    navigator.clipboard.writeText(url)
                                    toast.success('Link copied to clipboard')
                                }}
                                className="p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0"
                                title="Copy link to request"
                            >
                                <Link2 className="h-4 w-4" />
                            </button>
                        )}

                        {/* Delete */}
                        {canDelete && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                title="Delete request"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Delete confirmation bar */}
                {showDeleteConfirm && (
                    <div className="flex items-center justify-between gap-3 px-5 py-3 bg-destructive/10 border-b border-destructive/20 shrink-0">
                        <p className="text-sm text-destructive font-medium">
                            Delete this request? This cannot be undone.
                        </p>
                        <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                                Cancel
                            </Button>
                            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                                Delete
                            </Button>
                        </div>
                    </div>
                )}

                {/* Shipped confirmation bar */}
                {pendingShippedConfirm && (
                    <div className="flex items-center justify-between gap-3 px-5 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 shrink-0">
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                            Mark as Shipped? This will notify the requester.
                        </p>
                        <div className="flex gap-2 shrink-0">
                            <button onClick={() => setPendingShippedConfirm(false)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">
                                Cancel
                            </button>
                            <button onClick={() => handleStatusChange('shipped')} className="text-xs font-semibold text-green-700 dark:text-green-300 hover:underline px-2 py-1">
                                Confirm Ship
                            </button>
                        </div>
                    </div>
                )}

                <ScrollArea className="flex-1">
                    <div className="p-5 space-y-6">
                        {/* Viewer-only banner */}
                        {isViewer && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground">
                                <Eye className="h-3.5 w-3.5 shrink-0" />
                                You have view-only access to this workspace
                            </div>
                        )}
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        ) : request ? (
                            <>
                                {/* Status + Vote row */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    {isAdmin ? (
                                        <Select value={request.status} onValueChange={handleStatusChange}>
                                            <SelectTrigger className="w-auto h-8 text-xs font-semibold border-0 shadow-none bg-transparent p-0 hover:bg-transparent focus:ring-0">
                                                <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5', statusConfig?.color)}>
                                                    <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig?.dot)} />
                                                    {statusConfig?.label}
                                                    <ChevronDown className="h-3 w-3 ml-0.5" />
                                                </span>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                    <SelectItem key={key} value={key}>
                                                        <span className="flex items-center gap-2">
                                                            <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                                                            {cfg.label}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5', statusConfig?.color)}>
                                            <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig?.dot)} />
                                            {statusConfig?.label}
                                        </span>
                                    )}

                                    {/* Vote button */}
                                    <button
                                        onClick={handleVote}
                                        disabled={isVoting || isViewer}
                                        title={isViewer ? 'Viewers cannot vote' : undefined}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                                            isViewer && 'opacity-40 cursor-not-allowed',
                                            userVote
                                                ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                                : 'border-border text-muted-foreground hover:border-red-300 hover:text-red-500'
                                        )}
                                    >
                                        {isVoting ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Heart className={cn('h-3.5 w-3.5', userVote && 'fill-current')} />
                                        )}
                                        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                                    </button>

                                    {/* RICE Score */}
                                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', getRiceScoreBadgeClass(request.rice_score || 0))}>
                                        RICE: {(request.rice_score || 0).toFixed(2)}
                                    </span>
                                </div>

                                {/* Description */}
                                {request.description && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Description</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {request.description}
                                        </p>
                                    </div>
                                )}

                                {/* Framework Scores */}
                                <div className="rounded-xl bg-muted/30 border border-border p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Framework Scores</p>
                                        <button
                                            onClick={async () => {
                                                if (!request) return
                                                setAiLoading(true)
                                                setAiSuggestion(null)
                                                setAiApplied(false)
                                                try {
                                                    const res = await fetch('/api/ai-suggest', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            title: request.title,
                                                            description: request.description,
                                                            framework: 'rice',
                                                        }),
                                                    })
                                                    const data = await res.json()
                                                    if (data.error) throw new Error(data.error)
                                                    setAiSuggestion(data.suggestion)
                                                } catch (e: unknown) {
                                                    toast.error(`AI suggest failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
                                                } finally {
                                                    setAiLoading(false)
                                                }
                                            }}
                                            disabled={aiLoading || !request}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed border-primary/50 text-primary hover:bg-primary/10 disabled:opacity-50 transition-all"
                                        >
                                            {aiLoading
                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                : <Sparkles className="h-3 w-3" />
                                            }
                                            {aiLoading ? 'Thinking…' : '✨ AI Suggest'}
                                        </button>
                                    </div>

                                    {/* AI Suggestion Card */}
                                    {aiSuggestion && (
                                        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                <span className="text-xs font-semibold text-primary">AI Suggestion · RICE</span>
                                                {aiApplied && (
                                                    <span className="ml-auto flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                                        <CheckCircle2 className="h-3 w-3" /> Applied
                                                    </span>
                                                )}
                                            </div>

                                            {/* Score values */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.entries(aiSuggestion)
                                                    .filter(([k]) => k !== 'reasoning')
                                                    .map(([key, val]) => (
                                                        <div key={key} className="bg-card rounded-lg p-2 text-center">
                                                            <div className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
                                                            <div className="text-sm font-bold mt-0.5">{String(val ?? '')}</div>
                                                        </div>
                                                    ))
                                                }
                                            </div>

                                            {/* Reasoning */}
                                            {aiSuggestion.reasoning && (
                                                <p className="text-[11px] text-muted-foreground leading-relaxed bg-card rounded-lg px-3 py-2">
                                                    {String(aiSuggestion.reasoning)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <FrameworkScoreTabs request={request} workspaceSlug={workspaceSlug} />
                                </div>

                                {/* Tags */}
                                {request.tags && request.tags.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Tags</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {request.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
                                                >
                                                    <Tag className="h-2.5 w-2.5" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5" />
                                        {(request as any).profiles?.full_name || 'Unknown'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatRelativeDate(request.created_at)}
                                    </span>
                                </div>

                                <Separator />

                                {/* Comments */}
                                <div>
                                    <p className="text-sm font-semibold mb-4">
                                        Comments ({comments?.length || 0})
                                    </p>

                                    {comments && comments.length > 0 ? (
                                        <div className="space-y-4 mb-4">
                                            {comments.map((c) => (
                                                <div key={c.id} className="flex gap-3">
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarImage src={(c as any).profiles?.avatar_url || ''} />
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials((c as any).profiles?.full_name || '')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium">{(c as any).profiles?.full_name}</span>
                                                            <span className="text-xs text-muted-foreground">{formatRelativeDate(c.created_at)}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">{c.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={commentsEndRef} />
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-muted-foreground">
                                            <p className="text-sm">No comments yet. Be the first!</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                </ScrollArea>

                {/* Comment input - sticky bottom */}
                <div className="p-4 border-t border-border shrink-0 bg-card">
                    <div className="flex gap-2">
                        <Textarea
                            placeholder={isViewer ? 'View-only — comments disabled' : 'Write a comment...'}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[60px] max-h-[120px] text-sm flex-1 resize-none"
                            disabled={isViewer}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    handlePostComment()
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            onClick={handlePostComment}
                            disabled={!comment.trim() || isViewer || isPostingComment}
                            className="shrink-0 self-end"
                            aria-label="Post comment"
                        >
                            {isPostingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                    {!isViewer && <p className="text-xs text-muted-foreground mt-1">Press Ctrl+Enter to submit</p>}
                </div>
            </div>
        </>
    )
}
