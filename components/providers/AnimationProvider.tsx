'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useCursorGlow } from '@/hooks/useAnimations'

// ─── Cursor Dot (brutalist) ───
function CursorDot() {
    useCursorGlow()
    return <div className="cursor-glow" aria-hidden="true" />
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
