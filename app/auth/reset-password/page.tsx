'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

const schema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

export default function ResetPasswordPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [done, setDone] = useState(false)
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<{ password: string; confirmPassword: string }>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: { password: string; confirmPassword: string }) => {
        const { error } = await supabase.auth.updateUser({ password: data.password })

        if (error) {
            setError('root', { message: error.message })
            return
        }

        setDone(true)
        setTimeout(() => router.push('/dashboard'), 2000)
    }

    if (done) {
        return (
            <div className="auth-solo">
                <div className="auth-solo-card auth-solo-card--center">
                    <div className="auth-success-icon" style={{ color: '#22c55e' }}>
                        <CheckCircle2 size={28} strokeWidth={1.5} />
                    </div>
                    <h1 className="auth-heading">password updated.</h1>
                    <p className="auth-subheading">redirecting to your dashboard…</p>
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
                <div className="auth-card-header">
                    <h1 className="auth-heading">set new password.</h1>
                    <p className="auth-subheading">enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                    </div>

                    {errors.root && (
                        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                            <p className="text-xs text-destructive">{errors.root.message}</p>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Update Password
                    </Button>
                </form>

                <Link href="/login" className="auth-back-link">
                    <ArrowLeft size={13} /> back to sign in
                </Link>
            </div>
        </div>
    )
}
