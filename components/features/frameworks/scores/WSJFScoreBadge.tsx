'use client'

import { cn } from '@/lib/utils/cn'
import { getWSJFScoreColor, getWSJFScoreLabel } from '@/lib/utils/rice'

interface WSJFScoreBadgeProps {
    score: number | null | undefined
    className?: string
}

export function WSJFScoreBadge({ score, className }: WSJFScoreBadgeProps) {
    if (score == null) return null

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                getWSJFScoreColor(score),
                className
            )}
        >
            <span className="opacity-60 font-normal">WSJF</span>
            {score.toFixed(2)}
        </span>
    )
}

export function WSJFPriorityLabel({ score }: { score: number | null | undefined }) {
    if (score == null) return null
    return <span className="text-xs text-muted-foreground">{getWSJFScoreLabel(score)}</span>
}
