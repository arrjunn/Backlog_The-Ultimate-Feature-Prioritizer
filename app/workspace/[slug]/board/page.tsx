'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    useDroppable,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Heart, Tag, GripVertical, Package, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { RequestModal } from '@/components/features/requests/RequestModal'
import { RequestSlideOver } from '@/components/features/requests/RequestSlideOver'
import { STATUS_CONFIG, FeatureStatus } from '@/lib/utils/rice'
import { FeatureRequest, Profile } from '@/types/database.types'
import { cn } from '@/lib/utils/cn'
import { useWorkspace } from '../WorkspaceLayoutClient'
import { useScrollReveal } from '@/hooks/useAnimations'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActiveFrameworkBadge } from '@/components/features/frameworks/scores/ActiveFrameworkBadge'

type RequestWithDetails = FeatureRequest & {
    profiles: Profile | null
    votes: { id: string; user_id: string }[]
}

function KanbanCard({
    request,
    currentUserId,
    activeFramework,
    onClick,
}: {
    request: RequestWithDetails
    currentUserId?: string
    activeFramework: string
    onClick: () => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: request.id,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const userVoted = request.votes?.some((v) => v.user_id === currentUserId)

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'bg-card rounded-xl border border-border p-3.5 group shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200',
                isDragging && 'opacity-30 ring-2 ring-primary'
            )}
        >
            <div className="flex items-start gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted cursor-grab active:cursor-grabbing shrink-0"
                >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <div className="flex-1 min-w-0" onClick={onClick}>
                    <p className="text-sm font-medium leading-tight mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors">
                        {request.title}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                        <ActiveFrameworkBadge request={request} activeFramework={activeFramework} />

                        <div className="flex items-center gap-2">
                            <span className={cn('flex items-center gap-1 text-xs', userVoted ? 'text-red-500' : 'text-muted-foreground')}>
                                <Heart className={cn('h-3 w-3', userVoted && 'fill-current')} />
                                {request.votes?.length || 0}
                            </span>
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={request.profiles?.avatar_url || ''} />
                                <AvatarFallback className="text-[8px]">
                                    {(request.profiles?.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    {request.tags && request.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {request.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-muted text-muted-foreground px-1.5 py-0.5 text-[10px]">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function KanbanColumn({
    title,
    status,
    requests,
    currentUserId,
    activeFramework,
    onCardClick,
    dotColor,
}: {
    title: string
    status: string
    requests: RequestWithDetails[]
    currentUserId?: string
    activeFramework: string
    onCardClick: (id: string) => void
    dotColor: string
}) {
    const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` })

    return (
        <div className={cn('flex flex-col gap-2 flex-1 min-w-[280px]', isOver && 'ring-2 ring-primary ring-inset rounded-xl')}>
            <div className="flex items-center gap-2 mb-1 px-1">
                <span className={cn('h-2 w-2 rounded-full shrink-0', dotColor)} />
                <h3 className="font-semibold text-sm">{title}</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {requests.length}
                </span>
            </div>

            <SortableContext items={requests.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <div
                    ref={setNodeRef}
                    className={cn(
                        'flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors',
                        isOver ? 'bg-primary/5' : 'bg-muted/30'
                    )}
                    data-status={status}
                    id={`column-${status}`}
                >
                    {requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-xs text-muted-foreground">Drop cards here</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <KanbanCard
                                key={req.id}
                                request={req}
                                currentUserId={currentUserId}
                                activeFramework={activeFramework}
                                onClick={() => onCardClick(req.id)}
                            />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    )
}

const BOARD_COLUMNS: { status: FeatureStatus; config: typeof STATUS_CONFIG[FeatureStatus] }[] = [
    { status: 'now', config: STATUS_CONFIG.now },
    { status: 'next', config: STATUS_CONFIG.next },
    { status: 'later', config: STATUS_CONFIG.later },
    { status: 'backlog', config: STATUS_CONFIG.backlog },
]

export default function BoardPage() {
    const { slug } = useParams<{ slug: string }>()
    const { workspace, profile, isAdmin, searchQuery, showNewRequestModal, setShowNewRequestModal, activeFramework } = useWorkspace()
    useScrollReveal()
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
    const [activeRequest, setActiveRequest] = useState<RequestWithDetails | null>(null)
    const [showShipped, setShowShipped] = useState(false)
    const supabase = createClient()
    const queryClient = useQueryClient()

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    const { data: requests, isLoading } = useQuery({
        queryKey: ['feature-requests', slug],
        enabled: !!workspace,
        queryFn: async () => {
            const { data } = await supabase
                .from('feature_requests')
                .select('*, profiles(*), votes(id, user_id)')
                .eq('workspace_id', workspace!.id)
                .order('rice_score', { ascending: false })
            return (data || []) as RequestWithDetails[]
        },
    })

    // Real-time updates
    useEffect(() => {
        if (!workspace) return
        const channel = supabase
            .channel(`board-${workspace.id}`)
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
    }, [workspace, supabase, queryClient, slug])

    const handleDragStart = (event: DragStartEvent) => {
        const req = requests?.find((r) => r.id === event.active.id)
        setActiveRequest(req || null)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveRequest(null)
        const { active, over } = event
        if (!over || !active) return

        // Find what column we dropped over
        const overId = String(over.id)
        let newStatus: FeatureStatus | null = null

        // Check if dropped on a column
        if (overId.startsWith('column-')) {
            newStatus = overId.replace('column-', '') as FeatureStatus
        } else {
            // Dropped on another card — find its column
            const targetCard = requests?.find((r) => r.id === overId)
            if (targetCard) newStatus = targetCard.status as FeatureStatus
        }

        const draggedCard = requests?.find((r) => r.id === active.id)
        if (!draggedCard || !newStatus || draggedCard.status === newStatus) return

        // Optimistic update
        queryClient.setQueryData(['feature-requests', slug], (old: RequestWithDetails[] | undefined) =>
            old?.map((r) => r.id === draggedCard.id ? { ...r, status: newStatus! } : r) || []
        )

        const { error } = await supabase
            .from('feature_requests')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update({ status: newStatus } as unknown as never)
            .eq('id', draggedCard.id)

        if (error) {
            toast.error('Failed to update status')
            queryClient.invalidateQueries({ queryKey: ['feature-requests', slug] })
        } else {
            toast.success(`Moved to ${STATUS_CONFIG[newStatus].label}`)
        }
    }

    const displayStatuses = showShipped ? ['shipped'] : ['now', 'next', 'later', 'backlog']
    const filteredRequests = requests
        ? requests.filter((r) => {
            if (!searchQuery) return true
            const q = searchQuery.toLowerCase()
            return r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
        })
        : []
    const groupedRequests = displayStatuses.reduce((acc, status) => {
        acc[status] = filteredRequests.filter((r) => r.status === status)
        return acc
    }, {} as Record<string, RequestWithDetails[]>)

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <div>
                    <h1 className="ws-page-heading">Board</h1>
                    <p className="ws-page-sub">drag and drop to change status</p>
                </div>
                <div className="ml-auto">
                    <Tabs value={showShipped ? 'shipped' : 'active'} onValueChange={(v) => setShowShipped(v === 'shipped')}>
                        <TabsList className="h-8">
                            <TabsTrigger value="active" className="text-xs px-3">Active</TabsTrigger>
                            <TabsTrigger value="shipped" className="text-xs px-3">
                                <Package className="h-3.5 w-3.5 mr-1" />
                                Shipped
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {isLoading ? (
                <div className="flex gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-1 min-w-[280px]">
                            <Skeleton className="h-6 w-24 mb-3 rounded-lg" />
                            <div className="space-y-2">
                                {[1, 2, 3].map((j) => <Skeleton key={j} className="h-24 rounded-xl" />)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
                        {displayStatuses.map((status) => {
                            const cfg = STATUS_CONFIG[status as FeatureStatus]
                            return (
                                <KanbanColumn
                                    key={status}
                                    title={cfg.label}
                                    status={status}
                                    requests={groupedRequests[status] || []}
                                    currentUserId={profile?.id}
                                    activeFramework={activeFramework || 'rice'}
                                    onCardClick={setSelectedRequestId}
                                    dotColor={cfg.dot}
                                />
                            )
                        })}
                    </div>

                    <DragOverlay>
                        {activeRequest && (
                            <div className="bg-card rounded-xl border-2 border-primary p-3.5 shadow-2xl rotate-2 opacity-90 w-72">
                                <p className="text-sm font-medium">{activeRequest.title}</p>
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Modals */}
            {workspace && (
                <>
                    <RequestModal
                        open={showNewRequestModal}
                        onClose={() => setShowNewRequestModal(false)}
                        workspaceId={workspace.id}
                        workspaceSlug={slug}
                    />
                    <RequestSlideOver
                        requestId={selectedRequestId}
                        workspaceId={workspace.id}
                        workspaceSlug={slug}
                        isAdmin={isAdmin}
                        onClose={() => setSelectedRequestId(null)}
                    />
                </>
            )}
        </div>
    )
}
