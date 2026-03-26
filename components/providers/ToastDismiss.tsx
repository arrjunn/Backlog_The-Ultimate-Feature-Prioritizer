'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function ToastDismissOnClick() {
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            const target = e.target as HTMLElement
            if (target.closest('[data-sonner-toast]') || target.closest('[data-sonner-toaster]')) return
            toast.dismiss()
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])
    return null
}
