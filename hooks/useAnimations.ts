'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// ─── Preflight check ───
function prefersReduced() {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ═══════════════════════════════════════════════════════════════
// 1. SCROLL REVEAL — dramatic multi-directional entrance
// ═══════════════════════════════════════════════════════════════
type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'clip' | 'flip'

const REVEAL_TRANSFORMS: Record<RevealDirection, string> = {
    up: 'translateY(80px)',
    down: 'translateY(-80px)',
    left: 'translateX(-100px)',
    right: 'translateX(100px)',
    scale: 'scale(0.85)',
    clip: 'translateY(0)',
    flip: 'perspective(1200px) rotateX(25deg)',
}

const REVEAL_CLIP: Record<string, string> = {
    clip: 'inset(100% 0 0 0)',
}

export function useScrollReveal() {
    useEffect(() => {
        if (prefersReduced()) {
            document.querySelectorAll('[data-animate]').forEach((el) => {
                const h = el as HTMLElement
                h.style.opacity = '1'
                h.style.transform = 'none'
                h.style.clipPath = 'none'
            })
            return
        }

        // Set initial state
        document.querySelectorAll('[data-animate]').forEach((el) => {
            const h = el as HTMLElement
            const dir = (h.dataset.animate || 'up') as RevealDirection
            h.style.opacity = dir === 'clip' ? '1' : '0'
            h.style.transform = REVEAL_TRANSFORMS[dir] || REVEAL_TRANSFORMS.up
            h.style.transition = 'none'
            if (dir === 'clip') {
                h.style.clipPath = 'inset(100% 0 0 0)'
            }
        })

        // Force layout
        void document.body.offsetHeight

        // Enable transitions
        document.querySelectorAll('[data-animate]').forEach((el) => {
            const h = el as HTMLElement
            const dur = h.dataset.duration || '800'
            const dir = (h.dataset.animate || 'up') as RevealDirection
            h.style.transition = dir === 'clip'
                ? `clip-path ${dur}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : `opacity ${dur}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${dur}ms cubic-bezier(0.22, 1, 0.36, 1)`
        })

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target as HTMLElement
                        const delay = Number(el.dataset.delay || 0)
                        const dir = (el.dataset.animate || 'up') as RevealDirection
                        setTimeout(() => {
                            if (dir === 'clip') {
                                el.style.clipPath = 'inset(0 0 0 0)'
                            } else {
                                el.style.opacity = '1'
                                el.style.transform = dir === 'flip' ? 'perspective(1200px) rotateX(0deg)' : 'translate(0) scale(1)'
                            }
                        }, delay)
                        observer.unobserve(el)
                    }
                })
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        )

        document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el))
        return () => observer.disconnect()
    }, [])
}

// ═══════════════════════════════════════════════════════════════
// 2. CURSOR GLOW — radial gradient that follows the mouse
// ═══════════════════════════════════════════════════════════════
export function useCursorGlow() {
    useEffect(() => {
        if (prefersReduced()) return
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
}

// ═══════════════════════════════════════════════════════════════
// 3. MAGNETIC BUTTON — pulls toward cursor on hover
// ═══════════════════════════════════════════════════════════════
export function useMagnetic(strength = 0.35) {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el || prefersReduced()) return

        const onMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const dx = (e.clientX - cx) * strength
            const dy = (e.clientY - cy) * strength
            el.style.transform = `translate(${dx}px, ${dy}px)`
        }

        const onLeave = () => {
            el.style.transform = 'translate(0, 0)'
            el.style.transition = 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)'
        }

        const onEnter = () => {
            el.style.transition = 'transform 100ms linear'
        }

        el.addEventListener('mousemove', onMove)
        el.addEventListener('mouseleave', onLeave)
        el.addEventListener('mouseenter', onEnter)

        return () => {
            el.removeEventListener('mousemove', onMove)
            el.removeEventListener('mouseleave', onLeave)
            el.removeEventListener('mouseenter', onEnter)
        }
    }, [strength])

    return ref
}

// ═══════════════════════════════════════════════════════════════
// 4. 3D TILT — perspective tilt on hover for cards
// ═══════════════════════════════════════════════════════════════
export function use3DTilt(maxTilt = 12) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el || prefersReduced()) return

        const onMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width - 0.5
            const y = (e.clientY - rect.top) / rect.height - 0.5
            const rotateX = -y * maxTilt
            const rotateY = x * maxTilt
            el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
            // Dynamic shadow
            const shadowX = -x * 20
            const shadowY = -y * 20
            el.style.boxShadow = `${shadowX}px ${shadowY}px 40px rgba(0, 0, 0, 0.12), 0 0 60px rgba(0, 0, 0, 0.04)`
            // Inner glow via custom property
            el.style.setProperty('--tilt-x', `${(x + 0.5) * 100}%`)
            el.style.setProperty('--tilt-y', `${(y + 0.5) * 100}%`)
        }

        const onLeave = () => {
            el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
            el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'
            el.style.transition = 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 500ms ease'
        }

        const onEnter = () => {
            el.style.transition = 'transform 100ms linear, box-shadow 100ms linear'
        }

        el.addEventListener('mousemove', onMove)
        el.addEventListener('mouseleave', onLeave)
        el.addEventListener('mouseenter', onEnter)

        return () => {
            el.removeEventListener('mousemove', onMove)
            el.removeEventListener('mouseleave', onLeave)
            el.removeEventListener('mouseenter', onEnter)
        }
    }, [maxTilt])

    return ref
}

// ═══════════════════════════════════════════════════════════════
// 5. COUNT UP — animate numbers when they enter viewport
// ═══════════════════════════════════════════════════════════════
export function useCountUp(end: number, duration = 2000) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLElement>(null)
    const started = useRef(false)

    useEffect(() => {
        const el = ref.current
        if (!el || prefersReduced()) {
            setCount(end)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    const start = performance.now()
                    const animate = (now: number) => {
                        const progress = Math.min((now - start) / duration, 1)
                        const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
                        setCount(Math.round(eased * end))
                        if (progress < 1) requestAnimationFrame(animate)
                    }
                    requestAnimationFrame(animate)
                    observer.unobserve(el)
                }
            },
            { threshold: 0.3 }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [end, duration])

    return { count, ref }
}

// ═══════════════════════════════════════════════════════════════
// 6. RIPPLE — liquid ripple effect on click
// ═══════════════════════════════════════════════════════════════
export function useRipple() {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el || prefersReduced()) return

        const onClick = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const ripple = document.createElement('span')
            const size = Math.max(rect.width, rect.height) * 2.5
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x - size / 2}px;
                top: ${y - size / 2}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%);
                transform: scale(0);
                animation: ripple-expand 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
                pointer-events: none;
                z-index: 0;
            `
            el.style.position = 'relative'
            el.style.overflow = 'hidden'
            el.appendChild(ripple)
            setTimeout(() => ripple.remove(), 650)
        }

        el.addEventListener('click', onClick)
        return () => el.removeEventListener('click', onClick)
    }, [])

    return ref
}

// ═══════════════════════════════════════════════════════════════
// 7. STAGGER CHILDREN — auto-stagger children on scroll
// ═══════════════════════════════════════════════════════════════
export function useStaggerChildren(staggerMs = 80) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = ref.current
        if (!container || prefersReduced()) return

        const children = Array.from(container.children) as HTMLElement[]
        children.forEach((child, i) => {
            child.style.opacity = '0'
            child.style.transform = 'translateY(40px) scale(0.95)'
            child.style.transition = `opacity 600ms cubic-bezier(0.22, 1, 0.36, 1) ${i * staggerMs}ms, transform 600ms cubic-bezier(0.22, 1, 0.36, 1) ${i * staggerMs}ms`
        })

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    children.forEach((child) => {
                        child.style.opacity = '1'
                        child.style.transform = 'translateY(0) scale(1)'
                    })
                    observer.unobserve(container)
                }
            },
            { threshold: 0.1 }
        )

        observer.observe(container)
        return () => observer.disconnect()
    }, [staggerMs])

    return ref
}

// ═══════════════════════════════════════════════════════════════
// 8. PARALLAX SCROLL — multi-speed parallax layers
// ═══════════════════════════════════════════════════════════════
export function useParallaxScroll(speed = 0.15) {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el || prefersReduced()) return

        let raf = 0
        const onScroll = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect()
                const vh = window.innerHeight
                const centered = rect.top - vh / 2
                el.style.transform = `translateY(${centered * speed}px)`
            })
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll() // initial
        return () => {
            window.removeEventListener('scroll', onScroll)
            cancelAnimationFrame(raf)
        }
    }, [speed])

    return ref
}

// ═══════════════════════════════════════════════════════════════
// 9. GLASSMORPHISM NAV — shrink + blur on scroll
// ═══════════════════════════════════════════════════════════════
export function useGlassNav() {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const onScroll = () => {
            const scrolled = window.scrollY > 30
            el.classList.toggle('nav--glass-scrolled', scrolled)
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return ref
}

// ═══════════════════════════════════════════════════════════════
// 10. PAGE ENTRANCE — dramatic page load animation
// ═══════════════════════════════════════════════════════════════
export function usePageEntrance() {
    useEffect(() => {
        if (prefersReduced()) return
        document.body.classList.add('page-entering')
        const timer = setTimeout(() => {
            document.body.classList.remove('page-entering')
            document.body.classList.add('page-entered')
        }, 50)
        return () => clearTimeout(timer)
    }, [])
}
