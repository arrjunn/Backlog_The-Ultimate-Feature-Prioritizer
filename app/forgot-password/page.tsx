'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
    email: z.string().email('Please enter a valid email'),
})

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false)
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        getValues,
    } = useForm<{ email: string }>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: { email: string }) => {
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        if (error) { setError('root', { message: error.message }); return }
        setSent(true)
    }

    if (sent) {
        return (
            <div className="auth-solo">
                <div className="auth-solo-card auth-solo-card--center">
                    <div className="auth-success-icon">
                        <CheckCircle2 size={28} strokeWidth={1.5} />
                    </div>
                    <h1 className="auth-heading">check your inbox.</h1>
                    <p className="auth-subheading">
                        we sent a reset link to{' '}
                        <strong>{getValues('email')}</strong>
                    </p>
                    <Link href="/login" className="auth-back-link">
                        <ArrowLeft size={13} /> back to sign in
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-solo">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/" className="auth-logo">backlog</Link>
                <ThemeToggle />
            </div>
            <div className="auth-solo-card">
                <div className="auth-terminal-bar">
                    <span className="lp-terminal-dot" style={{ background: '#ff5f57' }} />
                    <span className="lp-terminal-dot" style={{ background: '#febc2e' }} />
                    <span className="lp-terminal-dot" style={{ background: '#28c840' }} />
                    <span className="auth-terminal-title">$ backlog reset-password</span>
                </div>
                <div className="auth-card-header">
                    <h1 className="auth-heading">reset your password.</h1>
                    <p className="auth-subheading">enter your email and we&apos;ll send a link</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form-fields">
                    <div className="auth-field">
                        <Label htmlFor="email">email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
                        {errors.email && <p className="auth-field-error">{errors.email.message}</p>}
                    </div>

                    {errors.root && (
                        <div className="auth-error-box">
                            <p>{errors.root.message}</p>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> sending...</> : <><Mail className="h-4 w-4" /> send reset link</>}
                    </Button>
                </form>

                <Link href="/login" className="auth-back-link">
                    <ArrowLeft size={13} /> back to sign in
                </Link>
            </div>
        </div>
    )
}
