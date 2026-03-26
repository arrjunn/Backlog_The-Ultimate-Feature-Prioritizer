'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Unhandled error:', error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground max-w-md">
                An unexpected error occurred. Please try again or refresh the page.
            </p>
            <button
                onClick={reset}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                Try again
            </button>
        </div>
    )
}
