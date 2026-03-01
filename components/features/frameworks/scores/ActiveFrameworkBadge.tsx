'use client'

import type { FeatureRequest } from '@/types/database.types'
import { getRiceScoreBadgeClass } from '@/lib/utils/rice'
import { ICEScoreBadge } from './ICEScoreBadge'
import { MoSCoWBadge } from './MoSCoWBadge'
import { JTBDBadge } from './JTBDBadge'
import { KanoBadge } from './KanoBadge'
import { IEQuadrantBadge } from './IEQuadrantBadge'
import { WSJFScoreBadge } from './WSJFScoreBadge'
import { cn } from '@/lib/utils/cn'

interface ActiveFrameworkBadgeProps {
    request: Partial<FeatureRequest>
    activeFramework: string
    className?: string
}

export function ActiveFrameworkBadge({ request, activeFramework, className }: ActiveFrameworkBadgeProps) {
    switch (activeFramework) {
        case 'rice':
            if (request.rice_score == null) return null
            return (
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', getRiceScoreBadgeClass(request.rice_score), className)}>
                    <span className="opacity-60 font-normal">RICE</span>
                    {request.rice_score.toFixed(2)}
                </span>
            )
        case 'ice':
            return <ICEScoreBadge score={request.ice_score} className={className} />
        case 'moscow':
            return <MoSCoWBadge category={request.moscow_category} className={className} />
        case 'jtbd':
            return <JTBDBadge score={request.jtbd_opportunity_score} className={className} />
        case 'kano':
            return <KanoBadge category={request.kano_category} className={className} />
        case 'impact_effort':
            return <IEQuadrantBadge quadrant={request.ie_quadrant} className={className} />
        case 'wsjf':
            return <WSJFScoreBadge score={request.wsjf_score} className={className} />
        default:
            return null
    }
}
