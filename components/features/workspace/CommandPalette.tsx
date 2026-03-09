'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
    Search,
    List,
    Kanban,
    BarChart3,
    Settings,
    BookOpen,
    Plus,
    ArrowRight,
    Moon,
    Sun,
    Home,
    CornerDownLeft,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/app/workspace/[slug]/WorkspaceLayoutClient'
import { FeatureRequest } from '@/types/database.types'
import { STATUS_CONFIG, FeatureStatus } from '@/lib/utils/rice'
import { cn } from '@/lib/utils/cn'

interface CommandItem {
    id: string
    label: string
    description?: string
    icon: React.ElementType
    action: () => void
    group: string
}

export function CommandPalette() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const params = useParams<{ slug: string }>()
    const slug = params?.slug
    const { workspace, setShowNewRequestModal } = useWorkspace()
    const { setTheme, resolvedTheme } = useTheme()
    const supabase = createClient()

    // Fetch feature requests for search
    const { data: requests } = useQuery({
        queryKey: ['feature-requests-cmd', slug],
        enabled: !!workspace && open,
        queryFn: async () => {
            const { data } = await supabase
                .from('feature_requests')
                .select('id, title, status')
                .eq('workspace_id', workspace!.id)
                .order('created_at', { ascending: false })
                .limit(100)
            return (data || []) as Pick<FeatureRequest, 'id' | 'title' | 'status'>[]
        },
    })

    // Keyboard shortcut to open
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setOpen((o) => !o)
            }
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', down)
        return () => window.removeEventListener('keydown', down)
    }, [])

    // Focus input on open
    useEffect(() => {
        if (open) {
            setQuery('')
            setActiveIndex(0)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    const navigate = useCallback((path: string) => {
        setOpen(false)
        router.push(path)
    }, [router])

    // Build command items
    const commands = useMemo<CommandItem[]>(() => {
        const items: CommandItem[] = []

        if (slug) {
            // Navigation
            items.push(
                { id: 'nav-backlog', label: 'Go to Backlog', icon: List, action: () => navigate(`/workspace/${slug}/backlog`), group: 'Navigation' },
                { id: 'nav-board', label: 'Go to Board', icon: Kanban, action: () => navigate(`/workspace/${slug}/board`), group: 'Navigation' },
                { id: 'nav-insights', label: 'Go to Insights', icon: BarChart3, action: () => navigate(`/workspace/${slug}/insights`), group: 'Navigation' },
                { id: 'nav-frameworks', label: 'Go to Frameworks', icon: BookOpen, action: () => navigate(`/workspace/${slug}/frameworks`), group: 'Navigation' },
                { id: 'nav-settings', label: 'Go to Settings', icon: Settings, action: () => navigate(`/workspace/${slug}/settings`), group: 'Navigation' },
            )

            // Actions
            items.push(
                { id: 'act-new', label: 'New Feature Request', description: 'Create a new request', icon: Plus, action: () => { setOpen(false); setShowNewRequestModal(true) }, group: 'Actions' },
            )
        }

        items.push(
            { id: 'nav-dash', label: 'Go to Dashboard', icon: Home, action: () => navigate('/dashboard'), group: 'Navigation' },
        )

        // Theme
        items.push(
            { id: 'theme-light', label: 'Switch to Light Mode', icon: Sun, action: () => { setTheme('light'); setOpen(false) }, group: 'Theme' },
            { id: 'theme-dark', label: 'Switch to Dark Mode', icon: Moon, action: () => { setTheme('dark'); setOpen(false) }, group: 'Theme' },
        )

        // Feature requests search results
        if (requests && query.trim()) {
            const q = query.toLowerCase()
            const matched = requests
                .filter((r) => r.title.toLowerCase().includes(q))
                .slice(0, 8)
            matched.forEach((r) => {
                const statusLabel = STATUS_CONFIG[r.status as FeatureStatus]?.label || r.status
                items.push({
                    id: `req-${r.id}`,
                    label: r.title,
                    description: statusLabel,
                    icon: ArrowRight,
                    action: () => navigate(`/workspace/${slug}/backlog?request=${r.id}`),
                    group: 'Feature Requests',
                })
            })
        }

        return items
    }, [slug, requests, query, navigate, setShowNewRequestModal, setTheme])

    // Filter by query
    const filtered = useMemo(() => {
        if (!query.trim()) return commands
        const q = query.toLowerCase()
        return commands.filter((c) =>
            c.label.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q) ||
            c.group.toLowerCase().includes(q)
        )
    }, [commands, query])

    // Group items
    const grouped = useMemo(() => {
        const groups: Record<string, CommandItem[]> = {}
        filtered.forEach((item) => {
            if (!groups[item.group]) groups[item.group] = []
            groups[item.group].push(item)
        })
        return groups
    }, [filtered])

    // Keyboard navigation
    useEffect(() => {
        if (!open) return
        const down = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && filtered[activeIndex]) {
                e.preventDefault()
                filtered[activeIndex].action()
            }
        }
        window.addEventListener('keydown', down)
        return () => window.removeEventListener('keydown', down)
    }, [open, filtered, activeIndex])

    // Clamp index on filter change
    useEffect(() => {
        setActiveIndex(0)
    }, [query])

    // Scroll active into view
    useEffect(() => {
        const list = listRef.current
        if (!list) return
        const el = list.querySelector(`[data-index="${activeIndex}"]`)
        el?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex])

    if (!open) return null

    let flatIndex = -1

    return (
        <div className="fixed inset-0 z-[99998]" onClick={() => setOpen(false)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Dialog */}
            <div className="flex items-start justify-center pt-[20vh]">
                <div
                    className="relative w-full max-w-lg mx-4 bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 border border-border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No results found.
                            </p>
                        ) : (
                            Object.entries(grouped).map(([group, items]) => (
                                <div key={group}>
                                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        {group}
                                    </p>
                                    {items.map((item) => {
                                        flatIndex++
                                        const idx = flatIndex
                                        return (
                                            <button
                                                key={item.id}
                                                data-index={idx}
                                                onClick={item.action}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                                                    idx === activeIndex
                                                        ? 'bg-accent text-accent-foreground'
                                                        : 'text-foreground hover:bg-accent/50'
                                                )}
                                            >
                                                <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className="flex-1 truncate">{item.label}</span>
                                                {item.description && (
                                                    <span className="text-xs text-muted-foreground">{item.description}</span>
                                                )}
                                                {idx === activeIndex && (
                                                    <CornerDownLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 border border-border bg-muted font-mono">↑↓</kbd> navigate</span>
                        <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 border border-border bg-muted font-mono">↵</kbd> select</span>
                        <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 border border-border bg-muted font-mono">esc</kbd> close</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
