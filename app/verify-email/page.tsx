import { Mail, ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'

export default function VerifyEmailPage() {
    return (
        <div className="auth-solo">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/" className="auth-logo">backlog</Link>
                <ThemeToggle />
            </div>
            <div className="auth-solo-card auth-solo-card--center">
                <div className="auth-success-icon">
                    <Mail size={28} strokeWidth={1.5} />
                </div>
                <h1 className="auth-heading">check your inbox.</h1>
                <p className="auth-subheading">
                    we&apos;ve sent you a verification link. click it to activate your account.
                </p>
                <p className="auth-subheading" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    don&apos;t see it? check your spam folder.
                </p>
                <Link href="/login" className="auth-back-link">
                    <ArrowLeft size={13} /> back to sign in
                </Link>
            </div>
        </div>
    )
}
