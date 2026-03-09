'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
    MessageSquare,
    Heart,
    Plus,
    ArrowRight,
    Package,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

interface ActivityItem {
    id: string
    type: 'request' | 'comment' | 'vote' | 'shipped'
    title: string
    actor: string
    timestamp: string
}

interface ActivityFeedProps {
    workspaceId: string
    className?: string
}

export function ActivityFeed({ workspaceId, className }: ActivityFeedProps) {
    const supabase = createClient()

    const { data: activity, isLoading } = useQuery({
        queryKey: ['activity-feed', workspaceId],
        enabled: !!workspaceId,
        refetchInterval: 30_000,
        queryFn: async () => {
            const items: ActivityItem[] = []

            // Recent requests
            const { data: requests } = await supabase
                .from('feature_requests')
                .select('id, title, created_at, status, shipped_at, profiles(full_name)')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false })
                .limit(15)

            requests?.forEach((r: any) => {
                items.push({
                    id: `req-${r.id}`,
                    type: 'request',
                    title: r.title,
                    actor: r.profiles?.full_name || 'Someone',
                    timestamp: r.created_at,
                })
                if (r.status === 'shipped' && r.shipped_at) {
                    items.push({
                        id: `ship-${r.id}`,
                        type: 'shipped',
                        title: r.title,
                        actor: '',
                        timestamp: r.shipped_at,
                    })
                }
            })

            // Recent comments
            const { data: comments } = await supabase
                .from('comments')
                .select('id, content, created_at, feature_request_id, profiles(full_name), feature_requests!inner(title, workspace_id)')
                .eq('feature_requests.workspace_id', workspaceId)
                .order('created_at', { ascending: false })
                .limit(10)

            comments?.forEach((c: any) => {
                items.push({
                    id: `cmt-${c.id}`,
                    type: 'comment',
                    title: c.feature_requests?.title || 'a request',
                    actor: c.profiles?.full_name || 'Someone',
                    timestamp: c.created_at,
                })
            })

            // Recent votes
            const { data: votes } = await supabase
                .from('votes')
                .select('id, created_at, profiles(full_name), feature_requests!inner(title, workspace_id)')
                .eq('feature_requests.workspace_id', workspaceId)
                .order('created_at', { ascending: false })
                .limit(10)

            votes?.forEach((v: any) => {
                items.push({
                    id: `vote-${v.id}`,
                    type: 'vote',
                    title: v.feature_requests?.title || 'a request',
                    actor: v.profiles?.full_name || 'Someone',
                    timestamp: v.created_at,
                })
            })

            // Sort by timestamp
            items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

            return items.slice(0, 20)
        },
    })

    const iconMap = {
        request: { icon: Plus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        comment: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        vote: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        shipped: { icon: Package, color: 'text-green-500', bg: 'bg-green-500/10' },
    }

    const labelMap = {
        request: (item: ActivityItem) => <><strong>{item.actor}</strong> created <strong>{item.title}</strong></>,
        comment: (item: ActivityItem) => <><strong>{item.actor}</strong> commented on <strong>{item.title}</strong></>,
        vote: (item: ActivityItem) => <><strong>{item.actor}</strong> voted for <strong>{item.title}</strong></>,
        shipped: (item: ActivityItem) => <><strong>{item.title}</strong> was shipped</>,
    }

    if (isLoading) {
        return (
            <div className={cn('space-y-3', className)}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="h-7 w-7 rounded-lg bg-muted shrink-0" />
                        <div className="flex-1 space-y-1">
                            <div className="h-3 bg-muted rounded w-3/4" />
                            <div className="h-2.5 bg-muted rounded w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!activity || activity.length === 0) {
        return (
            <div className={cn('text-center py-8 text-sm text-muted-foreground', className)}>
                No activity yet
            </div>
        )
    }

    return (
        <div className={cn('space-y-1', className)}>
            {activity.map((item) => {
                const config = iconMap[item.type]
                const Icon = config.icon
                return (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', config.bg)}>
                            <Icon className={cn('h-3.5 w-3.5', config.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs leading-relaxed line-clamp-2 [&>strong]:font-medium">
                                {labelMap[item.type](item)}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
