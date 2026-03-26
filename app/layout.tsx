import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AnimationProvider } from '@/components/providers/AnimationProvider'
import { Toaster } from 'sonner'
import { ToastDismissOnClick } from '@/components/providers/ToastDismiss'

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-space-grotesk',
    display: 'swap',
})

const spaceMono = Space_Mono({
    subsets: ['latin'],
    variable: '--font-space-mono',
    display: 'swap',
    weight: ['400', '700'],
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
            <body className={`${spaceGrotesk.variable} ${spaceMono.variable} ${playfair.variable} ${spaceGrotesk.className}`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <QueryProvider>
                        <AnimationProvider>
                            {children}
                        </AnimationProvider>
                        <Toaster
                            position="bottom-right"
                            closeButton
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
                        <ToastDismissOnClick />
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
