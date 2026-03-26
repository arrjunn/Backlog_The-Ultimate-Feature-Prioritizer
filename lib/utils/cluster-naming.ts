/**
 * Auto-generate cluster names from request titles using keyword frequency.
 * No LLM required — pure string analysis.
 */

const STOP_WORDS = new Set([
    // Common English
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'must',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
    'they', 'them', 'their', 'this', 'that', 'these', 'those',
    'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
    'for', 'from', 'to', 'of', 'in', 'on', 'at', 'by', 'with', 'about',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'up', 'down',
    'then', 'than', 'when', 'where', 'how', 'what', 'which', 'who',
    'all', 'each', 'every', 'any', 'some', 'no', 'more', 'most', 'other',
    'also', 'just', 'very', 'too', 'only', 'even', 'still',
    'if', 'as', 'like', 'etc', 'per',
    // PM / feature-request specific
    'add', 'support', 'feature', 'request', 'new', 'make', 'allow',
    'enable', 'implement', 'create', 'update', 'ability', 'option',
    'way', 'able', 'want', 'please', 'get', 'set', 'use', 'using',
    'let', 'show', 'see', 'change', 'improve',
])

function titleCase(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1)
}

/** Extract a human-readable name from a set of titles */
export function generateClusterName(titles: string[], fallbackIndex: number): string {
    const freq = new Map<string, number>()

    for (const title of titles) {
        const words = title.toLowerCase().split(/[^a-z0-9]+/)
        // Use a set per title to avoid one title dominating
        const unique = Array.from(new Set(words))
        for (const word of unique) {
            if (word.length < 3 || STOP_WORDS.has(word)) continue
            freq.set(word, (freq.get(word) || 0) + 1)
        }
    }

    const sorted = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word)

    if (sorted.length < 2) {
        return `Cluster ${fallbackIndex + 1}`
    }

    const top = sorted.slice(0, 3).map(titleCase)
    return top.join(' & ')
}

/** Deduplicate cluster names by appending suffix */
export function deduplicateNames(names: string[]): string[] {
    const counts = new Map<string, number>()
    return names.map((name) => {
        const count = counts.get(name) || 0
        counts.set(name, count + 1)
        return count > 0 ? `${name} (${count + 1})` : name
    })
}
