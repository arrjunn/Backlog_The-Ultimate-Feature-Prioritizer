// ─── RICE ────────────────────────────────────────────────────
export function calculateRiceScore(
    reach: number,
    impact: number,
    confidence: number,
    effort: number
): number {
    if (effort === 0) return 0
    const score = (reach * impact * (confidence / 100)) / effort
    return Math.round(score * 100) / 100
}

export type RiceScoreColor = 'gray' | 'yellow' | 'blue' | 'green'

export function getRiceScoreColor(score: number): RiceScoreColor {
    if (score >= 8) return 'green'
    if (score >= 5) return 'blue'
    if (score >= 2) return 'yellow'
    return 'gray'
}

export function getRiceScoreBadgeClass(score: number): string {
    const color = getRiceScoreColor(score)
    const classes: Record<RiceScoreColor, string> = {
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    }
    return classes[color]
}

export const CONFIDENCE_OPTIONS = [
    { label: '10%', value: 10 },
    { label: '50%', value: 50 },
    { label: '80%', value: 80 },
    { label: '100%', value: 100 },
]

export const STATUS_CONFIG = {
    backlog: {
        label: 'Backlog',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        dot: 'bg-gray-400',
    },
    now: {
        label: 'Now',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        dot: 'bg-red-500',
    },
    next: {
        label: 'Next',
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        dot: 'bg-orange-500',
    },
    later: {
        label: 'Later',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        dot: 'bg-blue-500',
    },
    shipped: {
        label: 'Shipped',
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        dot: 'bg-green-500',
    },
} as const

export type FeatureStatus = keyof typeof STATUS_CONFIG

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .slice(0, 50)
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

export function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
}

// ─── ICE ─────────────────────────────────────────────────────
export function calculateICEScore(impact: number, confidence: number, ease: number): number {
    return Math.round((impact * confidence * ease) / 3 * 100) / 100
}

export function getICEScoreColor(score: number): string {
    if (score >= 200) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (score >= 100) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

export function getICEScoreLabel(score: number): string {
    if (score >= 200) return 'Very High'
    if (score >= 100) return 'High'
    if (score >= 40) return 'Medium'
    return 'Low'
}

// ─── WSJF ────────────────────────────────────────────────────
export function calculateWSJFScore(
    userBusinessValue: number,
    timeCriticality: number,
    riskReduction: number,
    jobSize: number
): number {
    if (jobSize === 0) return 0
    return Math.round((userBusinessValue + timeCriticality + riskReduction) / jobSize * 100) / 100
}

export function getWSJFScoreColor(score: number): string {
    if (score >= 8) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (score >= 5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (score >= 2) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

export function getWSJFScoreLabel(score: number): string {
    if (score >= 8) return 'Very High Priority'
    if (score >= 5) return 'High Priority'
    if (score >= 2) return 'Medium Priority'
    return 'Low Priority'
}
