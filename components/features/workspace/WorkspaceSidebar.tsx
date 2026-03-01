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
    Zap,
    LogOut,
    Moon,
    Sun,
    Bell,
    Search,
    Plus,
    Menu,
    X,
    ChevronDown,
    User,
    BookOpen,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { WorkspaceAvatar } from './WorkspaceAvatar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
import { useWorkspace } from '@/app/workspace/[slug]/WorkspaceLayoutClient'
import { Profile, Workspace } from '@/types/database.types'

interface WorkspaceLayoutClientProps {
    slug: string
    children: React.ReactNode
    onNewRequest?: () => void
    searchQuery?: string
    onSearchChange?: (q: string) => void
}

const navItems = [
    { href: 'backlog', label: 'Backlog', icon: List },
    { href: 'board', label: 'Board', icon: Kanban },
    { href: 'insights', label: 'Insights', icon: BarChart3 },
    { href: 'frameworks', label: 'Frameworks', icon: BookOpen },
    { href: 'settings', label: 'Settings', icon: Settings },
]

export function WorkspaceSidebar({
    slug,
    workspace,
    profile,
    onClose,
}: {
    slug: string
    workspace: Workspace | null
    profile: Profile | null
    onClose?: () => void
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
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
        <div className="flex flex-col h-full">
            {/* Logo + Workspace */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <span className="ws-serif-logo">backlog</span>
                    </Link>
                    {onClose && (
                        <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-accent">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {workspace ? (
                    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-muted/50">
                        <WorkspaceAvatar id={workspace.id} size="sm" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{workspace.name}</p>
                            <p className="text-xs text-muted-foreground">/{slug}</p>
                        </div>
                    </div>
                ) : (
                    <Skeleton className="h-10 w-full rounded-lg" />
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = pathname.includes(`/workspace/${slug}/${item.href}`)
                    return (
                        <Link
                            key={item.href}
                            href={`/workspace/${slug}/${item.href}`}
                            onClick={onClose}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            )}
                        >
                            <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom user section */}
            <div className="p-3 border-t border-border space-y-1">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={profile?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">{getInitials(profile?.full_name || '')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium truncate">{profile?.full_name || 'Loading...'}</p>
                                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-56">
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
    )
}

export function WorkspaceTopbar({
    slug,
    workspace,
    isAdmin,
    onNewRequest,
    searchQuery,
    onSearchChange,
    onMenuClick,
    presenceSlot,
}: {
    slug: string
    workspace: Workspace | null
    isAdmin?: boolean
    onNewRequest?: () => void
    searchQuery?: string
    onSearchChange?: (q: string) => void
    onMenuClick?: () => void
    presenceSlot?: React.ReactNode
}) {
    const [notifOpen, setNotifOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
    const searchRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const { isViewer } = useWorkspace()

    // Load all requests for search
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

    // Filter requests based on search query
    const searchResults = searchQuery && searchQuery.trim().length > 0
        ? (allRequests || []).filter(r =>
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 8)
        : []

    // Open dropdown when there's a query
    useEffect(() => {
        setDropdownOpen(!!searchQuery && searchQuery.trim().length > 0)
    }, [searchQuery])

    // Close on outside click
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
            <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-20">
                {/* header contents are unchanged, closing header below */}
                <button
                    className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Search with live dropdown */}
                <div className="flex-1 max-w-sm relative" ref={searchRef}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search requests..."
                            className="pl-9 h-9 bg-muted border-0 focus-visible:ring-1"
                            value={searchQuery || ''}
                            onChange={(e) => {
                                onSearchChange?.(e.target.value)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    onSearchChange?.('')
                                    setDropdownOpen(false)
                                }
                            }}
                        />
                        {searchQuery && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => { onSearchChange?.(''); setDropdownOpen(false) }}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                            {searchResults.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                    No requests match &quot;{searchQuery}&quot;
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto py-1">
                                    {searchResults.map((req) => (
                                        <button
                                            key={req.id}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
                                            onClick={() => {
                                                setSelectedRequestId(req.id)
                                                onSearchChange?.('')
                                                setDropdownOpen(false)
                                            }}
                                        >
                                            <span className={cn('h-2 w-2 rounded-full shrink-0 mt-0.5', statusDotColors[req.status] || 'bg-gray-400')} />
                                            <span className="flex-1 min-w-0">
                                                <span className="text-sm font-medium line-clamp-1">{req.title}</span>
                                            </span>
                                            <span className="text-xs text-muted-foreground capitalize shrink-0">{req.status}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    {/* Online Presence */}
                    {presenceSlot}
                    {/* Lofi Player */}
                    <LofiPlayer />
                    {/* Framework Switcher */}
                    <FrameworkSwitcher />
                    {/* Notification Bell */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                            onClick={() => setNotifOpen(!notifOpen)}
                        >
                            <Bell className="h-4 w-4" />
                            {recentRequests && recentRequests.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full" style={{ background: 'var(--lp-accent, #b5652b)' }} />
                            )}
                        </Button>

                        {notifOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setNotifOpen(false)}
                                />
                                {/* Panel */}
                                <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Recent Activity</h3>
                                        <span className="text-xs text-muted-foreground">
                                            {recentRequests?.length || 0} requests
                                        </span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {!recentRequests || recentRequests.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                No feature requests yet
                                            </div>
                                        ) : (
                                            recentRequests.map((req: any) => {
                                                const statusColors: Record<string, string> = {
                                                    backlog: 'bg-gray-400',
                                                    now: 'bg-red-500',
                                                    next: 'bg-orange-500',
                                                    later: 'bg-blue-500',
                                                    shipped: 'bg-green-500',
                                                }
                                                const now = new Date()
                                                const created = new Date(req.created_at)
                                                const diffMin = Math.floor((now.getTime() - created.getTime()) / 60000)
                                                const timeLabel =
                                                    diffMin < 1 ? 'just now'
                                                        : diffMin < 60 ? `${diffMin}m ago`
                                                            : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago`
                                                                : `${Math.floor(diffMin / 1440)}d ago`

                                                return (
                                                    <div
                                                        key={req.id}
                                                        className="px-4 py-3 hover:bg-muted/50 border-b border-border/50 last:border-0 cursor-pointer transition-colors"
                                                        onClick={() => setNotifOpen(false)}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${statusColors[req.status] || 'bg-gray-400'}`} />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium line-clamp-1">{req.title}</p>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {req.profiles?.full_name || 'Unknown'} · {timeLabel}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {onNewRequest && !isViewer && (
                        <button
                            onClick={onNewRequest}
                            id="new-request-button"
                            className="ws-new-request-btn"
                        >
                            <Plus size={13} />
                            <span>new request</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Request slide-over opened from search */}
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
