'use client'

import { useState, useRef, useEffect } from 'react'
import { useWorkspace } from '@/app/workspace/[slug]/WorkspaceLayoutClient'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { createUntypedClient } from '@/lib/supabase/untyped-client'
import { FRAMEWORKS, getFrameworkConfig } from '@/lib/utils/frameworks'
import { ChevronDown, BarChart2, Zap, Layers, Target, Smile, Grid2x2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { FrameworkId } from '@/types/frameworks.types'

const ICONS: Record<string, React.ReactNode> = {
    BarChart2: <BarChart2 size={14} />,
    Zap: <Zap size={14} />,
    Layers: <Layers size={14} />,
    Target: <Target size={14} />,
    Smile: <Smile size={14} />,
    Grid2x2: <Grid2x2 size={14} />,
    TrendingUp: <TrendingUp size={14} />,
}

export function FrameworkSwitcher() {
    const { workspace, activeFramework, setActiveFramework } = useWorkspace()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const supabaseRaw = createUntypedClient()
    const qc = useQueryClient()

    const current = getFrameworkConfig(activeFramework as FrameworkId)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const select = async (id: FrameworkId) => {
        if (!workspace) return
        setOpen(false)
        setActiveFramework(id)
        await supabaseRaw.from('workspaces').update({ active_framework: id }).eq('id', workspace.id)
        qc.invalidateQueries({ queryKey: ['workspace', workspace.slug] })
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium
                           hover:bg-muted/60 transition-colors"
            >
                <span className="text-muted-foreground">{ICONS[current.icon]}</span>
                <span>{current.name}</span>
                <ChevronDown size={12} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-border">
                        <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Active Framework</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto py-1">
                        {FRAMEWORKS.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => select(f.id as FrameworkId)}
                                className={cn(
                                    'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50',
                                    activeFramework === f.id && 'bg-primary/8'
                                )}
                            >
                                <div className="mt-0.5 shrink-0 text-muted-foreground">
                                    {ICONS[f.icon]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{f.name}</span>
                                        {activeFramework === f.id && (
                                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">active</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
                                    <p className="text-xs text-muted-foreground/60 mt-0.5">Best for: {f.bestFor}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
