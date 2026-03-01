'use client'

import { useState } from 'react'
import { calculateWSJFScore, getWSJFScoreColor, getWSJFScoreLabel } from '@/lib/utils/rice'

interface WSJFFormData {
    wsjf_user_business_value: number
    wsjf_time_criticality: number
    wsjf_risk_reduction: number
    wsjf_job_size: number
}

interface WSJFFormProps {
    defaultValues?: Partial<WSJFFormData>
    onChange?: (data: WSJFFormData) => void
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

export function WSJFForm({ defaultValues, onChange }: WSJFFormProps) {
    const [ubv, setUbv] = useState(defaultValues?.wsjf_user_business_value ?? 5)
    const [tc, setTc] = useState(defaultValues?.wsjf_time_criticality ?? 5)
    const [rr, setRr] = useState(defaultValues?.wsjf_risk_reduction ?? 5)
    const [js, setJs] = useState(defaultValues?.wsjf_job_size ?? 5)

    const score = calculateWSJFScore(ubv, tc, rr, js)

    const emit = (vals: Partial<{ ubv: number; tc: number; rr: number; js: number }>) => {
        onChange?.({
            wsjf_user_business_value: vals.ubv ?? ubv,
            wsjf_time_criticality: vals.tc ?? tc,
            wsjf_risk_reduction: vals.rr ?? rr,
            wsjf_job_size: vals.js ?? js,
        })
    }

    return (
        <div className="space-y-6">
            {/* Brief explanation */}
            <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-sm text-muted-foreground">
                WSJF = Cost of Delay ÷ Job Size. Used in SAFe Agile frameworks to sequence work by economic impact.
            </div>

            <Slider
                label="User & Business Value"
                tooltip="What is the business and user value of doing this job?"
                value={ubv}
                onChange={(v) => { setUbv(v); emit({ ubv: v }) }}
            />
            <Slider
                label="Time Criticality"
                tooltip="How does the value decay over time? Is there a deadline or time window?"
                value={tc}
                onChange={(v) => { setTc(v); emit({ tc: v }) }}
            />
            <Slider
                label="Risk Reduction / Opportunity Enablement"
                tooltip="Does this reduce risk or enable future opportunities?"
                value={rr}
                onChange={(v) => { setRr(v); emit({ rr: v }) }}
            />
            <Slider
                label="Job Size"
                tooltip="What is the relative size of this job? (like story points)"
                value={js}
                onChange={(v) => { setJs(v); emit({ js: v }) }}
            />

            {/* Live WSJF score preview */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">WSJF Score</div>
                        <div className="text-2xl font-bold tabular-nums">{score.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            ({ubv} + {tc} + {rr}) ÷ {js}
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getWSJFScoreColor(score)}`}>
                        {getWSJFScoreLabel(score)}
                    </span>
                </div>
            </div>
        </div>
    )
}

export type { WSJFFormData }
