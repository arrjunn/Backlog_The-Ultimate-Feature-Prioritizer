/**
 * Get initials from a name string (e.g. "John Doe" -> "JD")
 */
export function getInitials(name: string | null): string {
    if (!name) return '?'
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

/**
 * Escape HTML entities to prevent XSS in email templates / rendered HTML.
 */
export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

/**
 * Safely extract an error message from an unknown catch value.
 */
export function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message
    if (typeof err === 'string') return err
    if (err && typeof err === 'object' && 'message' in err) {
        return String((err as { message: unknown }).message)
    }
    return 'Unknown error'
}
