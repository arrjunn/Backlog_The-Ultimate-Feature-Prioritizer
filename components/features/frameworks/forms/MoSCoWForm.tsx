'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { MoSCoWCategory } from '@/types/frameworks.types'

interface MoSCoWFormData {
    moscow_category: MoSCoWCategory
    moscow_rationale?: string
}

interface MoSCoWFormProps {
    defaultValues?: Partial<MoSCoWFormData>
    onChange?: (data: MoSCoWFormData) => void
}

const CATEGORIES: { id: MoSCoWCategory; label: string; short: string; description: string; selectedClass: string }[] = [
    {
        id: 'must_have',
        label: 'Must Have',
        short: 'M',
        description: 'Critical for launch. Without this, the product fails.',
        selectedClass: 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
    },
    {
        id: 'should_have',
        label: 'Should Have',
        short: 'S',
        description: 'Important but not vital. Can ship without it but shouldn\'t.',
        selectedClass: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    },
    {
        id: 'could_have',
        label: 'Could Have',
        short: 'Co',
        description: 'Nice to have. Include if time and resources allow.',
        selectedClass: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    },
    {
        id: 'wont_have',
        label: "Won't Have",
        short: 'W',
        description: 'Not doing this now. Explicitly deprioritized.',
        selectedClass: 'border-gray-400 bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400',
    },
]

export function MoSCoWForm({ defaultValues, onChange }: MoSCoWFormProps) {
    const [selected, setSelected] = useState<MoSCoWCategory | ''>(defaultValues?.moscow_category ?? '')
    const [rationale, setRationale] = useState(defaultValues?.moscow_rationale ?? '')

    const handleSelect = (cat: MoSCoWCategory) => {
        setSelected(cat)
        onChange?.({ moscow_category: cat, moscow_rationale: rationale || undefined })
    }

    const handleRationale = (val: string) => {
        setRationale(val)
        if (selected) onChange?.({ moscow_category: selected, moscow_rationale: val || undefined })
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelect(cat.id)}
                        className={cn(
                            'flex flex-col gap-1 rounded-xl border-2 p-4 text-left transition-all',
                            selected === cat.id
                                ? cat.selectedClass
                                : 'border-border hover:border-border/60 bg-card hover:bg-muted/40'
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{cat.label}</span>
                            <span className="text-xs opacity-60 font-mono font-bold">{cat.short}</span>
                        </div>
                        <p className="text-xs opacity-75 leading-relaxed">{cat.description}</p>
                    </button>
                ))}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Rationale <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                    value={rationale}
                    onChange={(e) => handleRationale(e.target.value)}
                    rows={2}
                    placeholder="Why did you choose this category?"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
                               placeholder:text-muted-foreground resize-none focus:outline-none
                               focus:ring-2 focus:ring-ring focus:ring-offset-0"
                />
            </div>
        </div>
    )
}

export type { MoSCoWFormData }
