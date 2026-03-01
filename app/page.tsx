'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Minimal scroll-reveal hook
function useReveal() {
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) {
            document.querySelectorAll('[data-reveal]').forEach((el) => {
                (el as HTMLElement).style.opacity = '1'
                    ; (el as HTMLElement).style.transform = 'none'
            })
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, i) => {
                    if (entry.isIntersecting) {
                        const el = entry.target as HTMLElement
                        const delay = Number(el.dataset.delay || 0)
                        setTimeout(() => {
                            el.style.opacity = '1'
                            el.style.transform = 'translateY(0)'
                        }, delay)
                        observer.unobserve(el)
                    }
                })
            },
            { threshold: 0.12 }
        )

        document.querySelectorAll('[data-reveal]').forEach((el) => {
            observer.observe(el)
        })

        return () => observer.disconnect()
    }, [])
}

type FrameworkId = 'rice' | 'ice' | 'moscow' | 'jtbd' | 'kano' | 'ie' | 'wsjf'

const FRAMEWORKS: { id: FrameworkId; name: string; abbr: string; tagline: string; formula: string; inputs: { label: string; value: string }[]; resultLabel: string; resultValue: string }[] = [
    {
        id: 'rice', name: 'RICE', abbr: 'RICE',
        tagline: 'Prioritize by data — not by whoever was loudest in the last meeting.',
        formula: '( R × I × C% ) ÷ E',
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
        formula: 'I × C × E',
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
        formula: 'Must · Should · Could · Won\'t',
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
        formula: 'Importance + (Importance − Satisfaction)',
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
        formula: 'Impact ÷ Effort → Quadrant',
        inputs: [
            { label: 'Impact', value: '8' },
            { label: 'Effort', value: '2' },
        ],
        resultLabel: 'Quadrant', resultValue: 'Quick Win 🚀',
    },
    {
        id: 'wsjf', name: 'WSJF', abbr: 'WSJF',
        tagline: 'Sequence work by economic impact — the SAFe Agile approach.',
        formula: 'Cost of Delay ÷ Job Size',
        inputs: [
            { label: 'Business Value', value: '8' },
            { label: 'Time Criticality', value: '7' },
            { label: 'Risk Reduction', value: '5' },
            { label: 'Job Size', value: '4' },
        ],
        resultLabel: 'WSJF Score', resultValue: '5.00',
    },
]

export default function LandingPage() {
    useReveal()
    const [activeFramework, setActiveFramework] = useState<FrameworkId>('rice')
    const fw = FRAMEWORKS.find(f => f.id === activeFramework)!

    return (
        <div className="lp-root">
            {/* Grain texture overlay */}
            <div className="lp-grain" aria-hidden="true" />

            {/* Nav */}
            <header className="lp-nav">
                <Link href="/" className="lp-nav-logo">
                    backlog
                </Link>
                <nav className="lp-nav-links">
                    <Link href="/login" className="lp-link">sign in</Link>
                    <Link href="/signup" className="lp-cta-pill">
                        get started <ArrowRight size={13} strokeWidth={1.8} />
                    </Link>
                </nav>
            </header>

            {/* Hero */}
            <section className="lp-hero">
                <p className="lp-eyebrow" data-reveal data-delay="0">
                    feature prioritization
                </p>
                <h1 className="lp-hero-heading" data-reveal data-delay="80">
                    build what<br />
                    <em>actually</em> matters.
                </h1>
                <p className="lp-hero-sub" data-reveal data-delay="180">
                    quiet the noise. score every request using the right framework.
                    <br className="lp-br" />
                    ship things your users have been waiting for.
                </p>
                <div className="lp-hero-cta" data-reveal data-delay="280">
                    <Link href="/signup" className="lp-cta-primary">
                        start for free <ArrowRight size={16} strokeWidth={1.8} />
                    </Link>
                    <span className="lp-cta-note">no credit card. free for small teams.</span>
                </div>
            </section>

            {/* Thin divider */}
            <div className="lp-rule" data-reveal data-delay="0" />

            {/* Principles */}
            <section className="lp-section">
                <p className="lp-section-label" data-reveal>how it works</p>
                <div className="lp-principles">
                    {[
                        {
                            num: '01',
                            title: 'collect',
                            body: 'gather feature requests from your team, customers, and stakeholders — all in one place.',
                        },
                        {
                            num: '02',
                            title: 'score',
                            body: 'apply RICE, ICE, MoSCoW, JTBD, Kano, Impact/Effort, or WSJF. every request gets a score.',
                        },
                        {
                            num: '03',
                            title: 'decide',
                            body: 'the backlog sorts itself. drag cards across Now, Next, Later. ship with clarity.',
                        },
                    ].map((p, i) => (
                        <div
                            key={p.num}
                            className="lp-principle"
                            data-reveal
                            data-delay={String(i * 100)}
                        >
                            <span className="lp-principle-num">{p.num}</span>
                            <h3 className="lp-principle-title">{p.title}</h3>
                            <p className="lp-principle-body">{p.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Blockquote callout */}
            <section className="lp-quote-section">
                <blockquote className="lp-blockquote" data-reveal>
                    <p>"the best product decisions aren't the loudest ones.</p>
                    <p>they're the most clearly understood."</p>
                </blockquote>
            </section>

            <div className="lp-rule" data-reveal />

            {/* Frameworks section */}
            <section className="lp-section lp-rice-section">
                <div className="lp-rice-left" data-reveal>
                    <p className="lp-section-label">the frameworks</p>
                    <h2 className="lp-section-heading">7 ways to prioritize</h2>
                    <p className="lp-body">
                        every team thinks differently. pick the framework that fits your process —
                        or layer multiple frameworks for a richer picture.
                    </p>
                    <ul style={{ listStyle: 'none', margin: '1.5rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {FRAMEWORKS.map((f) => {
                            const active = activeFramework === f.id
                            return (
                                <li key={f.id}>
                                    <button
                                        onClick={() => setActiveFramework(f.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.85rem',
                                            width: '100%', textAlign: 'left',
                                            padding: '0.55rem 0.85rem', borderRadius: '0.6rem',
                                            border: active ? '1px solid var(--lp-accent, #b5652b)' : '1px solid transparent',
                                            background: active ? 'color-mix(in srgb, var(--lp-accent, #b5652b) 9%, transparent)' : 'transparent',
                                            cursor: 'pointer', transition: 'all 0.18s ease',
                                        }}
                                    >
                                        <span
                                            className="lp-rice-letter"
                                            style={{ fontSize: '0.52rem', width: '2.6rem', textAlign: 'center', letterSpacing: '0.05em', flexShrink: 0, opacity: active ? 1 : 0.7 }}
                                        >
                                            {f.abbr}
                                        </span>
                                        <span
                                            className="lp-rice-label"
                                            style={{ color: active ? 'var(--lp-accent, #b5652b)' : 'inherit', fontWeight: active ? 700 : 500 }}
                                        >
                                            {f.name}
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </div>

                <div className="lp-rice-right" data-reveal data-delay="120">
                    <div className="lp-formula-card" key={activeFramework}>
                        <p className="lp-formula-heading">{fw.name}</p>
                        <p className="lp-formula" style={{ fontSize: fw.formula.length > 28 ? '1rem' : undefined }}>
                            {fw.formula}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--lp-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                            {fw.tagline}
                        </p>
                        <div className="lp-formula-divider" />
                        <div className="lp-formula-example">
                            {fw.inputs.map((inp) => (
                                <div key={inp.label}>
                                    <span className="lp-ex-label">{inp.label}</span>
                                    <span className="lp-ex-val">{inp.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="lp-formula-divider" />
                        <div className="lp-formula-result">
                            <span>{fw.resultLabel}</span>
                            <span className="lp-score-badge">{fw.resultValue}</span>
                        </div>
                    </div>
                </div>
            </section>


            {/* CTA */}
            <section className="lp-cta-section">
                <h2 className="lp-cta-heading" data-reveal>
                    ready to start<br />deciding with clarity?
                </h2>
                <p className="lp-cta-body" data-reveal data-delay="80">
                    join product teams who use Backlog to ship the right things.
                </p>
                <Link href="/signup" className="lp-cta-primary" data-reveal data-delay="160">
                    get started free <ArrowRight size={16} strokeWidth={1.8} />
                </Link>
            </section>

            {/* Footer */}
            <footer className="lp-footer">
                <span className="lp-footer-logo">backlog</span>
                <span className="lp-footer-copy">© 2026 · built for teams who ship</span>
                <nav className="lp-footer-nav">
                    <Link href="/login" className="lp-footer-link">sign in</Link>
                    <Link href="/signup" className="lp-footer-link">sign up</Link>
                    <a
                        href="https://www.linkedin.com/in/arjun-varshney-/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lp-footer-link"
                    >
                        contact
                    </a>
                </nav>
            </footer>
        </div>
    )
}
