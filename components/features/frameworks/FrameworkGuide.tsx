'use client'

import { useWorkspace } from '@/app/workspace/[slug]/WorkspaceLayoutClient'
import { FRAMEWORKS } from '@/lib/utils/frameworks'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { createUntypedClient } from '@/lib/supabase/untyped-client'
import { BarChart2, Zap, Layers, Target, Smile, Grid2x2, TrendingUp, CheckCircle2 } from 'lucide-react'
import type { FrameworkId } from '@/types/frameworks.types'

const ICONS: Record<string, React.ReactNode> = {
    BarChart2: <BarChart2 size={24} />,
    Zap: <Zap size={24} />,
    Layers: <Layers size={24} />,
    Target: <Target size={24} />,
    Smile: <Smile size={24} />,
    Grid2x2: <Grid2x2 size={24} />,
    TrendingUp: <TrendingUp size={24} />,
}

const COMPARISON = [
    { label: 'Type', key: 'type' as const },
    { label: 'Output', key: 'output' as const },
    { label: 'Best For', key: 'bestFor' as const },
]

const FRAMEWORK_META: Record<string, { type: string; output: string }> = {
    rice: { type: 'Quantitative', output: 'Numeric score' },
    ice: { type: 'Quantitative', output: 'Numeric score (fast)' },
    moscow: { type: 'Categorical', output: 'Priority category' },
    jtbd: { type: 'Opportunity', output: 'Opportunity score' },
    kano: { type: 'Satisfaction', output: 'Category classification' },
    impact_effort: { type: 'Matrix', output: 'Quadrant placement' },
    wsjf: { type: 'Quantitative', output: 'Cost of Delay ratio' },
}

export default function FrameworkGuidePage() {
    const { workspace, activeFramework, setActiveFramework } = useWorkspace()
    const supabase = createClient()
    const supabaseRaw = createUntypedClient()
    const qc = useQueryClient()

    const setActive = async (id: FrameworkId) => {
        if (!workspace) return
        setActiveFramework(id)
        await supabaseRaw.from('workspaces').update({ active_framework: id }).eq('id', workspace.id)
        qc.invalidateQueries({ queryKey: ['workspace', workspace.slug] })
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
            {/* Header */}
            <div>
                <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Prioritization Frameworks</h1>
                <p className="text-muted-foreground text-sm max-w-2xl">
                    Backlog supports 7 frameworks. Choose the right one for your team&apos;s context — or score the
                    same request with multiple frameworks to cross-validate your intuition.
                </p>
            </div>

            {/* Framework cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FRAMEWORKS.map((f) => {
                    const meta = FRAMEWORK_META[f.id]
                    const isActive = activeFramework === f.id
                    return (
                        <div
                            key={f.id}
                            className={`relative rounded-2xl border-2 p-6 space-y-4 transition-all ${isActive ? 'border-primary shadow-sm' : 'border-border hover:border-primary/40'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-medium text-primary">
                                    <CheckCircle2 size={14} />
                                    Active
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                <div
                                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-white"
                                    style={{ background: f.colorHex }}
                                >
                                    {ICONS[f.icon]}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base">{f.fullName}</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="space-y-0.5">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Type</div>
                                    <div>{meta.type}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Output</div>
                                    <div>{meta.output}</div>
                                </div>
                                <div className="col-span-2 space-y-0.5">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Best For</div>
                                    <div>{f.bestFor}</div>
                                </div>
                            </div>

                            {!isActive && (
                                <button
                                    onClick={() => setActive(f.id as FrameworkId)}
                                    className="w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                                >
                                    Set as Active
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Comparison table */}
            <div>
                <h2 className="font-serif text-xl font-semibold mb-4">Framework Comparison</h2>
                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 border-b border-border">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Framework</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Output</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Best For</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {FRAMEWORKS.map((f) => {
                                const meta = FRAMEWORK_META[f.id]
                                return (
                                    <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: f.colorHex }} />
                                            {f.name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{meta.type}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{meta.output}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{f.bestFor}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick decision guide */}
            <div>
                <h2 className="font-serif text-xl font-semibold mb-4">Which should I use?</h2>
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                    {[
                        { q: 'I need a simple, fast method', a: 'ICE Score', color: '#06b6d4' },
                        { q: 'I need data-backed scores with reach estimates', a: 'RICE Score', color: '#6366f1' },
                        { q: 'I need to align stakeholders on sprint scope', a: 'MoSCoW', color: '#8b5cf6' },
                        { q: 'I want to find unmet user needs & satisfaction gaps', a: 'JTBD', color: '#f97316' },
                        { q: 'I want to classify features by user delight', a: 'Kano Model', color: '#ec4899' },
                        { q: 'I need a quick visual overview of effort vs impact', a: 'Impact/Effort Matrix', color: '#14b8a6' },
                        { q: 'My team uses SAFe / enterprise agile frameworks', a: 'WSJF', color: '#f59e0b' },
                    ].map(({ q, a, color }) => (
                        <div key={q} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                            <span className="text-sm text-muted-foreground flex-1">{q}</span>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white shrink-0" style={{ background: color }}>
                                {a}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
