'use client'

import { useEffect, useRef, useState } from 'react'

interface SplitTextProps {
    text: string
    className?: string
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
    mode?: 'word' | 'letter'
    stagger?: number
    delay?: number
    /** If true, waits for element to scroll into view before animating */
    scrollTriggered?: boolean
    children?: React.ReactNode
}

export function SplitText({
    text,
    className = '',
    as: Tag = 'span',
    mode = 'word',
    stagger = 80,
    delay = 0,
    scrollTriggered = false,
    children,
}: SplitTextProps) {
    const ref = useRef<HTMLElement>(null)
    const [play, setPlay] = useState(!scrollTriggered) // play immediately unless scroll-triggered

    useEffect(() => {
        if (!scrollTriggered) return // already playing
        const el = ref.current
        if (!el) return

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) { setPlay(true); return }

        // Check if already in viewport
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            setPlay(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setPlay(true)
                    observer.unobserve(el)
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(el)

        // Fallback
        const fallback = setTimeout(() => setPlay(true), 4000)
        return () => { observer.disconnect(); clearTimeout(fallback) }
    }, [scrollTriggered])

    const units = mode === 'word' ? text.split(' ') : text.split('')

    return (
        <Tag
            ref={ref as any}
            className={`split-text ${className}`}
            aria-label={text}
            style={{ display: 'inline-block' }}
        >
            {units.map((unit, i) => (
                <span
                    key={`${unit}-${i}`}
                    className={`split-text__unit ${play ? 'split-text__unit--play' : ''}`}
                    style={{
                        animationDelay: `${delay + i * stagger}ms`,
                        display: 'inline-block',
                    }}
                    aria-hidden="true"
                >
                    {unit}{mode === 'word' ? '\u00A0' : ''}
                </span>
            ))}
            {children}
        </Tag>
    )
}
