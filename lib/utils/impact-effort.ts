import type { IEQuadrant } from '@/types/frameworks.types'

export function getIEQuadrant(impact: number, effort: number): IEQuadrant {
    if (impact >= 6 && effort <= 5) return 'quick_win'
    if (impact >= 6 && effort > 5) return 'major_project'
    if (impact < 6 && effort <= 5) return 'fill_in'
    return 'thankless_task'
}

export function getIEQuadrantLabel(quadrant: IEQuadrant): string {
    const labels: Record<IEQuadrant, string> = {
        quick_win: 'Quick Win',
        major_project: 'Major Project',
        fill_in: 'Fill-in',
        thankless_task: 'Thankless Task',
    }
    return labels[quadrant]
}

export function getIEQuadrantColor(quadrant: IEQuadrant): string {
    const colors: Record<IEQuadrant, string> = {
        quick_win: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        major_project: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        fill_in: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        thankless_task: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }
    return colors[quadrant]
}

export function getIEQuadrantDescription(quadrant: IEQuadrant): string {
    const descriptions: Record<IEQuadrant, string> = {
        quick_win: 'High value, low cost — do this first.',
        major_project: 'High value but expensive — plan carefully.',
        fill_in: 'Easy but low value — do if time allows.',
        thankless_task: 'Low value, high cost — avoid or deprioritize.',
    }
    return descriptions[quadrant]
}

/** Returns the dot position (0–1) for the 2×2 grid SVG */
export function getIEGridPosition(impact: number, effort: number): { x: number; y: number } {
    // X axis = effort (1–10, left=low effort), Y axis = impact (1–10, top=high impact)
    return {
        x: (effort - 1) / 9,
        y: 1 - (impact - 1) / 9,
    }
}
