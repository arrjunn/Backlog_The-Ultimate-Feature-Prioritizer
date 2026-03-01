'use client'

import { cn } from '@/lib/utils/cn'
import { getKanoCategoryColor, getKanoCategoryLabel } from '@/lib/utils/kano'
import type { KanoCategory } from '@/types/frameworks.types'

interface KanoBadgeProps {
    category: KanoCategory | null | undefined
    className?: string
}

export function KanoBadge({ category, className }: KanoBadgeProps) {
    if (!category) return null

    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                getKanoCategoryColor(category),
                className
            )}
        >
            {getKanoCategoryLabel(category)}
        </span>
    )
}
