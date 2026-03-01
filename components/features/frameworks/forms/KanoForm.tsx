'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { getKanoCategory, getKanoCategoryColor, getKanoCategoryLabel, getKanoCategoryDescription, getKanoScore } from '@/lib/utils/kano'
import type { KanoResponse } from '@/types/frameworks.types'

interface KanoFormData {
    kano_functional_response: KanoResponse
    kano_dysfunctional_response: KanoResponse
}

interface KanoFormProps {
    defaultValues?: Partial<KanoFormData>
    onChange?: (data: KanoFormData) => void
}

const RESPONSES: { id: KanoResponse; label: string }[] = [
    { id: 'like', label: 'Like' },
    { id: 'expect', label: 'Expect' },
    { id: 'neutral', label: 'Neutral' },
    { id: 'tolerate', label: 'Tolerate' },
    { id: 'dislike', label: 'Dislike' },
]

function ResponseGroup({
    label,
    selected,
    onSelect,
}: {
    label: string
    selected: KanoResponse | ''
    onSelect: (r: KanoResponse) => void
}) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">{label}</p>
            <div className="flex gap-2 flex-wrap">
                {RESPONSES.map((r) => (
                    <button
                        key={r.id}
                        type="button"
                        onClick={() => onSelect(r.id)}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                            selected === r.id
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card hover:bg-muted/50 text-foreground'
                        )}
                    >
                        {r.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export function KanoForm({ defaultValues, onChange }: KanoFormProps) {
    const [functional, setFunctional] = useState<KanoResponse | ''>(defaultValues?.kano_functional_response ?? '')
    const [dysfunctional, setDysfunctional] = useState<KanoResponse | ''>(defaultValues?.kano_dysfunctional_response ?? '')

    const category = functional && dysfunctional
        ? getKanoCategory(functional, dysfunctional)
        : null

    const handleFunctional = (r: KanoResponse) => {
        setFunctional(r)
        if (dysfunctional) {
            onChange?.({ kano_functional_response: r, kano_dysfunctional_response: dysfunctional })
        }
    }

    const handleDysfunctional = (r: KanoResponse) => {
        setDysfunctional(r)
        if (functional) {
            onChange?.({ kano_functional_response: functional, kano_dysfunctional_response: r })
        }
    }

    return (
        <div className="space-y-6">
            {/* Info box */}
            <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-sm text-muted-foreground">
                Answer two questions about this feature to classify it using the Kano model.
            </div>

            <ResponseGroup
                label='If this feature IS present, how would users feel?'
                selected={functional}
                onSelect={handleFunctional}
            />
            <ResponseGroup
                label='If this feature IS NOT present, how would users feel?'
                selected={dysfunctional}
                onSelect={handleDysfunctional}
            />

            {/* Live result */}
            {category && (
                <div className={cn('rounded-xl border-2 p-4 space-y-2', getKanoCategoryColor(category).replace('bg-', 'border-').replace(/ text-.*/, ''))}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs opacity-60 mb-1">Kano Category</div>
                            <div className="text-lg font-bold">{getKanoCategoryLabel(category)}</div>
                        </div>
                        <span className={cn('px-2.5 py-1 rounded-full text-sm font-bold', getKanoCategoryColor(category))}>
                            {getKanoScore(category)} / 10
                        </span>
                    </div>
                    <p className="text-sm opacity-75">{getKanoCategoryDescription(category)}</p>
                </div>
            )}
        </div>
    )
}

export type { KanoFormData }
