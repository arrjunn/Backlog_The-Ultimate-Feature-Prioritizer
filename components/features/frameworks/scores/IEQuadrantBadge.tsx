'use client'

import { cn } from '@/lib/utils/cn'
import { getIEQuadrantColor, getIEQuadrantLabel } from '@/lib/utils/impact-effort'
import type { IEQuadrant } from '@/types/frameworks.types'

interface IEQuadrantBadgeProps {
    quadrant: IEQuadrant | null | undefined
    className?: string
}

export function IEQuadrantBadge({ quadrant, className }: IEQuadrantBadgeProps) {
    if (!quadrant) return null

    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                getIEQuadrantColor(quadrant),
                className
            )}
        >
            {getIEQuadrantLabel(quadrant)}
        </span>
    )
}
