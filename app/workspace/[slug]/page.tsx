import { redirect } from 'next/navigation'

export default function WorkspaceDefaultPage({ params }: { params: { slug: string } }) {
    redirect(`/workspace/${params.slug}/backlog`)
}
