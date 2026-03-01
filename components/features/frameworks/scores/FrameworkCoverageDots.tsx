'use client'

import { cn } from '@/lib/utils/cn'
import type { FeatureRequest } from '@/types/database.types'
import { FRAMEWORKS } from '@/lib/utils/frameworks'

interface FrameworkCoverageDotsProps {
    request: Partial<FeatureRequest>
    className?: string
}

function hasCoverage(request: Partial<FeatureRequest>, frameworkId: string): boolean {
    switch (frameworkId) {
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

const DOT_COLORS: Record<string, string> = {
    rice: '#6366f1',
    ice: '#06b6d4',
    moscow: '#8b5cf6',
    jtbd: '#f97316',
    kano: '#ec4899',
    impact_effort: '#14b8a6',
    wsjf: '#f59e0b',
}

export function FrameworkCoverageDots({ request, className }: FrameworkCoverageDotsProps) {
    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            {FRAMEWORKS.map((f) => {
                const covered = hasCoverage(request, f.id)
                return (
                    <div
                        key={f.id}
                        title={`${f.name}: ${covered ? 'scored' : 'not scored'}`}
                        className="h-1.5 w-1.5 rounded-full transition-opacity"
                        style={{
                            background: covered ? DOT_COLORS[f.id] : undefined,
                            backgroundColor: !covered ? 'hsl(var(--border))' : undefined,
                            opacity: covered ? 1 : 0.4,
                        }}
                    />
                )
            })}
        </div>
    )
}
