'use client'

import { cn } from '@/lib/utils/cn'
import type { MoSCoWCategory } from '@/types/frameworks.types'

const MOSCOW_CONFIG: Record<MoSCoWCategory, { label: string; className: string }> = {
    must_have: { label: 'Must Have', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
    should_have: { label: 'Should Have', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    could_have: { label: 'Could Have', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    wont_have: { label: "Won't Have", className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

interface MoSCoWBadgeProps {
    category: MoSCoWCategory | null | undefined
    className?: string
}

export function MoSCoWBadge({ category, className }: MoSCoWBadgeProps) {
    if (!category) return null
    const config = MOSCOW_CONFIG[category]
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', config.className, className)}>
            {config.label}
        </span>
    )
}

export { MOSCOW_CONFIG }
