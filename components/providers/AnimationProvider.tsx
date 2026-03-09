'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useAutoTheme } from '@/hooks/useAutoTheme'

// ─── Cursor Dot (brutalist) ───
function CursorDot() {
    const dotRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = dotRef.current
        if (!el) return
        if (typeof window === 'undefined') return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const root = document.documentElement
        let raf = 0
        let mx = 0, my = 0
        let cx = 0, cy = 0

        const onMove = (e: MouseEvent) => {
            mx = e.clientX
            my = e.clientY
        }

        const loop = () => {
            cx += (mx - cx) * 0.35
            cy += (my - cy) * 0.35
            // Move the dot element directly for reliable rendering
            el.style.transform = `translate(${cx - 8}px, ${cy - 8}px)`
            // Also set CSS vars for the card glow effect
            root.style.setProperty('--cursor-x', `${cx}px`)
            root.style.setProperty('--cursor-y', `${cy}px`)
            raf = requestAnimationFrame(loop)
        }

        window.addEventListener('mousemove', onMove, { passive: true })
        raf = requestAnimationFrame(loop)

        return () => {
            window.removeEventListener('mousemove', onMove)
            cancelAnimationFrame(raf)
        }
    }, [])

    return <div ref={dotRef} className="cursor-glow" aria-hidden="true" />
}

// ─── Page Transition Wrapper ───
function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const [displayChildren, setDisplayChildren] = useState(children)
    const [transitioning, setTransitioning] = useState(false)
    const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle')
    const prevPathname = useRef(pathname)
    const isFirst = useRef(true)

    useEffect(() => {
        // Skip transition on first mount
        if (isFirst.current) {
            isFirst.current = false
            return
        }

        if (pathname !== prevPathname.current) {
            prevPathname.current = pathname
            setTransitioning(true)
            setPhase('exit')

            // After exit animation, swap content and enter
            const exitTimer = setTimeout(() => {
                setDisplayChildren(children)
                setPhase('enter')

                const enterTimer = setTimeout(() => {
                    setPhase('idle')
                    setTransitioning(false)
                }, 500)

                return () => clearTimeout(enterTimer)
            }, 350)

            return () => clearTimeout(exitTimer)
        } else {
            // Same pathname, just update children
            setDisplayChildren(children)
        }
    }, [pathname, children])

    return (
        <>
            {/* Transition curtain overlay */}
            <div
                className={`page-curtain ${phase === 'exit' ? 'page-curtain--active' : ''} ${phase === 'enter' ? 'page-curtain--exit' : ''}`}
                aria-hidden="true"
            />
            <div
                className={`page-content ${phase === 'exit' ? 'page-content--exit' : ''} ${phase === 'enter' ? 'page-content--enter' : ''}`}
            >
                {displayChildren}
            </div>
        </>
    )
}

// ─── Main Provider ───
export function AnimationProvider({ children }: { children: ReactNode }) {
    const [isMobile, setIsMobile] = useState(false)
    useAutoTheme()

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)')
        setIsMobile(mq.matches)
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])

    return (
        <>
            {/* Cursor dot only on desktop */}
            {!isMobile && <CursorDot />}
            <PageTransition>{children}</PageTransition>
        </>
    )
}
