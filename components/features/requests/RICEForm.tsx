'use client'

import { useEffect } from 'react'
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { calculateRiceScore, getRiceScoreBadgeClass, CONFIDENCE_OPTIONS } from '@/lib/utils/rice'
import { cn } from '@/lib/utils/cn'

interface RiceFormProps {
    register: UseFormRegister<any>
    watch: UseFormWatch<any>
    setValue: UseFormSetValue<any>
    errors: FieldErrors<any>
}

function RangeInput({
    id,
    label,
    tooltip,
    min,
    max,
    value,
    onChange,
}: {
    id: string
    label: string
    tooltip: string
    min: number
    max: number
    value: number
    onChange: (v: number) => void
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                                {tooltip}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <span className="text-sm font-semibold text-primary w-6 text-right">{value}</span>
            </div>
            <div className="flex items-center gap-3">
                <input
                    id={id}
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1 h-2 rounded-full bg-muted accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <span>{min}</span>–<span>{max}</span>
                </div>
            </div>
        </div>
    )
}

export function RICEForm({ register, watch, setValue, errors }: RiceFormProps) {
    const reach = watch('reach') || 5
    const impact = watch('impact') || 5
    const confidence = watch('confidence') || 80
    const effort = watch('effort') || 5

    const riceScore = calculateRiceScore(reach, impact, confidence, effort)
    const badgeClass = getRiceScoreBadgeClass(riceScore)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                    <h3 className="text-sm font-semibold">RICE Score</h3>
                    <p className="text-xs text-muted-foreground">Formula: (Reach × Impact × Confidence%) ÷ Effort</p>
                </div>
                <div className={cn('px-3 py-1 rounded-full text-sm font-bold', badgeClass)}>
                    {riceScore.toFixed(2)}
                </div>
            </div>

            {/* Visual score bar */}
            <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((riceScore / 20) * 100, 100)}%` }}
                />
            </div>

            <RangeInput
                id="reach"
                label="Reach"
                tooltip="How many users will this affect per quarter? (1 = very few, 10 = entire userbase)"
                min={1}
                max={10}
                value={reach}
                onChange={(v) => setValue('reach', v)}
            />

            <RangeInput
                id="impact"
                label="Impact"
                tooltip="How significantly does this improve the experience? (1 = minimal, 10 = massive)"
                min={1}
                max={10}
                value={impact}
                onChange={(v) => setValue('impact', v)}
            />

            <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                    <Label htmlFor="confidence" className="text-sm font-medium">Confidence</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                                How confident are you in your Reach and Impact estimates? Use lower values when guessing.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Select
                    value={String(confidence)}
                    onValueChange={(v) => setValue('confidence', Number(v))}
                >
                    <SelectTrigger id="confidence">
                        <SelectValue placeholder="Select confidence" />
                    </SelectTrigger>
                    <SelectContent>
                        {CONFIDENCE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <RangeInput
                id="effort"
                label="Effort"
                tooltip="How many person-weeks will this take to build? (1 = trivial, 10 = major multi-month project)"
                min={1}
                max={10}
                value={effort}
                onChange={(v) => setValue('effort', v)}
            />
        </div>
    )
}
