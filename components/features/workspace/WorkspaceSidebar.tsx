'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    List,
    Kanban,
    BarChart3,
    Settings,
    Network,
    Zap,
    LogOut,
    Bell,
    Search,
    Plus,
    X,
    ChevronDown,
    User,
    BookOpen,
    Command,
    ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { WorkspaceAvatar } from './WorkspaceAvatar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { FrameworkSwitcher } from '@/components/features/frameworks/FrameworkSwitcher'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils/cn'
import { RequestSlideOver } from '@/components/features/requests/RequestSlideOver'
import { LofiPlayer } from './LofiPlayer'
import { ActivityFeed } from './ActivityFeed'
import { useWorkspace } from '@/app/workspace/[slug]/WorkspaceLayoutClient'
import { Profile, Workspace } from '@/types/database.types'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

const navItems = [
    { href: 'backlog', label: 'Backlog', icon: List },
    { href: 'clusters', label: 'Clusters', icon: Network },
    { href: 'board', label: 'Board', icon: Kanban },
    { href: 'insights', label: 'Insights', icon: BarChart3 },
    { href: 'frameworks', label: 'Frameworks', icon: BookOpen },
    { href: 'settings', label: 'Settings', icon: Settings },
]

// ─── Icon Rail (collapsed sidebar) ───
export function WorkspaceSidebar({
    slug,
    workspace,
    profile,
    expanded,
}: {
    slug: string
    workspace: Workspace | null
    profile: Profile | null
    expanded: boolean
}) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const getInitials = (name: string | null) => {
        if (!name) return '?'
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col h-full">
                {/* Workspace Avatar */}
                <div className={cn('border-b border-border flex items-center', expanded ? 'px-3 py-3 gap-2.5' : 'px-0 py-3 justify-center')}>
                    <Link href="/dashboard" className="shrink-0">
                        <WorkspaceAvatar id={workspace?.id || ''} size="sm" />
                    </Link>
                    {expanded && workspace && (
                        <div className="min-w-0 overflow-hidden animate-in fade-in duration-200">
                            <p className="text-xs font-semibold truncate">{workspace.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">/{slug}</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className={cn('flex-1 py-2 space-y-0.5', expanded ? 'px-2' : 'px-1')}>
                    {navItems.map((item) => {
                        const isActive = pathname.includes(`/workspace/${slug}/${item.href}`)
                        const link = (
                            <Link
                                key={item.href}
                                href={`/workspace/${slug}/${item.href}`}
                                className={cn(
                                    'flex items-center rounded-md text-sm font-medium transition-all duration-150',
                                    expanded ? 'gap-3 px-3 py-2' : 'justify-center p-2',
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                )}
                            >
                                <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                                {expanded && <span className="truncate animate-in fade-in duration-200">{item.label}</span>}
                            </Link>
                        )

                        if (expanded) return <div key={item.href}>{link}</div>

                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>{link}</TooltipTrigger>
                                <TooltipContent side="right" className="text-xs">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </nav>

                {/* Bottom section */}
                <div className={cn('border-t border-border py-2 space-y-0.5', expanded ? 'px-2' : 'px-1')}>
                    {/* Theme toggle */}
                    {expanded ? (
                        <ThemeToggle
                            showLabel
                            className="theme-toggle--sidebar w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        />
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex justify-center">
                                    <ThemeToggle className="theme-toggle--sidebar p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">Theme</TooltipContent>
                        </Tooltip>
                    )}

                    {/* User */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            {expanded ? (
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors">
                                    <Avatar className="h-6 w-6 shrink-0">
                                        <AvatarImage src={profile?.avatar_url || ''} />
                                        <AvatarFallback className="text-[9px]">{getInitials(profile?.full_name || '')}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium truncate flex-1 text-left">{profile?.full_name}</span>
                                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                                </button>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="flex justify-center w-full p-2 rounded-md hover:bg-accent transition-colors">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={profile?.avatar_url || ''} />
                                                <AvatarFallback className="text-[9px]">{getInitials(profile?.full_name || '')}</AvatarFallback>
                                            </Avatar>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="text-xs">{profile?.full_name}</TooltipContent>
                                </Tooltip>
                            )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">{profile?.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard">
                                    <Zap className="h-4 w-4" />
                                    All Workspaces
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="text-destructive focus:text-destructive"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </TooltipProvider>
    )
}

// ─── Command Bar (replaces topbar) ───
export function CommandBar({
    slug,
    workspace,
    isAdmin,
    onNewRequest,
    searchQuery,
    onSearchChange,
    presenceSlot,
}: {
    slug: string
    workspace: Workspace | null
    isAdmin?: boolean
    onNewRequest?: () => void
    searchQuery?: string
    onSearchChange?: (q: string) => void
    presenceSlot?: React.ReactNode
}) {
    const [notifOpen, setNotifOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
    const searchRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const { isViewer } = useWorkspace()

    const { data: allRequests } = useQuery({
        queryKey: ['all-requests-search', workspace?.id],
        enabled: !!workspace,
        queryFn: async () => {
            const { data } = await supabase
                .from('feature_requests')
                .select('id, title, status, description')
                .eq('workspace_id', workspace!.id)
                .order('created_at', { ascending: false })
            return (data || []) as { id: string; title: string; status: string; description: string | null }[]
        },
    })

    const { data: recentRequests } = useQuery({
        queryKey: ['notifications', workspace?.id],
        enabled: !!workspace,
        queryFn: async () => {
            const { data } = await supabase
                .from('feature_requests')
                .select('id, title, status, created_at, profiles(full_name)')
                .eq('workspace_id', workspace!.id)
                .order('created_at', { ascending: false })
                .limit(10)
            return data || []
        },
    })

    const searchResults = searchQuery && searchQuery.trim().length > 0
        ? (allRequests || []).filter(r =>
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 8)
        : []

    useEffect(() => {
        setDropdownOpen(!!searchQuery && searchQuery.trim().length > 0)
    }, [searchQuery])

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const statusDotColors: Record<string, string> = {
        backlog: 'bg-gray-400',
        now: 'bg-red-500',
        next: 'bg-orange-400',
        later: 'bg-blue-400',
        shipped: 'bg-green-500',
    }

    return (
        <>
            <header className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-3 gap-3 sticky top-0 z-20">
                {/* Back to dashboard */}
                <Link href="/dashboard" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" title="Back to dashboard">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                {/* Command-style search */}
                <div className="flex-1 max-w-lg relative" ref={searchRef}>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search requests or press ⌘K..."
                            className="pl-8 pr-16 h-8 text-xs bg-muted/50 border-border/50 focus-visible:ring-1 font-mono"
                            value={searchQuery || ''}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    onSearchChange?.('')
                                    setDropdownOpen(false)
                                }
                            }}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {searchQuery ? (
                                <button
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => { onSearchChange?.(''); setDropdownOpen(false) }}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            ) : (
                                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 border border-border bg-muted/80 px-1 text-[9px] font-mono text-muted-foreground">
                                    <Command className="h-2.5 w-2.5" />K
                                </kbd>
                            )}
                        </div>
                    </div>

                    {/* Search dropdown */}
                    {dropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 border border-border bg-card shadow-xl overflow-hidden">
                            {searchResults.length === 0 ? (
                                <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                                    No results for &quot;{searchQuery}&quot;
                                </div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto py-1">
                                    {searchResults.map((req) => (
                                        <button
                                            key={req.id}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                                            onClick={() => {
                                                setSelectedRequestId(req.id)
                                                onSearchChange?.('')
                                                setDropdownOpen(false)
                                            }}
                                        >
                                            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusDotColors[req.status] || 'bg-gray-400')} />
                                            <span className="text-xs font-medium line-clamp-1 flex-1">{req.title}</span>
                                            <span className="text-[10px] text-muted-foreground capitalize shrink-0">{req.status}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    {presenceSlot}
                    <LofiPlayer />
                    <FrameworkSwitcher />

                    {/* Activity bell */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setNotifOpen(!notifOpen)}
                        >
                            <Bell className="h-3.5 w-3.5" />
                            {recentRequests && recentRequests.length > 0 && (
                                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                            )}
                        </Button>

                        {notifOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                                <div className="absolute right-0 top-full mt-1.5 w-80 z-50 bg-card border border-border shadow-xl overflow-hidden">
                                    <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                                        <h3 className="text-xs font-semibold">Activity</h3>
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">live</span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto py-1">
                                        {workspace ? (
                                            <ActivityFeed workspaceId={workspace.id} />
                                        ) : (
                                            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No activity</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* New request */}
                    {onNewRequest && !isViewer && (
                        <button onClick={onNewRequest} className="cmd-new-btn">
                            <Plus size={12} />
                            <span className="hidden sm:inline">new</span>
                        </button>
                    )}
                </div>
            </header>

            {selectedRequestId && (
                <RequestSlideOver
                    requestId={selectedRequestId}
                    workspaceId={workspace?.id || ''}
                    workspaceSlug={slug}
                    isAdmin={isAdmin || false}
                    onClose={() => setSelectedRequestId(null)}
                />
            )}
        </>
    )
}
