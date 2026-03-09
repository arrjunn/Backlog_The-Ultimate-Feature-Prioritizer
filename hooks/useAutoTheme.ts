'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

const MANUAL_KEY = 'fp_theme_manual'

/**
 * Automatically sets dark/light mode based on time of day (6am–6pm light).
 * If the user has manually toggled the theme, auto-theme backs off and respects
 * their choice until they re-enable auto theme in settings.
 */
export function useAutoTheme() {
    const { setTheme } = useTheme()

    useEffect(() => {
        // If user has manually chosen, don't override
        if (typeof window !== 'undefined' && localStorage.getItem(MANUAL_KEY)) return

        const applyTimeTheme = () => {
            // Skip if user manually set theme since we started
            if (localStorage.getItem(MANUAL_KEY)) return
            const hour = new Date().getHours()
            const isDaytime = hour >= 6 && hour < 18
            setTheme(isDaytime ? 'light' : 'dark')
        }

        applyTimeTheme()

        // Re-check every minute
        const interval = setInterval(applyTimeTheme, 60_000)
        return () => clearInterval(interval)
    }, [setTheme])
}

/** Call this when user manually toggles theme */
export function setManualTheme() {
    if (typeof window !== 'undefined') {
        localStorage.setItem(MANUAL_KEY, 'true')
    }
}

/** Call this to re-enable auto theme */
export function clearManualTheme() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(MANUAL_KEY)
    }
}

/**
 * Settings page compat — check if auto theme is active
 * (auto theme is ON by default, OFF when user has manually overridden)
 */
export function getAutoThemeEnabled(): boolean {
    if (typeof window === 'undefined') return true
    return !localStorage.getItem(MANUAL_KEY)
}

/**
 * Settings page compat — enable/disable auto theme
 */
export function setAutoThemeEnabled(enabled: boolean) {
    if (enabled) {
        clearManualTheme()
    } else {
        setManualTheme()
    }
}
