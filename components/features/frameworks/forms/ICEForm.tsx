'use client'

import { useState } from 'react'
import { calculateICEScore, getICEScoreColor, getICEScoreLabel } from '@/lib/utils/rice'

interface ICEFormData {
    ice_impact: number
    ice_confidence: number
    ice_ease: number
}

interface ICEFormProps {
    defaultValues?: Partial<ICEFormData>
    onChange?: (data: ICEFormData) => void
}

function ScoreSlider({
    label,
    tooltip,
    value,
    onChange,
}: {
    label: string
    tooltip: string
    value: number
    onChange: (v: number) => void
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-sm font-medium">{label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{tooltip}</p>
                </div>
                <span className="text-sm font-bold tabular-nums w-6 text-right">{value}</span>
            </div>
            <input
                type="range"
                min={1}
                max={10}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span><span>10</span>
            </div>
        </div>
    )
}

export function ICEForm({ defaultValues, onChange }: ICEFormProps) {
    const [impact, setImpact] = useState(defaultValues?.ice_impact ?? 5)
    const [confidence, setConfidence] = useState(defaultValues?.ice_confidence ?? 5)
    const [ease, setEase] = useState(defaultValues?.ice_ease ?? 5)

    const score = calculateICEScore(impact, confidence, ease)

    const update = (field: keyof ICEFormData, value: number) => {
        const next = { ice_impact: impact, ice_confidence: confidence, ice_ease: ease, [field]: value }
        if (field === 'ice_impact') setImpact(value)
        if (field === 'ice_confidence') setConfidence(value)
        if (field === 'ice_ease') setEase(value)
        onChange?.(next)
    }

    return (
        <div className="space-y-6">
            <ScoreSlider
                label="Impact"
                tooltip="How much impact will this have on the key metric?"
                value={impact}
                onChange={(v) => update('ice_impact', v)}
            />
            <ScoreSlider
                label="Confidence"
                tooltip="How confident are you in this estimate? (1 = guessing, 10 = certain)"
                value={confidence}
                onChange={(v) => update('ice_confidence', v)}
            />
            <ScoreSlider
                label="Ease"
                tooltip="How easy is this to implement? (1 = very hard, 10 = very easy)"
                value={ease}
                onChange={(v) => update('ice_ease', v)}
            />

            {/* Live preview */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">ICE Score</div>
                        <div className="text-2xl font-bold tabular-nums">{score.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            ({impact} × {confidence} × {ease}) ÷ 3
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getICEScoreColor(score)}`}>
                        {getICEScoreLabel(score)}
                    </span>
                </div>
            </div>
        </div>
    )
}

export type { ICEFormData }
