'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleButton } from './GoogleButton'
import { cn } from '@/lib/utils/cn'

const signupSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
})

type SignupFormValues = z.infer<typeof signupSchema>

function PasswordStrengthIndicator({ password }: { password: string }) {
    const requirements = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Number', met: /[0-9]/.test(password) },
    ]

    const strength = requirements.filter((r) => r.met).length
    const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'][strength] || 'Weak'
    const strengthColor = [
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-green-500',
    ][strength] || 'bg-red-500'

    if (!password) return null

    return (
        <div className="space-y-2 mt-2">
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-1 flex-1 rounded-full transition-all duration-300',
                            i < strength ? strengthColor : 'bg-muted'
                        )}
                    />
                ))}
            </div>
            <p className="text-xs text-muted-foreground">Password strength: {strengthLabel}</p>
            <ul className="space-y-1">
                {requirements.map((req) => (
                    <li key={req.label} className="flex items-center gap-1.5 text-xs">
                        {req.met ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                            {req.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export function SignupForm() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    })

    const password = watch('password', '')

    const onSubmit = async (data: SignupFormValues) => {
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.fullName,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError('root', { message: error.message })
            return
        }

        router.push('/verify-email')
    }

    return (
        <div className="space-y-6">
            <GoogleButton />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        {...register('fullName')}
                        aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName && (
                        <p className="text-xs text-destructive">{errors.fullName.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        {...register('email')}
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...register('password')}
                            aria-invalid={!!errors.password}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <PasswordStrengthIndicator password={password} />
                    {errors.password && (
                        <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                </div>

                {errors.root && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                        <p className="text-xs text-destructive">{errors.root.message}</p>
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        'Create Account'
                    )}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    )
}
