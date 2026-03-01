import type { KanoCategory, KanoResponse } from '@/types/frameworks.types'

// Full Kano evaluation matrix
const KANO_MATRIX: Record<KanoResponse, Record<KanoResponse, KanoCategory>> = {
    like: {
        dislike: 'one_dimensional',
        tolerate: 'attractive',
        neutral: 'attractive',
        expect: 'attractive',
        like: 'questionable',
    },
    expect: {
        dislike: 'must_be',
        tolerate: 'indifferent',
        neutral: 'indifferent',
        expect: 'indifferent',
        like: 'reverse',
    },
    neutral: {
        dislike: 'must_be',
        tolerate: 'indifferent',
        neutral: 'indifferent',
        expect: 'indifferent',
        like: 'reverse',
    },
    tolerate: {
        dislike: 'must_be',
        tolerate: 'indifferent',
        neutral: 'indifferent',
        expect: 'indifferent',
        like: 'reverse',
    },
    dislike: {
        dislike: 'reverse',
        tolerate: 'reverse',
        neutral: 'reverse',
        expect: 'reverse',
        like: 'reverse',
    },
}

export function getKanoCategory(functional: KanoResponse, dysfunctional: KanoResponse): KanoCategory {
    return KANO_MATRIX[functional][dysfunctional]
}

export function getKanoScore(category: KanoCategory): number {
    const scores: Record<KanoCategory, number> = {
        attractive: 10,
        one_dimensional: 7,
        must_be: 5,
        indifferent: 2,
        reverse: 0,
        questionable: 1,
    }
    return scores[category]
}

export function getKanoCategoryLabel(category: KanoCategory): string {
    const labels: Record<KanoCategory, string> = {
        attractive: 'Attractive',
        one_dimensional: 'One-Dimensional',
        must_be: 'Must-Be',
        indifferent: 'Indifferent',
        reverse: 'Reverse',
        questionable: 'Questionable',
    }
    return labels[category]
}

export function getKanoCategoryColor(category: KanoCategory): string {
    const colors: Record<KanoCategory, string> = {
        attractive: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        one_dimensional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        must_be: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        indifferent: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        reverse: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        questionable: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    }
    return colors[category]
}

export function getKanoCategoryDescription(category: KanoCategory): string {
    const descriptions: Record<KanoCategory, string> = {
        attractive: 'Delights users if present, but not expected. A differentiator.',
        one_dimensional: 'More is better — satisfaction scales linearly with this feature.',
        must_be: 'Expected by users. Its absence causes dissatisfaction.',
        indifferent: 'Users don\'t care either way. Low priority.',
        reverse: 'Users are happier without this feature. Reconsider building it.',
        questionable: 'Contradictory responses — re-survey users for clarity.',
    }
    return descriptions[category]
}
