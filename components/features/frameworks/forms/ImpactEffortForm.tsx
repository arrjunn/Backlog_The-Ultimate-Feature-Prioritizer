'use client'

import { useState } from 'react'
import { getIEQuadrant, getIEQuadrantColor, getIEQuadrantDescription, getIEQuadrantLabel } from '@/lib/utils/impact-effort'

interface ImpactEffortFormData {
    ie_impact: number
    ie_effort: number
}

interface ImpactEffortFormProps {
    defaultValues?: Partial<ImpactEffortFormData>
    onChange?: (data: ImpactEffortFormData) => void
}

// Colors for each quadrant on the SVG grid
const QUADRANT_FILLS = {
    topLeft: '#dcfce7', // quick_win — green
    topRight: '#dbeafe', // major_project — blue
    bottomLeft: '#fef9c3', // fill_in — yellow
    bottomRight: '#fee2e2', // thankless_task — red
}

export function ImpactEffortForm({ defaultValues, onChange }: ImpactEffortFormProps) {
    const [impact, setImpact] = useState(defaultValues?.ie_impact ?? 5)
    const [effort, setEffort] = useState(defaultValues?.ie_effort ?? 5)

    const quadrant = getIEQuadrant(impact, effort)

    const emit = (imp: number, eff: number) => {
        onChange?.({ ie_impact: imp, ie_effort: eff })
    }

    // Dot position in the 200×200 grid
    // X = effort (1→low left, 10→high right), Y = impact (1→low bottom, 10→high top)
    const dotX = ((effort - 1) / 9) * 180 + 10
    const dotY = (1 - (impact - 1) / 9) * 180 + 10

    return (
        <div className="space-y-6">
            {/* Sliders */}
            <div className="space-y-4">
                {[
                    { label: 'Impact', tooltip: 'How much value will this deliver to users or the business?', value: impact, set: (v: number) => { setImpact(v); emit(v, effort) } },
                    { label: 'Effort', tooltip: 'How much effort/time will this take to build?', value: effort, set: (v: number) => { setEffort(v); emit(impact, v) } },
                ].map(({ label, tooltip, value, set }) => (
                    <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium">{label}</span>
                                <p className="text-xs text-muted-foreground mt-0.5">{tooltip}</p>
                            </div>
                            <span className="text-sm font-bold tabular-nums w-6 text-right">{value}</span>
                        </div>
                        <input
                            type="range" min={1} max={10} value={value}
                            onChange={(e) => set(Number(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border
                                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                                       [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
                                       [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground"><span>1</span><span>10</span></div>
                    </div>
                ))}
            </div>

            {/* Live 2×2 grid */}
            <div className="flex flex-col items-center gap-3">
                <svg viewBox="0 0 200 200" className="w-48 h-48 rounded-xl overflow-hidden border border-border">
                    {/* Quadrant fills */}
                    <rect x="0" y="0" width="100" height="100" fill={QUADRANT_FILLS.topLeft} />
                    <rect x="100" y="0" width="100" height="100" fill={QUADRANT_FILLS.topRight} />
                    <rect x="0" y="100" width="100" height="100" fill={QUADRANT_FILLS.bottomLeft} />
                    <rect x="100" y="100" width="100" height="100" fill={QUADRANT_FILLS.bottomRight} />
                    {/* Dividers */}
                    <line x1="100" y1="0" x2="100" y2="200" stroke="white" strokeWidth="2" />
                    <line x1="0" y1="100" x2="200" y2="100" stroke="white" strokeWidth="2" />
                    {/* Labels */}
                    <text x="50" y="14" textAnchor="middle" fontSize="8" fill="#16a34a" fontWeight="600">Quick Win</text>
                    <text x="150" y="14" textAnchor="middle" fontSize="8" fill="#2563eb" fontWeight="600">Major Project</text>
                    <text x="50" y="114" textAnchor="middle" fontSize="8" fill="#ca8a04" fontWeight="600">Fill-in</text>
                    <text x="150" y="114" textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="600">Thankless</text>
                    {/* Axis labels */}
                    <text x="100" y="198" textAnchor="middle" fontSize="7" fill="#6b7280">Effort →</text>
                    <text x="6" y="104" textAnchor="middle" fontSize="7" fill="#6b7280" transform="rotate(-90 6 104)">Impact →</text>
                    {/* Moving dot */}
                    <circle cx={dotX} cy={dotY} r="7" fill="#1f2937" opacity="0.85" />
                    <circle cx={dotX} cy={dotY} r="4" fill="white" />
                </svg>
                <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getIEQuadrantColor(quadrant)}`}>
                    {getIEQuadrantLabel(quadrant)}
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                    {getIEQuadrantDescription(quadrant)}
                </p>
            </div>
        </div>
    )
}

export type { ImpactEffortFormData }
