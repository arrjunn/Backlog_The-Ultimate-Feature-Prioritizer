export function calculateJTBDScore(importance: number, satisfaction: number): number {
    return importance + Math.max(importance - satisfaction, 0)
}

export function getJTBDOpportunityLabel(score: number): string {
    if (score >= 15) return 'Critical Gap'
    if (score >= 10) return 'High Opportunity'
    if (score >= 5) return 'Moderate'
    return 'Low Opportunity'
}

export function getJTBDColor(score: number): string {
    if (score >= 15) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    if (score >= 10) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    if (score >= 5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

export function formatJobStatement(
    situation: string,
    motivation: string,
    outcome: string
): string {
    return `When ${situation}, I want to ${motivation}, so I can ${outcome}.`
}
