import { LoginForm } from '@/components/features/auth/LoginForm'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Sign In — Backlog',
    description: 'Sign in to your Backlog account',
}

export default function LoginPage() {
    return (
        <div className="auth-root">
            {/* Left panel — editorial */}
            <div className="auth-left">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link href="/" className="auth-back-link" style={{ margin: 0 }}><ArrowLeft size={14} /></Link>
                        <Link href="/" className="auth-logo">backlog</Link>
                    </div>
                    <ThemeToggle />
                </div>
                <div className="auth-left-body">
                    <div className="auth-left-terminal">
                        <div className="auth-terminal-bar" style={{ margin: 0, padding: '0.6rem 0.85rem' }}>
                            <span className="lp-terminal-dot" style={{ background: '#ff5f57' }} />
                            <span className="lp-terminal-dot" style={{ background: '#febc2e' }} />
                            <span className="lp-terminal-dot" style={{ background: '#28c840' }} />
                            <span className="auth-terminal-title">session</span>
                        </div>
                        <div style={{ padding: '1rem 1.25rem' }}>
                            <blockquote className="auth-quote">
                                &ldquo;the best product decisions aren&apos;t the loudest ones.
                                they&apos;re the most clearly understood.&rdquo;
                            </blockquote>
                        </div>
                    </div>
                    <div className="auth-stats">
                        {[
                            ['10k+', 'features prioritized'],
                            ['500+', 'teams using'],
                            ['4.9★', 'average rating'],
                        ].map(([val, label]) => (
                            <div key={label} className="auth-stat">
                                <span className="auth-stat-val">{val}</span>
                                <span className="auth-stat-label">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="auth-right">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 400, marginBottom: '1rem' }}>
                    <Link href="/" className="auth-logo auth-logo-mobile">backlog</Link>
                    <ThemeToggle className="auth-logo-mobile" />
                </div>
                <div className="auth-card">
                    <div className="auth-terminal-bar">
                        <span className="lp-terminal-dot" style={{ background: '#ff5f57' }} />
                        <span className="lp-terminal-dot" style={{ background: '#febc2e' }} />
                        <span className="lp-terminal-dot" style={{ background: '#28c840' }} />
                        <span className="auth-terminal-title">$ backlog login</span>
                    </div>
                    <div className="auth-card-header">
                        <h1 className="auth-heading">welcome back.</h1>
                        <p className="auth-subheading">sign in to continue to your workspace</p>
                    </div>
                    <LoginForm />
                </div>
                <p className="auth-footer-note">
                    don&apos;t have an account?{' '}
                    <Link href="/signup" className="auth-text-link">sign up</Link>
                </p>
            </div>
        </div>
    )
}
