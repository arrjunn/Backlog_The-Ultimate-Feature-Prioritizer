'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useWorkspacePresence, PresenceUser } from '@/hooks/useWorkspacePresence'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

function getInitials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface Props {
    workspaceId: string | undefined
    userId: string | undefined
    fullName: string | null
    avatarUrl: string | null
}

export function OnlinePresenceAvatars({ workspaceId, userId, fullName, avatarUrl }: Props) {
    const pathname = usePathname()
    const [currentUser, setCurrentUser] = useState<PresenceUser | null>(null)

    useEffect(() => {
        if (!userId) return
        setCurrentUser({
            userId,
            fullName: fullName ?? null,
            avatarUrl: avatarUrl ?? null,
            page: pathname,
            onlineAt: new Date().toISOString(),
        })
    }, [userId, fullName, avatarUrl, pathname])

    const { presentUsers } = useWorkspacePresence(workspaceId, currentUser)

    if (presentUsers.length === 0) return null

    const visible = presentUsers.slice(0, 5)
    const overflow = presentUsers.length - 5

    return (
        <div className="flex items-center" title={`${presentUsers.length} teammate${presentUsers.length !== 1 ? 's' : ''} online`}>
            <div className="flex -space-x-2">
                {visible.map((user) => (
                    <div
                        key={user.userId}
                        className="relative group"
                    >
                        <Avatar className="h-7 w-7 border-2 border-card ring-1 ring-green-500/60">
                            <AvatarImage src={user.avatarUrl ?? ''} />
                            <AvatarFallback className="text-[10px] font-semibold bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                {getInitials(user.fullName)}
                            </AvatarFallback>
                        </Avatar>
                        {/* Online dot */}
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-card" />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-popover border border-border text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                            <span className="font-medium">{user.fullName ?? 'Anonymous'}</span>
                            <span className="text-muted-foreground ml-1">· {user.page.split('/').pop() || 'home'}</span>
                        </div>
                    </div>
                ))}
                {overflow > 0 && (
                    <div className="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        +{overflow}
                    </div>
                )}
            </div>
            <span className="ml-2 text-[10px] text-muted-foreground hidden sm:inline">
                {presentUsers.length} online
            </span>
        </div>
    )
}
