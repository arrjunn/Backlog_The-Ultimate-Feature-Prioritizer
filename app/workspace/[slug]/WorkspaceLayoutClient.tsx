'use client'

import { useState, createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WorkspaceSidebar, WorkspaceTopbar } from '@/components/features/workspace/WorkspaceSidebar'
import { OnlinePresenceAvatars } from '@/components/features/workspace/OnlinePresenceAvatars'
import { Profile, Workspace, WorkspaceMember } from '@/types/database.types'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface WorkspaceContextValue {
    workspace: Workspace | null
    profile: Profile | null
    isAdmin: boolean
    isViewer: boolean
    userRole: 'admin' | 'member' | 'viewer' | null
    searchQuery: string
    setSearchQuery: (q: string) => void
    showNewRequestModal: boolean
    setShowNewRequestModal: (v: boolean) => void
    activeFramework: string
    setActiveFramework: (f: string) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue>({
    workspace: null,
    profile: null,
    isAdmin: false,
    isViewer: false,
    userRole: null,
    searchQuery: '',
    setSearchQuery: () => { },
    showNewRequestModal: false,
    setShowNewRequestModal: () => { },
    activeFramework: 'rice',
    setActiveFramework: () => { },
})

export function useWorkspace() {
    return useContext(WorkspaceContext)
}

export default function WorkspaceLayoutClient({
    slug,
    children,
}: {
    slug: string
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showNewRequestModal, setShowNewRequestModal] = useState(false)
    const [activeFramework, setActiveFramework] = useState('rice')
    const supabase = createClient()

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            let { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                const { data: refreshed } = await supabase.auth.refreshSession()
                session = refreshed.session
            }
            if (!session?.user) return null
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
            return data as Profile | null
        },
    })

    const { data: workspace, isLoading: workspaceLoading, isError } = useQuery({
        queryKey: ['workspace', slug],
        retry: 3,
        retryDelay: 500,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .eq('slug', slug)
                .single()
            if (error) throw error
            // Sync active framework from workspace record
            const ws = data as Workspace
            if (ws?.active_framework) setActiveFramework(ws.active_framework)
            return ws
        },
    })

    const { data: memberData } = useQuery({
        queryKey: ['workspace-member', slug],
        enabled: !!workspace && !!profile,
        queryFn: async () => {
            let { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                const { data: refreshed } = await supabase.auth.refreshSession()
                session = refreshed.session
            }
            if (!session?.user || !workspace) return null
            const { data } = await supabase
                .from('workspace_members')
                .select('*')
                .match({ user_id: session.user.id, workspace_id: workspace.id })
                .single()
            return data as WorkspaceMember | null
        },
    })

    const isAdmin = (memberData?.role as string) === 'admin'
    const isViewer = (memberData?.role as string) === 'viewer'
    const userRole = ((memberData?.role as string) || null) as 'admin' | 'member' | 'viewer' | null
    const isLoading = profileLoading || workspaceLoading

    // Loading — show a visible spinner (skeleton was invisible in dark mode)
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                    <p className="text-sm">Loading workspace...</p>
                </div>
            </div>
        )
    }

    // Workspace not found — graceful error state
    if (isError || !workspace) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <h1 className="text-xl font-bold mb-2">Workspace not found</h1>
                    <p className="text-muted-foreground text-sm mb-6">
                        The workspace <strong>{slug}</strong> doesn't exist or you don't have access to it.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <WorkspaceContext.Provider
            value={{
                workspace: workspace ?? null,
                profile: profile ?? null,
                isAdmin,
                isViewer,
                userRole,
                searchQuery,
                setSearchQuery,
                showNewRequestModal,
                setShowNewRequestModal,
                activeFramework,
                setActiveFramework,
            }}
        >
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-300 lg:static lg:translate-x-0',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    <WorkspaceSidebar
                        slug={slug}
                        workspace={workspace || null}
                        profile={profile || null}
                        onClose={() => setSidebarOpen(false)}
                    />
                </aside>

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <WorkspaceTopbar
                        slug={slug}
                        workspace={workspace || null}
                        isAdmin={isAdmin}
                        onNewRequest={() => setShowNewRequestModal(true)}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onMenuClick={() => setSidebarOpen(true)}
                        presenceSlot={
                            <OnlinePresenceAvatars
                                workspaceId={workspace?.id}
                                userId={profile?.id}
                                fullName={profile?.full_name ?? null}
                                avatarUrl={profile?.avatar_url ?? null}
                            />
                        }
                    />
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </WorkspaceContext.Provider>
    )
}
