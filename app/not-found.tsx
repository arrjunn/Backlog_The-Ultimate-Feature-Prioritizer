import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="mb-6 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                    <span className="text-lg font-bold text-white">P</span>
                </div>
                <span className="text-lg font-semibold tracking-tight text-violet-400">Backlog</span>
            </div>
            <h1 className="mb-2 text-6xl font-bold tracking-tighter text-foreground">404</h1>
            <p className="mb-8 text-muted-foreground">This page doesn&apos;t exist or has been moved.</p>
            <Link
                href="/dashboard"
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
                Back to Dashboard
            </Link>
        </div>
    )
}
