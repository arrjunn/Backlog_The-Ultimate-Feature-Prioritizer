'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Trash2, UserMinus, Shield, User, Mail, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createUntypedClient } from '@/lib/supabase/untyped-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Profile, WorkspaceMember } from '@/types/database.types'
import { useWorkspace } from '../WorkspaceLayoutClient'
import { cn } from '@/lib/utils/cn'
import { IntegrationsCard } from '@/components/features/integrations/IntegrationsCard'

export default function SettingsPage() {
    const { slug } = useParams<{ slug: string }>()
    const router = useRouter()
    const { workspace, isAdmin } = useWorkspace()
    const [workspaceName, setWorkspaceName] = useState(workspace?.name || '')
    const [inviteEmail, setInviteEmail] = useState('')
    const [isSavingName, setIsSavingName] = useState(false)
    const [isInviting, setIsInviting] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false)
    const supabase = createClient()
    const supabaseRaw = createUntypedClient()
    const queryClient = useQueryClient()

    const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
        queryKey: ['workspace-members', slug],
        enabled: !!workspace,
        queryFn: async () => {
            const { data } = await supabase
                .from('workspace_members')
                .select('*, profiles(*)')
                .eq('workspace_id', workspace!.id)
            return (data || []) as (WorkspaceMember & { profiles: Profile | null })[]
        },
    })

    const { data: currentUser } = useQuery({
        queryKey: ['current-user'],
        queryFn: async () => {
            let { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                const { data: refreshed } = await supabase.auth.refreshSession()
                session = refreshed.session
            }
            return session?.user || null
        },
    })

    const handleSaveName = async () => {
        if (!workspace || !workspaceName.trim()) return
        setIsSavingName(true)

        const { error } = await supabaseRaw
            .from('workspaces')
            .update({ name: workspaceName.trim() })
            .eq('id', workspace.id)

        if (error) {
            toast.error('Failed to update workspace name')
        } else {
            toast.success('Workspace name updated!')
            queryClient.invalidateQueries({ queryKey: ['workspace', slug] })
        }
        setIsSavingName(false)
    }

    const handleInvite = async () => {
        if (!inviteEmail.trim() || !workspace) return
        setIsInviting(true)

        try {
            // Send magic link to invite the user
            await supabase.auth.signInWithOtp({ email: inviteEmail.trim() })
            toast.info(`Invite sent to ${inviteEmail}. They'll receive a magic link to join.`)
            setInviteEmail('')
        } catch {
            toast.error('Failed to send invite')
        } finally {
            setIsInviting(false)
        }
    }

    const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
        const { error } = await supabaseRaw
            .from('workspace_members')
            .update({ role: newRole })
            .eq('id', memberId)

        if (error) {
            toast.error('Failed to update role')
        } else {
            toast.success('Role updated')
            refetchMembers()
        }
    }

    const handleRemoveMember = async (memberId: string, userId: string) => {
        if (userId === currentUser?.id) {
            toast.error("You can't remove yourself")
            return
        }

        const { error } = await supabase
            .from('workspace_members')
            .delete()
            .eq('id', memberId)

        if (error) {
            toast.error('Failed to remove member')
        } else {
            toast.success('Member removed')
            refetchMembers()
        }
    }

    const handleDeleteWorkspace = async () => {
        if (!workspace || deleteConfirm !== workspace.name) return
        setIsDeletingWorkspace(true)

        const { error } = await supabase
            .from('workspaces')
            .delete()
            .eq('id', workspace.id)

        if (error) {
            toast.error('Failed to delete workspace')
            setIsDeletingWorkspace(false)
        } else {
            toast.success('Workspace deleted')
            router.push('/dashboard')
        }
    }

    const getInitials = (name: string | null) =>
        name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'

    return (
        <div className="p-4 sm:p-6 max-w-2xl space-y-6">
            <div>
                <h1 className="ws-page-heading">Settings</h1>
                <p className="ws-page-sub">manage your workspace preferences</p>
            </div>

            {/* Workspace Name */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Workspace Name</CardTitle>
                    <CardDescription>Update the display name for this workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="workspace-name">Name</Label>
                        <Input
                            id="workspace-name"
                            value={workspaceName || workspace?.name || ''}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            disabled={!isAdmin}
                        />
                    </div>
                    {isAdmin && (
                        <Button
                            onClick={handleSaveName}
                            disabled={isSavingName || !workspaceName.trim() || workspaceName === workspace?.name}
                            size="sm"
                        >
                            {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Members */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Team Members</CardTitle>
                    <CardDescription>Manage who has access to this workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Invite */}
                    {isAdmin && (
                        <div className="space-y-2">
                            <Label>Invite by email</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="colleague@company.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                                />
                                <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} size="sm">
                                    {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                    Invite
                                </Button>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Member List */}
                    {membersLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <div className="flex-1 space-y-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {members?.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 group">
                                    <Avatar className="h-9 w-9 shrink-0">
                                        <AvatarImage src={member.profiles?.avatar_url || ''} />
                                        <AvatarFallback className="text-xs">{getInitials(member.profiles?.full_name || '')}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">{member.profiles?.full_name || 'Unknown'}</p>
                                            {member.user_id === currentUser?.id && (
                                                <Badge variant="secondary" className="text-xs">You</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{member.profiles?.email}</p>
                                    </div>

                                    {isAdmin ? (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Select
                                                value={member.role}
                                                onValueChange={(v) => handleChangeRole(member.id, v as 'admin' | 'member' | 'viewer')}
                                                disabled={member.user_id === currentUser?.id}
                                            >
                                                <SelectTrigger className="w-28 h-7 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">
                                                        <span className="flex items-center gap-1.5 text-xs">
                                                            <Shield className="h-3 w-3 text-amber-500" />
                                                            Admin
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="member">
                                                        <span className="flex items-center gap-1.5 text-xs">
                                                            <User className="h-3 w-3 text-blue-500" />
                                                            Member
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="viewer">
                                                        <span className="flex items-center gap-1.5 text-xs">
                                                            <Eye className="h-3 w-3 text-muted-foreground" />
                                                            Viewer
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {member.user_id !== currentUser?.id && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                                >
                                                    <UserMinus className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="text-xs shrink-0">
                                            {member.role}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Integrations */}
            {workspace && (
                <IntegrationsCard workspaceId={workspace.id} isAdmin={isAdmin} />
            )}

            {/* Danger Zone */}
            {isAdmin && (
                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                        <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                            <div>
                                <p className="text-sm font-medium">Delete this workspace</p>
                                <p className="text-xs text-muted-foreground">
                                    This will permanently delete all feature requests, votes, and comments.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delete confirmation modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Workspace</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the{' '}
                            <strong>{workspace?.name}</strong> workspace and all its data.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-muted-foreground">
                            Type <strong>{workspace?.name}</strong> to confirm:
                        </p>
                        <Input
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder={workspace?.name || ''}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteWorkspace}
                            disabled={deleteConfirm !== workspace?.name || isDeletingWorkspace}
                        >
                            {isDeletingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Delete Workspace
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
