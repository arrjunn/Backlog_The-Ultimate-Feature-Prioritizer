'use client'

import { cn } from '@/lib/utils/cn'
import { getICEScoreColor, getICEScoreLabel } from '@/lib/utils/rice'

interface ICEScoreBadgeProps {
    score: number | null | undefined
    className?: string
}

export function ICEScoreBadge({ score, className }: ICEScoreBadgeProps) {
    if (score == null) return null

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                getICEScoreColor(score),
                className
            )}
        >
            <span className="opacity-60 font-normal">ICE</span>
            {score.toFixed(1)}
        </span>
    )
}

export function ICEScoreLabel({ score }: { score: number | null | undefined }) {
    if (score == null) return null
    return <span className="text-xs text-muted-foreground">{getICEScoreLabel(score)}</span>
}
