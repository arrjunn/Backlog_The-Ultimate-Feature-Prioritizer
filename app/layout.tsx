import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from 'sonner'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
    style: ['normal', 'italic'],
})

export const metadata: Metadata = {
    title: 'Backlog — Prioritize What Matters',
    description:
        'A production-quality feature request prioritization tool with RICE scoring, team voting, kanban board, and real-time collaboration.',
    keywords: ['feature prioritization', 'RICE scoring', 'product management', 'roadmap'],
    openGraph: {
        title: 'Backlog — Prioritize What Matters',
        description: 'Prioritize features with RICE scoring, team voting, and kanban boards.',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${playfair.variable} ${inter.className}`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <QueryProvider>
                        {children}
                        <Toaster
                            position="bottom-right"
                            toastOptions={{
                                classNames: {
                                    toast: 'bg-card border border-border text-foreground shadow-lg',
                                    description: 'text-muted-foreground',
                                    actionButton: 'bg-primary text-primary-foreground',
                                    cancelButton: 'bg-muted text-muted-foreground',
                                    error: 'bg-destructive text-destructive-foreground border-destructive',
                                    success: '!bg-green-50 dark:!bg-green-900/20 !border-green-200 dark:!border-green-800',
                                },
                            }}
                        />
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
