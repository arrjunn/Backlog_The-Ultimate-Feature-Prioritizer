'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Loader2, LogOut, ArrowRight, Moon, Sun, FolderOpen } from 'lucide-react'
import { WorkspaceAvatar } from '@/components/features/workspace/WorkspaceAvatar'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createUntypedClient } from '@/lib/supabase/untyped-client'
import { Button } from '@/components/ui/button'
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
import { useTheme } from 'next-themes'

export default function DashboardPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const supabase = createClient()
    const supabaseRaw = createUntypedClient()
    const { theme, setTheme } = useTheme()
    const [workspaceName, setWorkspaceName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [showCreateForm, setShowCreateForm] = useState(false)

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            let { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                const { data: refreshed } = await supabase.auth.refreshSession()
                session = refreshed.session
            }
            if (!session?.user) throw new Error('Not authenticated')
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            return data as unknown as Profile
        },
    })

    const { data: workspaces, isLoading: workspacesLoading } = useQuery({
        queryKey: ['workspaces'],
        queryFn: async () => {
            let { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                const { data: refreshed } = await supabase.auth.refreshSession()
                session = refreshed.session
            }
            if (!session?.user) throw new Error('Not authenticated')
            const { data } = await supabase
                .from('workspace_members')
                .select('workspace_id, workspaces(*)')
                .eq('user_id', session.user.id)
            return (data?.map((d: { workspaces: Workspace | null }) => d.workspaces).filter(Boolean) || []) as Workspace[]
        },
    })

    const createWorkspace = async () => {
        if (!workspaceName.trim()) return
        setIsCreating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const slug = generateSlug(workspaceName)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        } catch (err: any) {
            toast.error(err.message || 'Failed to create workspace')
        } finally {
            setIsCreating(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const getInitials = (name: string | null) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <div className="dash-root">
            {/* Topbar */}
            <header className="dash-nav">
                <Link href="/" className="dash-logo">backlog</Link>
                <div className="dash-nav-right">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="dash-icon-btn"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
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
