import { SignupForm } from '@/components/features/auth/SignupForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Sign Up — Backlog',
    description: 'Create your free Backlog account',
}

export default function SignupPage() {
    return (
        <div className="auth-root">
            {/* Left panel */}
            <div className="auth-left">
                <Link href="/" className="auth-logo">backlog</Link>
                <div className="auth-left-body">
                    <p className="auth-left-label">what you get</p>
                    <ul className="auth-feature-list">
                        {[
                            'RICE scoring to prioritize objectively',
                            'team voting to surface what matters most',
                            'kanban board to manage your roadmap',
                            'real-time collaboration across your team',
                            'insights and analytics on your backlog',
                        ].map((item) => (
                            <li key={item} className="auth-feature-item">
                                <span className="auth-feature-dot" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <p className="auth-join-note">join 500+ teams shipping smarter</p>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="auth-right">
                <Link href="/" className="auth-logo auth-logo-mobile">backlog</Link>
                <div className="auth-card">
                    <div className="auth-card-header">
                        <h1 className="auth-heading">start building.</h1>
                        <p className="auth-subheading">free forever for small teams — no card required</p>
                    </div>
                    <SignupForm />
                </div>
                <p className="auth-footer-note">
                    already have an account?{' '}
                    <Link href="/login" className="auth-text-link">sign in</Link>
                </p>
            </div>
        </div>
    )
}
