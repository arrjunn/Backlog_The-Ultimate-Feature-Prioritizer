import WorkspaceLayoutClient from './WorkspaceLayoutClient'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function WorkspaceLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { slug: string }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <WorkspaceLayoutClient slug={params.slug}>
            {children}
        </WorkspaceLayoutClient>
    )
}
