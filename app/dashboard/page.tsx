'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Loader2, LogOut, ArrowRight, ArrowLeft, FolderOpen, BarChart3, Heart, Package, MessageSquare } from 'lucide-react'
import { WorkspaceAvatar } from '@/components/features/workspace/WorkspaceAvatar'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createUntypedClient } from '@/lib/supabase/untyped-client'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { generateSlug, formatDate } from '@/lib/utils/rice'
import { Workspace, Profile } from '@/types/database.types'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useGlassNav } from '@/hooks/useAnimations'
import { getInitials } from '@/lib/utils/shared'

export default function DashboardPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const supabase = createClient()
    const supabaseRaw = createUntypedClient()
    const [workspaceName, setWorkspaceName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [showCreateForm, setShowCreateForm] = useState(false)

    const navRef = useGlassNav()

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            return (data ?? null) as Profile | null
        },
    })

    const { data: workspaces, isLoading: workspacesLoading } = useQuery({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const { data } = await supabase
                .from('workspace_members')
                .select('workspace_id, workspaces(*)')
                .eq('user_id', user.id)
            return (data?.map((d) => (d as { workspaces: Workspace | null }).workspaces).filter(Boolean) || []) as Workspace[]
        },
    })

    const createWorkspace = async () => {
        if (!workspaceName.trim()) return
        setIsCreating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const slug = generateSlug(workspaceName)
            const { data: workspace, error: workspaceError } = await supabaseRaw
                .from('workspaces')
                .insert({ name: workspaceName.trim(), slug, owner_id: user.id })
                .select().single()
            if (workspaceError) throw workspaceError
            const { error: memberError } = await supabaseRaw
                .from('workspace_members')
                .insert({ workspace_id: workspace.id, user_id: user.id, role: 'admin' })
            if (memberError) throw memberError
            queryClient.invalidateQueries({ queryKey: ['workspaces'] })
            toast.success('Workspace created!')
            router.push(`/workspace/${slug}/backlog`)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to create workspace')
        } finally {
            setIsCreating(false)
        }
    }

    // Personal stats across all workspaces
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        enabled: !!workspaces && workspaces.length > 0,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null
            const wsIds = workspaces!.map((w) => w.id)

            // Total requests across workspaces
            const { count: totalRequests } = await supabase
                .from('feature_requests')
                .select('*', { count: 'exact', head: true })
                .in('workspace_id', wsIds)

            // Shipped this month
            const monthStart = new Date()
            monthStart.setDate(1)
            monthStart.setHours(0, 0, 0, 0)
            const { count: shippedThisMonth } = await supabase
                .from('feature_requests')
                .select('*', { count: 'exact', head: true })
                .in('workspace_id', wsIds)
                .eq('status', 'shipped')
                .gte('shipped_at', monthStart.toISOString())

            // My votes
            const { count: myVotes } = await supabase
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            // My comments
            const { count: myComments } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            return {
                totalRequests: totalRequests || 0,
                shippedThisMonth: shippedThisMonth || 0,
                myVotes: myVotes || 0,
                myComments: myComments || 0,
            }
        },
    })

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="dash-root">
            {/* Topbar */}
            <header className="dash-nav" ref={navRef}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href="/" className="dash-back-btn"><ArrowLeft size={16} /></Link>
                    <Link href="/" className="dash-logo">backlog</Link>
                </div>
                <div className="dash-nav-right">
                    <ThemeToggle className="dash-icon-btn" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="dash-avatar-btn">
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={profile?.avatar_url || ''} />
                                    <AvatarFallback className="text-xs">{getInitials(profile?.full_name || '')}</AvatarFallback>
                                </Avatar>
                                <span className="dash-avatar-name">{profile?.full_name}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <div className="px-2 py-1.5">
                                <p className="text-sm font-medium">{profile?.full_name}</p>
                                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                <LogOut className="h-4 w-4" /> sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <main className="dash-main">
                {/* Greeting */}
                <div className="dash-greeting">
                    {profileLoading
                        ? <Skeleton className="h-10 w-64" />
                        : <h1 className="dash-heading">
                            good to see you,{' '}
                            <em>{profile?.full_name?.split(' ')[0] || 'there'}</em>.
                        </h1>
                    }
                    <p className="dash-sub">your workspaces and feature backlogs</p>
                </div>

                {/* Stats widgets */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Total Requests', value: stats.totalRequests, icon: BarChart3, color: 'text-violet-500' },
                            { label: 'Shipped This Month', value: stats.shippedThisMonth, icon: Package, color: 'text-green-500' },
                            { label: 'Your Votes', value: stats.myVotes, icon: Heart, color: 'text-rose-500' },
                            { label: 'Your Comments', value: stats.myComments, icon: MessageSquare, color: 'text-blue-500' },
                        ].map((stat) => (
                            <div key={stat.label} className="dash-stat-card">
                                <div className="flex items-center gap-2 mb-1">
                                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</span>
                                </div>
                                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="dash-rule" />

                {/* Workspace list */}
                {workspacesLoading ? (
                    <div className="dash-grid">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
                    </div>
                ) : workspaces && workspaces.length > 0 ? (
                    <>
                        <div className="dash-section-header">
                            <p className="dash-section-label">workspaces</p>
                            <button
                                className="dash-new-btn"
                                onClick={() => setShowCreateForm(!showCreateForm)}
                            >
                                <Plus size={13} /> new workspace
                            </button>
                        </div>
                        <div className="dash-grid">
                            {workspaces.map((ws) => (
                                <Link key={ws.id} href={`/workspace/${ws.slug}/backlog`} className="dash-ws-card">
                                    <WorkspaceAvatar id={ws.id} size="sm" />
                                    <div className="dash-ws-body">
                                        <h3 className="dash-ws-name">{ws.name}</h3>
                                        <p className="dash-ws-date">created {formatDate(ws.created_at)}</p>
                                    </div>
                                    <ArrowRight size={15} className="dash-ws-arrow" />
                                </Link>
                            ))}
                        </div>
                    </>
                ) : !showCreateForm ? (
                    // Empty state
                    <div className="dash-empty">
                        <FolderOpen size={40} strokeWidth={1.2} className="dash-empty-icon" />
                        <h2 className="dash-empty-heading">create your first workspace</h2>
                        <p className="dash-empty-body">
                            workspaces hold your feature requests, team members, and roadmap.
                        </p>
                        <button className="lp-cta-primary" onClick={() => setShowCreateForm(true)}>
                            <Plus size={15} /> create workspace
                        </button>
                    </div>
                ) : null}

                {/* Create form */}
                {showCreateForm && (
                    <div className="dash-create-card">
                        <h2 className="dash-create-heading">new workspace</h2>
                        <div className="dash-create-field">
                            <Label htmlFor="ws-name" className="dash-field-label">name</Label>
                            <Input
                                id="ws-name"
                                placeholder="my product team"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
                                className="dash-input"
                                autoFocus
                            />
                            {workspaceName && (
                                <p className="dash-slug-preview">
                                    url: /workspace/{generateSlug(workspaceName)}
                                </p>
                            )}
                        </div>
                        <div className="dash-create-actions">
                            <button
                                className="lp-cta-primary"
                                onClick={createWorkspace}
                                disabled={isCreating || !workspaceName.trim()}
                            >
                                {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                create workspace
                            </button>
                            {workspaces && workspaces.length > 0 && (
                                <button className="dash-cancel-btn" onClick={() => setShowCreateForm(false)}>
                                    cancel
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
