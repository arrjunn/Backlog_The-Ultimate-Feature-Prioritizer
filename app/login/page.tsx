import { LoginForm } from '@/components/features/auth/LoginForm'
import Link from 'next/link'
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
                <Link href="/" className="auth-logo">backlog</Link>
                <div className="auth-left-body">
                    <blockquote className="auth-quote">
                        "the best product decisions aren't the loudest ones.
                        they're the most clearly understood."
                    </blockquote>
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
                <Link href="/" className="auth-logo auth-logo-mobile">backlog</Link>
                <div className="auth-card">
                    <div className="auth-card-header">
                        <h1 className="auth-heading">welcome back.</h1>
                        <p className="auth-subheading">sign in to continue to your workspace</p>
                    </div>
                    <LoginForm />
                </div>
                <p className="auth-footer-note">
                    don't have an account?{' '}
                    <Link href="/signup" className="auth-text-link">sign up</Link>
                </p>
            </div>
        </div>
    )
}
