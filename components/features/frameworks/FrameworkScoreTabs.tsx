'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { createUntypedClient } from '@/lib/supabase/untyped-client'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { FRAMEWORKS } from '@/lib/utils/frameworks'
import type { FeatureRequest } from '@/types/database.types'
import type { FrameworkId } from '@/types/frameworks.types'
import { getRiceScoreBadgeClass } from '@/lib/utils/rice'
import { ICEScoreBadge } from './scores/ICEScoreBadge'
import { MoSCoWBadge } from './scores/MoSCoWBadge'
import { JTBDBadge } from './scores/JTBDBadge'
import { KanoBadge } from './scores/KanoBadge'
import { IEQuadrantBadge } from './scores/IEQuadrantBadge'
import { WSJFScoreBadge } from './scores/WSJFScoreBadge'
import { ICEForm } from './forms/ICEForm'
import { MoSCoWForm } from './forms/MoSCoWForm'
import { JTBDForm } from './forms/JTBDForm'
import { KanoForm } from './forms/KanoForm'
import { ImpactEffortForm } from './forms/ImpactEffortForm'
import { WSJFForm } from './forms/WSJFForm'

interface FrameworkScoreTabsProps {
    request: FeatureRequest
    workspaceSlug: string
}

function hasCoverage(request: FeatureRequest, id: FrameworkId): boolean {
    switch (id) {
        case 'rice': return request.rice_score != null
        case 'ice': return request.ice_score != null
        case 'moscow': return request.moscow_category != null
        case 'jtbd': return request.jtbd_opportunity_score != null
        case 'kano': return request.kano_category != null
        case 'impact_effort': return request.ie_quadrant != null
        case 'wsjf': return request.wsjf_score != null
        default: return false
    }
}

export function FrameworkScoreTabs({ request, workspaceSlug }: FrameworkScoreTabsProps) {
    const scoredFrameworks = FRAMEWORKS.filter((f) => hasCoverage(request, f.id as FrameworkId))
    const unscoredFrameworks = FRAMEWORKS.filter((f) => !hasCoverage(request, f.id as FrameworkId))

    const defaultTab = scoredFrameworks.length > 0 ? scoredFrameworks[0].id : null
    const [activeTab, setActiveTab] = useState<string | null>(defaultTab)
    const [addingFramework, setAddingFramework] = useState<FrameworkId | null>(null)
    const [saving, setSaving] = useState(false)
    const [pendingData, setPendingData] = useState<Record<string, unknown>>({})

    const supabase = createClient()
    const supabaseRaw = createUntypedClient()
    const qc = useQueryClient()

    const saveFramework = async (id: FrameworkId, data: Record<string, unknown>) => {
        setSaving(true)
        try {
            const { error } = await supabaseRaw.from('feature_requests').update(data).eq('id', request.id)
            if (error) throw error
            toast.success('Score saved')
            qc.invalidateQueries({ queryKey: ['feature-requests', workspaceSlug] })
            setAddingFramework(null)
            setPendingData({})
        } catch (err: any) {
            console.error('Save framework error:', err)
            toast.error(`Failed to save score: ${err.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Score tabs */}
            {scoredFrameworks.length > 0 && (
                <>
                    <div className="flex gap-1.5 flex-wrap">
                        {scoredFrameworks.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setActiveTab(f.id)}
                                className={cn(
                                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                                    activeTab === f.id
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground hover:border-primary/50'
                                )}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'rice' && request.rice_score != null && (
                        <div className="rounded-xl border border-border p-4 space-y-3">
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">RICE Score</div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold">{request.rice_score.toFixed(2)}</span>
                                <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', getRiceScoreBadgeClass(request.rice_score))}>
                                    {request.rice_score >= 8 ? 'High' : request.rice_score >= 5 ? 'Medium' : 'Low'}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-sm">
                                {[['Reach', request.reach], ['Impact', request.impact], ['Conf.', request.confidence + '%'], ['Effort', request.effort]].map(([l, v]) => (
                                    <div key={l as string} className="text-center bg-muted/40 rounded-lg p-2">
                                        <div className="text-xs text-muted-foreground">{l}</div>
                                        <div className="font-semibold">{v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'ice' && <div className="rounded-xl border border-border p-4 flex items-center gap-3"><div className="text-2xl font-bold">{request.ice_score?.toFixed(1)}</div><ICEScoreBadge score={request.ice_score} /></div>}
                    {activeTab === 'moscow' && <div className="rounded-xl border border-border p-4 space-y-2"><MoSCoWBadge category={request.moscow_category} />{request.moscow_rationale && <p className="text-sm text-muted-foreground">{request.moscow_rationale}</p>}</div>}
                    {activeTab === 'jtbd' && <div className="rounded-xl border border-border p-4 space-y-2"><div className="flex items-center gap-3"><div className="text-2xl font-bold">{request.jtbd_opportunity_score?.toFixed(0)}</div><JTBDBadge score={request.jtbd_opportunity_score} /></div>{request.jtbd_job_statement && <p className="text-sm italic text-muted-foreground">{request.jtbd_job_statement}</p>}</div>}
                    {activeTab === 'kano' && <div className="rounded-xl border border-border p-4"><KanoBadge category={request.kano_category} /></div>}
                    {activeTab === 'impact_effort' && <div className="rounded-xl border border-border p-4"><IEQuadrantBadge quadrant={request.ie_quadrant} /></div>}
                    {activeTab === 'wsjf' && <div className="rounded-xl border border-border p-4 flex items-center gap-3"><div className="text-2xl font-bold">{request.wsjf_score?.toFixed(2)}</div><WSJFScoreBadge score={request.wsjf_score} /></div>}
                </>
            )}

            {/* Add more frameworks */}
            {unscoredFrameworks.length > 0 && !addingFramework && (
                <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground font-medium">Add framework score</div>
                    <div className="flex flex-wrap gap-1.5">
                        {unscoredFrameworks.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setAddingFramework(f.id as FrameworkId)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                            >
                                <Plus size={10} />
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Inline scoring form */}
            {addingFramework && (
                <div className="rounded-xl border border-border p-5 space-y-5">
                    <div className="text-sm font-medium">Score with {FRAMEWORKS.find(f => f.id === addingFramework)?.name}</div>
                    {addingFramework === 'ice' && <ICEForm onChange={(d) => setPendingData(d as unknown as Record<string, unknown>)} />}
                    {addingFramework === 'moscow' && <MoSCoWForm onChange={(d) => setPendingData(d as unknown as Record<string, unknown>)} />}
                    {addingFramework === 'jtbd' && <JTBDForm onChange={(d) => setPendingData(d as unknown as Record<string, unknown>)} />}
                    {addingFramework === 'kano' && <KanoForm onChange={(d) => setPendingData(d as unknown as Record<string, unknown>)} />}
                    {addingFramework === 'impact_effort' && <ImpactEffortForm onChange={(d) => setPendingData(d as unknown as Record<string, unknown>)} />}
                    {addingFramework === 'wsjf' && <WSJFForm onChange={(d) => setPendingData(d as unknown as Record<string, unknown>)} />}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => saveFramework(addingFramework, pendingData)}
                            disabled={saving || Object.keys(pendingData).length === 0}
                            className="flex-1 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {saving ? 'Saving…' : 'Save Score'}
                        </button>
                        <button
                            onClick={() => { setAddingFramework(null); setPendingData({}) }}
                            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {scoredFrameworks.length === 0 && !addingFramework && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No framework scores yet — add one above.
                </div>
            )}
        </div>
    )
}
