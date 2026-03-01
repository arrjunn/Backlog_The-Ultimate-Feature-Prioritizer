'use client'

import { useState } from 'react'
import { calculateJTBDScore, getJTBDColor, getJTBDOpportunityLabel, formatJobStatement } from '@/lib/utils/jtbd'

interface JTBDFormData {
    jtbd_job_statement: string
    jtbd_importance: number
    jtbd_satisfaction: number
}

interface JTBDFormProps {
    defaultValues?: Partial<JTBDFormData>
    onChange?: (data: JTBDFormData) => void
}

function Slider({ label, tooltip, value, onChange }: { label: string; tooltip: string; value: number; onChange: (v: number) => void }) {
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
                type="range" min={1} max={10} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground"><span>1</span><span>10</span></div>
        </div>
    )
}

export function JTBDForm({ defaultValues, onChange }: JTBDFormProps) {
    const [situation, setSituation] = useState('')
    const [motivation, setMotivation] = useState('')
    const [outcome, setOutcome] = useState('')
    const [importance, setImportance] = useState(defaultValues?.jtbd_importance ?? 5)
    const [satisfaction, setSatisfaction] = useState(defaultValues?.jtbd_satisfaction ?? 5)

    const jobStatement = (situation || motivation || outcome)
        ? formatJobStatement(situation || '…', motivation || '…', outcome || '…')
        : ''

    const score = calculateJTBDScore(importance, satisfaction)

    const emit = (overrides: Partial<{ importance: number; satisfaction: number }> = {}) => {
        const imp = overrides.importance ?? importance
        const sat = overrides.satisfaction ?? satisfaction
        onChange?.({
            jtbd_job_statement: jobStatement,
            jtbd_importance: imp,
            jtbd_satisfaction: sat,
        })
    }

    return (
        <div className="space-y-6">
            {/* Job Statement Builder */}
            <div className="space-y-3">
                <p className="text-sm font-medium">Job Statement</p>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">When...</span>
                        <input
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}
                            placeholder="e.g. I'm reviewing weekly priorities"
                            className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-1.5
                                       placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">I want to...</span>
                        <input
                            value={motivation}
                            onChange={(e) => setMotivation(e.target.value)}
                            placeholder="e.g. quickly see which requests score highest"
                            className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-1.5
                                       placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">So I can...</span>
                        <input
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value)}
                            placeholder="e.g. make faster decisions without manual work"
                            className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-1.5
                                       placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>
                {jobStatement && (
                    <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-sm italic text-muted-foreground">
                        {jobStatement}
                    </div>
                )}
            </div>

            <Slider
                label="Importance"
                tooltip="How important is this job to the user? (1 = nice to have, 10 = critical)"
                value={importance}
                onChange={(v) => { setImportance(v); emit({ importance: v }) }}
            />
            <Slider
                label="Satisfaction"
                tooltip="How satisfied are users with current solutions? (1 = very unsatisfied, 10 = fully satisfied)"
                value={satisfaction}
                onChange={(v) => { setSatisfaction(v); emit({ satisfaction: v }) }}
            />

            {/* Live Opportunity Score preview */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Opportunity Score</div>
                        <div className="text-2xl font-bold tabular-nums">{score.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {importance} + max({importance} − {satisfaction}, 0)
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getJTBDColor(score)}`}>
                        {getJTBDOpportunityLabel(score)}
                    </span>
                </div>
                {/* Satisfaction gap bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Importance</span>
                        <span>Satisfaction Gap</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-border overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-primary/40 rounded-full" style={{ width: `${(importance / 10) * 100}%` }} />
                        {importance > satisfaction && (
                            <div
                                className="absolute inset-y-0 rounded-full bg-red-400"
                                style={{
                                    left: `${(satisfaction / 10) * 100}%`,
                                    width: `${((importance - satisfaction) / 10) * 100}%`,
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export type { JTBDFormData }
