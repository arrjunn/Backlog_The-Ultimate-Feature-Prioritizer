'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SplitText } from '@/components/ui/split-text'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import confetti from 'canvas-confetti'
import {
    useScrollReveal,
    useMagnetic,
    use3DTilt,
    useGlassNav,
} from '@/hooks/useAnimations'

/* ── Scroll-driven parallax for hero & grain ── */
function useHeroParallax(
    heroRef: React.RefObject<HTMLElement>,
    rootRef: React.RefObject<HTMLDivElement>,
) {
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return
        let raf = 0
        const onScroll = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                const y = window.scrollY
                if (heroRef.current) heroRef.current.style.transform = `translateY(${y * 0.12}px)`
                if (rootRef.current) rootRef.current.style.setProperty('--lp-grain-y', `${y * 0.04}px`)
            })
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
    }, [heroRef, rootRef])
}

/* ── Terminal typing animation ── */
function useTerminalTyping(lines: string[], baseDelay = 400, charSpeed = 30) {
    const [displayedLines, setDisplayedLines] = useState<string[]>([])
    const [currentLine, setCurrentLine] = useState('')
    const [lineIndex, setLineIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (lineIndex >= lines.length) {
            setDone(true)
            return
        }

        const line = lines[lineIndex]

        if (charIndex === 0 && lineIndex > 0) {
            // Small pause before starting a new line
            const pause = setTimeout(() => {
                setCharIndex(1)
                setCurrentLine(line.charAt(0))
            }, 150)
            return () => clearTimeout(pause)
        }

        if (charIndex === 0 && lineIndex === 0) {
            // Initial delay
            const init = setTimeout(() => {
                setCharIndex(1)
                setCurrentLine(line.charAt(0))
            }, baseDelay)
            return () => clearTimeout(init)
        }

        if (charIndex < line.length) {
            const speed = line.startsWith('$') ? charSpeed : charSpeed * 0.5
            const timer = setTimeout(() => {
                setCurrentLine(prev => prev + line.charAt(charIndex))
                setCharIndex(prev => prev + 1)
            }, speed)
            return () => clearTimeout(timer)
        }

        // Line complete — push it and move to next
        const finalize = setTimeout(() => {
            setDisplayedLines(prev => [...prev, line])
            setCurrentLine('')
            setCharIndex(0)
            setLineIndex(prev => prev + 1)
        }, 80)
        return () => clearTimeout(finalize)
    }, [lineIndex, charIndex, lines, baseDelay, charSpeed])

    return { displayedLines, currentLine, done }
}

/* ── Framework data ── */
type FrameworkId = 'rice' | 'ice' | 'moscow' | 'jtbd' | 'kano' | 'ie' | 'wsjf'

const FRAMEWORKS: { id: FrameworkId; name: string; abbr: string; tagline: string; formula: string; inputs: { label: string; value: string }[]; resultLabel: string; resultValue: string }[] = [
    {
        id: 'rice', name: 'RICE', abbr: 'RICE',
        tagline: 'Prioritize by data -- not by whoever was loudest in the last meeting.',
        formula: '( R * I * C% ) / E',
        inputs: [
            { label: 'Reach', value: '8' },
            { label: 'Impact', value: '7' },
            { label: 'Confidence', value: '80%' },
            { label: 'Effort', value: '3 wk' },
        ],
        resultLabel: 'RICE Score', resultValue: '18.67',
    },
    {
        id: 'ice', name: 'ICE', abbr: 'ICE',
        tagline: 'Quick, lightweight scoring for fast-moving teams.',
        formula: 'I * C * E',
        inputs: [
            { label: 'Impact', value: '9' },
            { label: 'Confidence', value: '7' },
            { label: 'Ease', value: '6' },
        ],
        resultLabel: 'ICE Score', resultValue: '7.33',
    },
    {
        id: 'moscow', name: 'MoSCoW', abbr: 'MoSCoW',
        tagline: 'Categorize features to align stakeholders on what ships first.',
        formula: 'Must | Should | Could | Won\'t',
        inputs: [
            { label: 'Must Have', value: 'core auth' },
            { label: 'Should Have', value: 'filters' },
            { label: 'Could Have', value: 'dark mode' },
            { label: "Won't Have", value: 'gamification' },
        ],
        resultLabel: 'Priority', resultValue: 'Must Have',
    },
    {
        id: 'jtbd', name: 'JTBD', abbr: 'JTBD',
        tagline: 'Focus on the job the user is trying to get done.',
        formula: 'Importance + (Importance - Satisfaction)',
        inputs: [
            { label: 'Importance', value: '9' },
            { label: 'Satisfaction', value: '3' },
        ],
        resultLabel: 'Opportunity Score', resultValue: '15',
    },
    {
        id: 'kano', name: 'Kano', abbr: 'Kano',
        tagline: 'Find features that delight versus those users just expect.',
        formula: 'Functional vs. Dysfunctional survey',
        inputs: [
            { label: 'Functional', value: 'Like it' },
            { label: 'Dysfunctional', value: 'Tolerate it' },
        ],
        resultLabel: 'Category', resultValue: 'Attractive',
    },
    {
        id: 'ie', name: 'Impact / Effort', abbr: 'I/E',
        tagline: 'Place features into quadrants to spot quick wins at a glance.',
        formula: 'Impact / Effort -> Quadrant',
        inputs: [
            { label: 'Impact', value: '8' },
            { label: 'Effort', value: '2' },
        ],
        resultLabel: 'Quadrant', resultValue: 'Quick Win',
    },
    {
        id: 'wsjf', name: 'WSJF', abbr: 'WSJF',
        tagline: 'Sequence work by economic impact -- the SAFe Agile approach.',
        formula: 'Cost of Delay / Job Size',
        inputs: [
            { label: 'Business Value', value: '8' },
            { label: 'Time Criticality', value: '7' },
            { label: 'Risk Reduction', value: '5' },
            { label: 'Job Size', value: '4' },
        ],
        resultLabel: 'WSJF Score', resultValue: '5.00',
    },
]

/* ── Demo board types & data ── */
type ColumnId = 'now' | 'next' | 'later'

interface DemoCard {
    id: string
    title: string
    votes: number
    rice: number
    column: ColumnId
}

const INITIAL_CARDS: DemoCard[] = [
    { id: 'card-1', title: 'Dark mode support', votes: 24, rice: 18.7, column: 'next' },
    { id: 'card-2', title: 'API webhooks', votes: 18, rice: 15.2, column: 'later' },
    { id: 'card-3', title: 'SSO integration', votes: 31, rice: 22.1, column: 'now' },
    { id: 'card-4', title: 'Mobile app', votes: 42, rice: 12.8, column: 'later' },
    { id: 'card-5', title: 'Export to CSV', votes: 15, rice: 19.4, column: 'next' },
]

const COLUMNS: { id: ColumnId; label: string }[] = [
    { id: 'now', label: 'NOW' },
    { id: 'next', label: 'NEXT' },
    { id: 'later', label: 'LATER' },
]

/* ── Scramble/Typewriter hero word ── */
const DECOY_WORDS = ['sometimes', 'maybe', 'kinda', 'never']
const FINAL_WORD = 'actually'
const SCRAMBLE_CHARS = '!@#$%&*?/\\|<>{}[]~^=+abcdefghxyz0123456789'

function HeroTypewriter() {
    const [display, setDisplay] = useState('')
    const [showCursor, setShowCursor] = useState(false)
    const [resolved, setResolved] = useState(false)
    const cancelled = useRef(false)

    useEffect(() => {
        cancelled.current = false

        const sleep = (ms: number) => new Promise<void>(r => {
            const t = setTimeout(r, ms)
            // Check cancellation periodically isn't needed for setTimeout
            return t
        })

        async function animate() {
            // Wait for page load animations
            await sleep(3000)
            if (cancelled.current) return
            setShowCursor(true)

            // Type and delete each decoy word
            for (const word of DECOY_WORDS) {
                if (cancelled.current) return

                // Type forward
                for (let i = 1; i <= word.length; i++) {
                    if (cancelled.current) return
                    setDisplay(word.slice(0, i))
                    await sleep(70)
                }

                // Pause
                await sleep(500)

                // Delete backward
                for (let i = word.length - 1; i >= 0; i--) {
                    if (cancelled.current) return
                    setDisplay(word.slice(0, i))
                    await sleep(35)
                }

                await sleep(250)
            }

            // Scramble/decode "actually"
            // Phase 1: random chars cycling (slow reveal)
            const totalTicks = 20
            for (let tick = 0; tick <= totalTicks; tick++) {
                if (cancelled.current) return
                const lockedCount = Math.floor((tick / totalTicks) * FINAL_WORD.length)
                let result = ''
                for (let i = 0; i < FINAL_WORD.length; i++) {
                    if (i < lockedCount) {
                        result += FINAL_WORD[i]
                    } else {
                        result += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
                    }
                }
                setDisplay(result)
                await sleep(80)
            }

            // Final resolve
            setDisplay(FINAL_WORD)
            setShowCursor(false)
            setResolved(true)
        }

        animate()
        return () => { cancelled.current = true }
    }, [])

    if (!display && !showCursor) {
        // Invisible placeholder to reserve space
        return <span className="lp-hero-typewriter" style={{ visibility: 'hidden' }}>{FINAL_WORD}</span>
    }

    return (
        <span className={`lp-hero-typewriter ${resolved ? 'lp-hero-typewriter--resolved' : 'lp-hero-typewriter--decoy'}`}>
            {display}
            {showCursor && <span className="lp-hero-cursor" />}
        </span>
    )
}

/* ── Terminal lines for hero ── */
const HERO_LINES = [
    '$ backlog init --team "your-team"',
    '> initializing workspace...',
    '> 7 frameworks loaded',
    '> ready. build what matters.',
]

export default function LandingPage() {
    const [activeFramework, setActiveFramework] = useState<FrameworkId>('rice')
    const fw = FRAMEWORKS.find(f => f.id === activeFramework)!

    const [cards, setCards] = useState<DemoCard[]>(INITIAL_CARDS)
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<ColumnId | null>(null)

    const heroRef = useRef<HTMLElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)

    // Hooks
    useScrollReveal()
    const glassNavRef = useGlassNav()
    useHeroParallax(heroRef, rootRef)
    const formulaCardRef = use3DTilt(10)
    const ctaPrimaryRef = useMagnetic(0.25)
    const ctaPillRef = useMagnetic(0.2)
    const ctaBottomRef = useMagnetic(0.25)

    // Terminal typing
    const { displayedLines, currentLine, done: typingDone } = useTerminalTyping(HERO_LINES, 600, 35)


    // ── Drag and drop handlers ──
    const handleDragStart = useCallback((e: React.DragEvent, cardId: string) => {
        setDraggedId(cardId)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', cardId)
        // Make the drag image slightly transparent
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5'
        }
    }, [])

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        setDraggedId(null)
        setDragOverColumn(null)
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1'
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent, columnId: ColumnId) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverColumn(columnId)
    }, [])

    const handleDragLeave = useCallback(() => {
        setDragOverColumn(null)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent, targetColumn: ColumnId) => {
        e.preventDefault()
        const cardId = e.dataTransfer.getData('text/plain')
        setDragOverColumn(null)
        setDraggedId(null)

        setCards(prev => {
            const card = prev.find(c => c.id === cardId)
            if (!card || card.column === targetColumn) return prev

            const wasNotInNow = card.column !== 'now'

            // Fire confetti when dropping into "now"
            if (targetColumn === 'now' && wasNotInNow) {
                setTimeout(() => {
                    confetti({
                        particleCount: 80,
                        spread: 60,
                        origin: { y: 0.7, x: 0.5 },
                        colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96e6a1'],
                        disableForReducedMotion: true,
                    })
                }, 50)
            }

            return prev.map(c =>
                c.id === cardId ? { ...c, column: targetColumn } : c
            )
        })
    }, [])

    const getColumnCards = (columnId: ColumnId) => cards.filter(c => c.column === columnId)

    return (
        <div className="lp-root" ref={rootRef}>
            {/* Grain texture overlay */}
            <div className="lp-grain" aria-hidden="true" />

            {/* ── Nav ── */}
            <header className="lp-nav" ref={glassNavRef as React.RefObject<HTMLElement>}>
                <Link href="/" className="lp-nav-logo">backlog</Link>
                <nav className="lp-nav-links">
                    <ThemeToggle />
                    <Link href="/login" className="lp-link lp-link--signin">sign in</Link>
                    <Link href="/signup" className="lp-cta-pill" ref={ctaPillRef as React.RefObject<HTMLAnchorElement>}>
                        get started <ArrowRight size={13} strokeWidth={1.8} />
                    </Link>
                </nav>
            </header>

            {/* ── Hero ── */}
            <section className="lp-hero" ref={heroRef}>
                <div className="lp-hero-gradient" aria-hidden="true" />

                {/* Terminal window */}
                <div className="lp-terminal" data-animate="up" data-delay="0">
                    <div className="lp-terminal-bar">
                        <span className="lp-terminal-dot" style={{ background: '#ff5f57' }} />
                        <span className="lp-terminal-dot" style={{ background: '#febc2e' }} />
                        <span className="lp-terminal-dot" style={{ background: '#28c840' }} />
                        <span className="lp-terminal-title">backlog</span>
                    </div>
                    <div className="lp-terminal-body">
                        {displayedLines.map((line, i) => (
                            <div key={i} className={`lp-terminal-line ${line.startsWith('$') ? 'lp-terminal-cmd' : 'lp-terminal-output'}`}>
                                {line}
                            </div>
                        ))}
                        {currentLine && (
                            <div className={`lp-terminal-line ${currentLine.startsWith('$') ? 'lp-terminal-cmd' : 'lp-terminal-output'}`}>
                                {currentLine}
                                <span className="lp-cursor" />
                            </div>
                        )}
                        {!currentLine && !typingDone && displayedLines.length === 0 && (
                            <div className="lp-terminal-line lp-terminal-cmd">
                                <span className="lp-cursor" />
                            </div>
                        )}
                        {typingDone && (
                            <div className="lp-terminal-line lp-terminal-cmd">
                                $ <span className="lp-cursor" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Tagline */}
                <h1 className="lp-hero-heading">
                    <SplitText text="build what" mode="word" stagger={90} delay={2800} />
                    <br />
                    <HeroTypewriter />
                    <br />
                    <SplitText text="matters." mode="word" stagger={80} delay={3800} />
                </h1>

                <p className="lp-hero-sub" data-animate="up" data-delay="400">
                    quiet the noise. score every request with the right framework.
                    <br className="lp-br" />
                    ship what your users have been waiting for.
                </p>

                <div className="lp-hero-cta" data-animate="up" data-delay="600">
                    <Link href="/signup" className="lp-cta-primary" ref={ctaPrimaryRef as React.RefObject<HTMLAnchorElement>}>
                        start for free <ArrowRight size={16} strokeWidth={1.8} />
                    </Link>
                    <span className="lp-cta-note">no credit card. free for small teams.</span>
                </div>
            </section>

            {/* ── ASCII divider ── */}
            <div className="lp-ascii-divider" data-animate="scale">
                - - - - - - - - - - - - - - - - - - - - - - - -
            </div>

            {/* ── Interactive Demo Board ── */}
            <section className="lp-section" data-animate="up" data-delay="100">
                <div className="lp-terminal-header">
                    <span className="lp-terminal-cmd" style={{ fontSize: '0.85rem', color: 'var(--lp-muted)' }}>
                        $ backlog board --demo
                    </span>
                </div>

                <div className="lp-board">
                    {COLUMNS.map(col => {
                        const colCards = getColumnCards(col.id)
                        const isOver = dragOverColumn === col.id
                        return (
                            <div
                                key={col.id}
                                className={`lp-board-column ${isOver ? 'lp-board-column--over' : ''}`}
                                onDragOver={(e) => handleDragOver(e, col.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className="lp-board-column-header">
                                    <span className="lp-board-column-label">{col.label}</span>
                                    <span className="lp-board-column-count">[{colCards.length}]</span>
                                </div>
                                <div className="lp-board-column-cards">
                                    {colCards.map(card => (
                                        <div
                                            key={card.id}
                                            className={`lp-board-card ${draggedId === card.id ? 'lp-board-card--dragging' : ''}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, card.id)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div className="lp-board-card-title">{card.title}</div>
                                            <div className="lp-board-card-meta">
                                                <span className="lp-board-card-votes">{card.votes} votes</span>
                                                <span className="lp-board-card-score">RICE {card.rice}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {colCards.length === 0 && (
                                        <div className="lp-board-empty">drop here</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <p className="lp-board-hint">drag cards between columns</p>
            </section>

            {/* ── ASCII divider ── */}
            <div className="lp-ascii-divider" data-animate="scale">
                - - - - - - - - - - - - - - - - - - - - - - - -
            </div>

            {/* ── Framework Picker ── */}
            <section className="lp-section lp-rice-section">
                <div className="lp-rice-left" data-animate="left">
                    <p className="lp-section-label">the frameworks</p>
                    <h2 className="lp-section-heading">7 ways to prioritize</h2>
                    <p className="lp-body" style={{ fontSize: '0.85rem' }}>
                        every team thinks differently. pick the framework that fits your process --
                        or layer multiple frameworks for a richer picture.
                    </p>
                    <ul style={{ listStyle: 'none', margin: '1.5rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        {FRAMEWORKS.map((f) => {
                            const active = activeFramework === f.id
                            return (
                                <li key={f.id}>
                                    <button
                                        onClick={() => setActiveFramework(f.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.85rem',
                                            width: '100%', textAlign: 'left',
                                            padding: '0.55rem 0.85rem',
                                            border: active ? '1px solid var(--lp-border)' : '1px solid transparent',
                                            background: active ? 'var(--lp-border)' : 'transparent',
                                            cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                                            borderRadius: '2px',
                                        }}
                                    >
                                        <span className="lp-rice-letter" style={{ fontSize: '0.52rem', width: '2.6rem', textAlign: 'center', letterSpacing: '0.1em', flexShrink: 0, opacity: active ? 1 : 0.5 }}>
                                            {f.abbr}
                                        </span>
                                        <span className="lp-rice-label" style={{ color: active ? 'var(--lp-text)' : 'var(--lp-muted)', fontWeight: active ? 500 : 400 }}>
                                            {f.name}
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </div>

                <div className="lp-rice-right" data-animate="right" data-delay="120">
                    <div className="lp-formula-card card-3d lp-terminal-card" key={activeFramework} ref={formulaCardRef}>
                        <div className="lp-terminal-bar" style={{ marginBottom: '1rem' }}>
                            <span className="lp-terminal-dot" style={{ background: '#ff5f57' }} />
                            <span className="lp-terminal-dot" style={{ background: '#febc2e' }} />
                            <span className="lp-terminal-dot" style={{ background: '#28c840' }} />
                        </div>
                        <p className="lp-terminal-cmd" style={{ fontSize: '0.8rem', marginBottom: '0.75rem', color: 'var(--lp-muted)' }}>
                            $ backlog score --framework {fw.id}
                        </p>
                        <div className="lp-formula-divider" />
                        <div className="lp-formula-example">
                            {fw.inputs.map((inp) => (
                                <div key={inp.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="lp-ex-label">&gt; {inp.label}:</span>
                                    <span className="lp-ex-val">{inp.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="lp-formula-divider" />
                        <div className="lp-formula-result">
                            <span>&gt; {fw.resultLabel}</span>
                            <span className="lp-score-badge">
                                {fw.resultValue}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ASCII divider ── */}
            <div className="lp-ascii-divider" data-animate="scale">
                - - - - - - - - - - - - - - - - - - - - - - - -
            </div>

            {/* ── How It Works ── */}
            <section className="lp-section">
                <p className="lp-section-label" data-animate="up">how it works</p>
                <div className="lp-steps">
                    {[
                        { cmd: '$ backlog collect', arrow: '->', desc: 'gather requests from everywhere', delay: '0' },
                        { cmd: '$ backlog score', arrow: '->', desc: 'apply 7 frameworks automatically', delay: '120' },
                        { cmd: '$ backlog ship', arrow: '->', desc: 'drag to Now. celebrate. repeat.', delay: '240' },
                    ].map((step, i) => (
                        <div
                            key={i}
                            className="lp-step"
                            data-animate="up"
                            data-delay={step.delay}
                        >
                            <span className="lp-step-cmd">{step.cmd}</span>
                            <span className="lp-step-arrow">{step.arrow}</span>
                            <span className="lp-step-desc">{step.desc}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="lp-cta-section">
                <div className="lp-terminal lp-terminal-cta" data-animate="up">
                    <div className="lp-terminal-bar">
                        <span className="lp-terminal-dot" style={{ background: '#ff5f57' }} />
                        <span className="lp-terminal-dot" style={{ background: '#febc2e' }} />
                        <span className="lp-terminal-dot" style={{ background: '#28c840' }} />
                    </div>
                    <div className="lp-terminal-body">
                        <div className="lp-terminal-line lp-terminal-cmd">
                            $ backlog signup --free<span className="lp-cursor" />
                        </div>
                    </div>
                </div>

                <Link href="/signup" className="lp-cta-primary" data-animate="up" data-delay="200" ref={ctaBottomRef as React.RefObject<HTMLAnchorElement>}>
                    get started free <ArrowRight size={16} strokeWidth={1.8} />
                </Link>
                <p className="lp-cta-body" data-animate="up" data-delay="80">
                    join product teams who ship the right things.
                </p>
            </section>

            {/* ── Creator ── */}
            <section className="lp-creator" data-animate="up">
                <pre className="lp-creator-ascii">{`
    ╭─────────────────────────╮
    │  $ whoami               │
    │  → arjun varshney       │
    │  $ cat role.txt         │
    │  → built this thing     │
    ╰─────────────────────────╯
                `}</pre>
                <div className="lp-creator-info">
                    <p className="lp-creator-label">crafted by</p>
                    <p className="lp-creator-name">Arjun Varshney</p>
                    <nav className="lp-creator-links">
                        <a href="https://github.com/arrjunn" target="_blank" rel="noopener noreferrer" className="lp-creator-link">github</a>
                        <a href="https://www.linkedin.com/in/arjun-varshney-/" target="_blank" rel="noopener noreferrer" className="lp-creator-link">linkedin</a>
                        <a href="https://determined-burst-7ca.notion.site/Personal-Portfolio-021b6fec0d0049819cf42ecdd8126de4" target="_blank" rel="noopener noreferrer" className="lp-creator-link">portfolio</a>
                    </nav>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="lp-footer">
                <span className="lp-footer-logo">backlog</span>
                <span className="lp-footer-copy">&copy; 2026 &middot; built by <a href="https://github.com/arrjunn" target="_blank" rel="noopener noreferrer" className="lp-footer-link" style={{ display: 'inline', margin: 0 }}>arjun varshney</a></span>
                <nav className="lp-footer-nav">
                    <Link href="/login" className="lp-footer-link">sign in</Link>
                    <Link href="/signup" className="lp-footer-link">sign up</Link>
                    <a href="https://www.linkedin.com/in/arjun-varshney-/" target="_blank" rel="noopener noreferrer" className="lp-footer-link">contact</a>
                </nav>
            </footer>

        </div>
    )
}
