'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X, Tag, Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { createUntypedClient } from '@/lib/supabase/untyped-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { RICEForm } from './RICEForm'
import { calculateRiceScore } from '@/lib/utils/rice'
import { ICEForm } from '@/components/features/frameworks/forms/ICEForm'
import { MoSCoWForm } from '@/components/features/frameworks/forms/MoSCoWForm'
import { JTBDForm } from '@/components/features/frameworks/forms/JTBDForm'
import { KanoForm } from '@/components/features/frameworks/forms/KanoForm'
import { ImpactEffortForm } from '@/components/features/frameworks/forms/ImpactEffortForm'
import { WSJFForm } from '@/components/features/frameworks/forms/WSJFForm'
import { useWorkspace } from '@/app/workspace/[slug]/WorkspaceLayoutClient'
import { cn } from '@/lib/utils/cn'
import type { FrameworkId } from '@/types/frameworks.types'

const schema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().optional(),
    reach: z.number().min(1).max(10).default(5),
    impact: z.number().min(1).max(10).default(5),
    confidence: z.number().default(80),
    effort: z.number().min(1).max(10).default(5),
})

type FormValues = z.infer<typeof schema>

type TabId = 'details' | 'score'

interface RequestModalProps {
    open: boolean
    onClose: () => void
    workspaceId: string
    workspaceSlug: string
}

const ALL_FRAMEWORKS: { id: FrameworkId; label: string }[] = [
    { id: 'rice', label: 'RICE' },
    { id: 'ice', label: 'ICE' },
    { id: 'moscow', label: 'MoSCoW' },
    { id: 'jtbd', label: 'JTBD' },
    { id: 'kano', label: 'Kano' },
    { id: 'impact_effort', label: 'Impact/Effort' },
    { id: 'wsjf', label: 'WSJF' },
]

export function RequestModal({ open, onClose, workspaceId, workspaceSlug }: RequestModalProps) {
    const { activeFramework } = useWorkspace()
    const [tab, setTab] = useState<TabId>('details')
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [activeScoreFramework, setActiveScoreFramework] = useState<FrameworkId>(activeFramework as FrameworkId || 'rice')
    const [frameworkData, setFrameworkData] = useState<Record<string, Record<string, unknown>>>({})
    const [submitAttempted, setSubmitAttempted] = useState(false)
    const queryClient = useQueryClient()
    const supabase = createClient()
    const supabaseRaw = createUntypedClient()

    // RICE fields from form
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            reach: 5,
            impact: 5,
            confidence: 80,
            effort: 5,
        },
    })

    const reach = watch('reach')
    const impact = watch('impact')
    const confidence = watch('confidence')
    const effort = watch('effort')

    const riceScore = calculateRiceScore(reach, impact, confidence, effort)

    const handleFrameworkChange = (fwId: FrameworkId, data: Record<string, unknown>) => {
        setFrameworkData((prev) => ({ ...prev, [fwId]: data }))
    }

    const addTag = () => {
        const val = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
        if (val && !tags.includes(val) && tags.length < 10) {
            setTags([...tags, val])
            setTagInput('')
        }
    }

    const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

    const onSubmit = async (values: FormValues) => {
        try {
            // getSession() reads from localStorage — never fails mid-session due to JWT refresh
            let { data: { session } } = await supabase.auth.getSession()
            // If session expired, try refreshing once before giving up
            if (!session) {
                const { data: refreshed } = await supabase.auth.refreshSession()
                session = refreshed.session
            }
            if (!session?.user) throw new Error('Session expired — please refresh the page and try again')
            const user = session.user

            const riceScore = calculateRiceScore(values.reach, values.impact, values.confidence, values.effort)

            // Merge RICE + all additional framework data
            const iceData = frameworkData['ice'] as { ice_impact?: number; ice_confidence?: number; ice_ease?: number } | undefined
            const moscowData = frameworkData['moscow'] as { moscow_category?: string; moscow_rationale?: string } | undefined
            const jtbdData = frameworkData['jtbd'] as { jtbd_job_statement?: string; jtbd_importance?: number; jtbd_satisfaction?: number } | undefined
            const kanoData = frameworkData['kano'] as { kano_functional_response?: string; kano_dysfunctional_response?: string } | undefined
            const ieData = frameworkData['impact_effort'] as { ie_impact?: number; ie_effort?: number } | undefined
            const wsjfData = frameworkData['wsjf'] as { wsjf_user_business_value?: number; wsjf_time_criticality?: number; wsjf_risk_reduction?: number; wsjf_job_size?: number } | undefined

            const payload = {
                workspace_id: workspaceId,
                title: values.title,
                description: values.description || null,
                submitted_by: user.id,
                reach: values.reach,
                impact: values.impact,
                confidence: values.confidence,
                effort: values.effort,
                tags,
                ...(iceData ? { ice_impact: iceData.ice_impact, ice_confidence: iceData.ice_confidence, ice_ease: iceData.ice_ease } : {}),
                ...(moscowData ? { moscow_category: moscowData.moscow_category, moscow_rationale: moscowData.moscow_rationale } : {}),
                ...(jtbdData ? { jtbd_job_statement: jtbdData.jtbd_job_statement, jtbd_importance: jtbdData.jtbd_importance, jtbd_satisfaction: jtbdData.jtbd_satisfaction } : {}),
                ...(kanoData ? { kano_functional_response: kanoData.kano_functional_response, kano_dysfunctional_response: kanoData.kano_dysfunctional_response } : {}),
                ...(ieData ? { ie_impact: ieData.ie_impact, ie_effort: ieData.ie_effort } : {}),
                ...(wsjfData ? { wsjf_user_business_value: wsjfData.wsjf_user_business_value, wsjf_time_criticality: wsjfData.wsjf_time_criticality, wsjf_risk_reduction: wsjfData.wsjf_risk_reduction, wsjf_job_size: wsjfData.wsjf_job_size } : {}),
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabaseRaw.from('feature_requests').insert(payload)
            if (error) throw error

            toast.success('Request created')
            queryClient.invalidateQueries({ queryKey: ['feature-requests', workspaceSlug] })
            reset()
            setTags([])
            setFrameworkData({})
            onClose()
        } catch (err: any) {
            toast.error(`Failed to create request: ${err.message || 'Unknown error'}`)
            console.error('Request creation error:', err)
        }
    }

    const handleClose = () => {
        reset()
        setTags([])
        setFrameworkData({})
        setTab('details')
        setSubmitAttempted(false)
        onClose()
    }

    const handleNextTab = async () => {
        // Validate title before advancing to Score It
        const titleValue = watch('title')
        if (!titleValue || titleValue.trim().length < 3) {
            setSubmitAttempted(true)
            // Trigger validation display
            await handleSubmit(() => { })().catch(() => { })
            return
        }
        setTab('score')
    }

    const titleValue = watch('title') ?? ''
    const hasErrors = Object.keys(errors).length > 0

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
                    <DialogTitle className="text-lg font-semibold">New Feature Request</DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b border-border mt-4 px-6 shrink-0">
                    {([
                        { id: 'details', label: 'Details' },
                        { id: 'score', label: 'Score It' },
                    ] as { id: TabId; label: string }[]).map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                'pb-3 mr-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
                                tab === t.id
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                                t.id === 'details' && submitAttempted && hasErrors
                                    ? 'text-destructive border-destructive'
                                    : ''
                            )}
                        >
                            {t.id === 'details' && submitAttempted && hasErrors && (
                                <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Validation error banner — always visible regardless of tab */}
                {submitAttempted && hasErrors && (
                    <div className="mx-6 mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div className="text-xs text-destructive">
                            {errors.title && <p>• {errors.title.message}</p>}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                        {tab === 'details' && (
                            <>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                                        <span className={cn('text-xs', titleValue.length > 180 ? 'text-destructive' : 'text-muted-foreground')}>
                                            {titleValue.length}/200
                                        </span>
                                    </div>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Dark mode support"
                                        {...register('title')}
                                        className={errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
                                        autoFocus
                                    />
                                    {errors.title && (
                                        <p className="text-xs text-destructive flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.title.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Why is this important? Who needs it?"
                                        rows={4}
                                        {...register('description')}
                                    />
                                </div>

                                {/* Tags */}
                                <div className="space-y-1.5">
                                    <Label>Tags</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add a tag..."
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { e.preventDefault(); addTag() }
                                            }}
                                        />
                                        <Button type="button" variant="outline" size="icon" onClick={addTag}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {tags.map((tag) => (
                                                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs">
                                                    <Tag className="h-3 w-3 text-muted-foreground" />
                                                    {tag}
                                                    <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {tab === 'score' && (
                            <div className="space-y-5">
                                {/* Framework picker */}
                                <div className="flex flex-wrap gap-2">
                                    {ALL_FRAMEWORKS.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setActiveScoreFramework(f.id)}
                                            className={cn(
                                                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                                                activeScoreFramework === f.id
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                            )}
                                        >
                                            {f.label}
                                            {frameworkData[f.id] && (
                                                <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary inline-block align-middle" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Dynamic form */}
                                <div className="rounded-xl border border-border p-5">
                                    {activeScoreFramework === 'rice' && (
                                        <RICEForm
                                            register={register}
                                            watch={watch}
                                            setValue={setValue}
                                            errors={errors}
                                        />
                                    )}
                                    {activeScoreFramework === 'ice' && (
                                        <ICEForm onChange={(d) => handleFrameworkChange('ice', d as unknown as Record<string, unknown>)} />
                                    )}
                                    {activeScoreFramework === 'moscow' && (
                                        <MoSCoWForm onChange={(d) => handleFrameworkChange('moscow', d as unknown as Record<string, unknown>)} />
                                    )}
                                    {activeScoreFramework === 'jtbd' && (
                                        <JTBDForm onChange={(d) => handleFrameworkChange('jtbd', d as unknown as Record<string, unknown>)} />
                                    )}
                                    {activeScoreFramework === 'kano' && (
                                        <KanoForm onChange={(d) => handleFrameworkChange('kano', d as unknown as Record<string, unknown>)} />
                                    )}
                                    {activeScoreFramework === 'impact_effort' && (
                                        <ImpactEffortForm onChange={(d) => handleFrameworkChange('impact_effort', d as unknown as Record<string, unknown>)} />
                                    )}
                                    {activeScoreFramework === 'wsjf' && (
                                        <WSJFForm onChange={(d) => handleFrameworkChange('wsjf', d as unknown as Record<string, unknown>)} />
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Switch tabs above to score with multiple frameworks. Filled tabs show a dot.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0 bg-card">
                        <div className="flex gap-2">
                            {tab === 'details' && (
                                <Button type="button" variant="outline" size="sm" onClick={handleNextTab}>
                                    Next: Score It →
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => setSubmitAttempted(true)}
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Create Request
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
