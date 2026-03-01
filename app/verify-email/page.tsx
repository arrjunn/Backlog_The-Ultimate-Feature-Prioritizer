import { Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-card rounded-2xl border border-border shadow-xl p-8 text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Mail className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-3">Verify your email</h1>
                <p className="text-muted-foreground text-sm mb-2">
                    We&apos;ve sent you a verification link. Check your inbox and click the link to activate your account.
                </p>
                <p className="text-muted-foreground text-xs mb-8">
                    Don&apos;t see it? Check your spam folder.
                </p>
                <Button variant="outline" asChild className="w-full">
                    <Link href="/login">Back to login</Link>
                </Button>
            </div>
        </div>
    )
}
