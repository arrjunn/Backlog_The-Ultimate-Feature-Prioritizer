'use client'

import { cn } from '@/lib/utils/cn'
import { getJTBDColor, getJTBDOpportunityLabel } from '@/lib/utils/jtbd'

interface JTBDBadgeProps {
    score: number | null | undefined
    className?: string
}

export function JTBDBadge({ score, className }: JTBDBadgeProps) {
    if (score == null) return null

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                getJTBDColor(score),
                className
            )}
        >
            <span className="opacity-60 font-normal">OPP</span>
            {score.toFixed(0)}
        </span>
    )
}

export function JTBDOpportunityLabel({ score }: { score: number | null | undefined }) {
    if (score == null) return null
    return (
        <span className={cn('text-xs font-medium', getJTBDColor(score).split(' ').slice(1).join(' '))}>
            {getJTBDOpportunityLabel(score)}
        </span>
    )
}
