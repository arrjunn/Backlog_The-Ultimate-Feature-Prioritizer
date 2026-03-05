'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

interface ThemeToggleProps {
    /** CSS class for the wrapper button */
    className?: string
    /** Show label text next to icon */
    showLabel?: boolean
    /** Icon size in px */
    size?: number
}

export function ThemeToggle({ className = '', showLabel = false, size = 15 }: ThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) {
        // Placeholder to avoid layout shift
        return (
            <button className={`theme-toggle ${className}`} aria-label="Toggle theme" style={{ width: size + 17, height: size + 17 }}>
                <span style={{ width: size, height: size, display: 'block' }} />
            </button>
        )
    }

    const isDark = resolvedTheme === 'dark'

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`theme-toggle ${className}`}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
        >
            {isDark ? <Sun size={size} /> : <Moon size={size} />}
            {showLabel && <span className="theme-toggle__label">{isDark ? 'Light mode' : 'Dark mode'}</span>}
        </button>
    )
}
