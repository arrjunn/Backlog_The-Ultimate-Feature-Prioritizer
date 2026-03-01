'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceUser {
    userId: string
    fullName: string | null
    avatarUrl: string | null
    page: string
    onlineAt: string
}

export function useWorkspacePresence(workspaceId: string | undefined, currentUser: PresenceUser | null) {
    const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([])
    const supabase = createClient()

    const updatePage = useCallback((channel: RealtimeChannel, page: string) => {
        if (!currentUser || !channel) return
        channel.track({ ...currentUser, page, onlineAt: new Date().toISOString() })
    }, [currentUser])

    useEffect(() => {
        if (!workspaceId || !currentUser) return

        const channelName = `presence:workspace:${workspaceId}`
        const channel = supabase.channel(channelName, {
            config: { presence: { key: currentUser.userId } },
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState<PresenceUser>()
                const users: PresenceUser[] = (Object.values(state) as unknown as PresenceUser[][])
                    .flat()
                    .filter((u) => u.userId !== currentUser.userId)
                setPresentUsers(users)
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                setPresentUsers((prev) => {
                    const updated = [...prev]
                    for (const np of (newPresences as unknown as PresenceUser[])) {
                        if (np.userId === currentUser.userId) continue
                        const idx = updated.findIndex(u => u.userId === np.userId)
                        if (idx >= 0) updated[idx] = np
                        else updated.push(np)
                    }
                    return updated
                })
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                const leftIds = (leftPresences as unknown as PresenceUser[]).map(u => u.userId)
                setPresentUsers((prev) => prev.filter(u => !leftIds.includes(u.userId)))
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && currentUser) {
                    await channel.track({
                        ...currentUser,
                        onlineAt: new Date().toISOString(),
                    })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId, currentUser?.userId])

    return { presentUsers }
}
